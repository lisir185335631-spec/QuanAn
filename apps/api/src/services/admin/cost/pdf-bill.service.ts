// PRD-11 US-014 · PDF Bill Service — generateMonthlyBill
// SHIELD: payloadHash must redact sensitive fields before hashing (anti_patterns: PRD-9+LD-A-3)
// SHIELD: signer info from adminId lookup, never hardcoded (anti_patterns: PRD-7 US-013)
// SHIELD: PDF footer must contain SHA-256 hash (anti_patterns: LD-A-3)

import { createHash } from 'node:crypto';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import type { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';

import { PdfBillTemplate } from '@quanan/ui/admin/pdf';
import type { PdfBillData, PdfBillLineItem } from '@quanan/ui/admin/pdf';

// Fields to redact when computing payloadHash (SHIELD: anti_pattern PRD-9+LD-A-3)
const REDACT_KEYS = new Set(['password', 'token', 'apiKey', 'secret', 'cookie', 'authorization']);

function redactPayload(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = REDACT_KEYS.has(k.toLowerCase()) ? '[REDACTED]' : v;
  }
  return out;
}

export interface GenerateBillResult {
  buffer: Buffer;
  filename: string;
  pdfHash: string;
  rowCount: number;
  isEmpty: boolean;
}

export async function generateMonthlyBill(
  month: string, // "YYYY-MM"
  adminId: number,
  prismaClient: PrismaClient,
): Promise<GenerateBillResult> {
  // ── 1. Parse month bounds ──────────────────────────────────────────────────
  const [yearStr, monthStr] = month.split('-');
  const year = parseInt(yearStr!, 10);
  const mon = parseInt(monthStr!, 10);
  const startDate = new Date(Date.UTC(year, mon - 1, 1));
  const endDate = new Date(Date.UTC(year, mon, 1)); // exclusive upper bound

  // ── 2. Fetch admin actor info ──────────────────────────────────────────────
  const actor = await prismaClient.adminUser.findUnique({
    where: { id: adminId },
    select: { email: true, role: true },
  });
  const actorEmail = actor?.email ?? `admin-${adminId}`;
  const actorRole = actor?.role ?? 'unknown';

  // ── 3. Fetch YoY comparison (previous year same month) ────────────────────
  const prevYearStart = new Date(Date.UTC(year - 1, mon - 1, 1));
  const prevYearEnd = new Date(Date.UTC(year - 1, mon, 1));

  const [currentAgg, prevYearAgg] = await Promise.all([
    prismaClient.costLog.aggregate({
      where: { createdAt: { gte: startDate, lt: endDate } },
      _sum: { costUsd: true },
      _count: { _all: true },
    }),
    prismaClient.costLog.aggregate({
      where: { createdAt: { gte: prevYearStart, lt: prevYearEnd } },
      _sum: { costUsd: true },
    }),
  ]);

  const totalCost = currentAgg._sum.costUsd ?? new Prisma.Decimal('0');
  const rowCount = currentAgg._count._all;
  const isEmpty = rowCount === 0;

  // YoY percent
  let yoyPercent: string | null = null;
  const prevCost = prevYearAgg._sum.costUsd;
  if (prevCost && prevCost.greaterThan(new Prisma.Decimal('0'))) {
    const pct = totalCost.minus(prevCost).div(prevCost).mul(new Prisma.Decimal('100'));
    const sign = pct.gte(new Prisma.Decimal('0')) ? '+' : '';
    yoyPercent = `${sign}${pct.toFixed(1)}%`;
  }

  // ── 4. Fetch line items (chunked, 50 rows/page) ───────────────────────────
  // Group by agentId (specialist) for line items
  const items: PdfBillLineItem[] = [];

  if (!isEmpty) {
    const breakdown = await prismaClient.costLog.groupBy({
      by: ['agentId'],
      where: { createdAt: { gte: startDate, lt: endDate } },
      _sum: { costUsd: true },
      _count: { _all: true },
      orderBy: { _sum: { costUsd: 'desc' } },
    });

    for (const row of breakdown) {
      items.push({
        label: row.agentId ?? '(unknown specialist)',
        totalCost: (row._sum.costUsd ?? new Prisma.Decimal('0')).toString(),
        callCount: row._count._all,
        dimension: 'specialist',
      });
    }

    // If no breakdown rows (agentId is all null), fall back to model breakdown
    if (items.length === 0) {
      const modelBreakdown = await prismaClient.costLog.groupBy({
        by: ['modelUsed'],
        where: { createdAt: { gte: startDate, lt: endDate } },
        _sum: { costUsd: true },
        _count: { _all: true },
        orderBy: { _sum: { costUsd: 'desc' } },
      });
      for (const row of modelBreakdown) {
        items.push({
          label: row.modelUsed ?? '(unknown model)',
          totalCost: (row._sum.costUsd ?? new Prisma.Decimal('0')).toString(),
          callCount: row._count._all,
          dimension: 'model',
        });
      }
    }
  }

  // ── 5. Build payload hash (SHIELD: redact sensitive fields) ───────────────
  const payloadForHash = redactPayload({
    month,
    actorId: adminId,
    totalCost: totalCost.toString(),
    rowCount,
    itemCount: items.length,
    generatedAt: new Date().toISOString(),
  });
  const pdfHash = createHash('sha256').update(JSON.stringify(payloadForHash)).digest('hex');

  // ── 6. Build template data ─────────────────────────────────────────────────
  const billData: PdfBillData = {
    month,
    generatedAt: new Date().toISOString(),
    actorEmail,
    actorRole,
    actorId: adminId,
    totalCost: totalCost.toString(),
    yoyPercent,
    items,
    payloadHash: pdfHash,
    isEmpty,
  };

  // ── 7. Render PDF (React PDF) ─────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(React.createElement(PdfBillTemplate, { data: billData }) as any);

  return {
    buffer,
    filename: `cost-bill-${month}.pdf`,
    pdfHash,
    rowCount,
    isEmpty,
  };
}
