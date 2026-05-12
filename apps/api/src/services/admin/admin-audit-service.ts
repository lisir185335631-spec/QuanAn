// PRD-10 US-004 · admin audit service — logAdminAction (idempotent, append-only)
// AC-2: prisma create only · idempotent on traceId+eventType
// AC-7: write failure → console.error, never throws to caller

import { createHash } from 'node:crypto';

import { redactSensitiveFields } from '@/lib/admin/audit-helpers';
import { prisma } from '@/lib/prisma';

import type { Prisma } from '@prisma/client';

export interface LogAdminActionInput {
  actorAdminId: number;
  actorRole: string;
  eventCategory: string;
  eventType: string;
  payload?: Record<string, unknown>;
  traceId: string;
  ip: string;
  userAgent: string;
  sessionId: string;
  success: boolean;
  errorCode?: string | null;
  errorMessage?: string | null;
  targetUserId?: number | null;
  targetAccountId?: number | null;
  latencyMs?: number | null;
}

function makePayloadHash(payload: unknown): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

export async function logAdminAction(input: LogAdminActionInput): Promise<void> {
  try {
    // Idempotency: skip if traceId+eventType already written
    const existing = await prisma.adminAuditLog.findFirst({
      where: { traceId: input.traceId, eventType: input.eventType },
      select: { id: true },
    });
    if (existing) return;

    const redacted = redactSensitiveFields(input.payload ?? {}) as Record<string, unknown>;
    if (input.latencyMs !== null && input.latencyMs !== undefined) {
      redacted['latencyMs'] = input.latencyMs;
    }

    await prisma.adminAuditLog.create({
      data: {
        actorAdminId: input.actorAdminId,
        actorRole: input.actorRole,
        eventCategory: input.eventCategory,
        eventType: input.eventType,
        payloadHash: makePayloadHash(redacted),
        payload: redacted as unknown as Prisma.InputJsonValue,
        traceId: input.traceId,
        ip: input.ip,
        userAgent: input.userAgent,
        sessionId: input.sessionId,
        success: input.success,
        errorCode: input.errorCode ?? null,
        errorMessage: input.errorMessage ?? null,
        targetUserId: input.targetUserId ?? null,
        targetAccountId: input.targetAccountId ?? null,
      },
    });
  } catch (err) {
    console.error('[ADMIN AUDIT WRITE FAILED]', err);
  }
}
