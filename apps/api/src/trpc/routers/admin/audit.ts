// PRD-11 US-016 · adminRouter.audit — 5 procedures + listMine
// byTraceId/byUserId/byAdminId/search/exportPdf
// SHIELD: prisma.contains mode:insensitive · 不允许 raw SQL string interpolation
// SHIELD: Promise.all 并行多表查询 · 不允许串行 await A; await B

import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { logAdminAction } from '@/services/admin/admin-audit-service';
import { generateForensicPdf } from '@/services/admin/audit/pdf-forensic.service';
import { adminProcedure } from '@/trpc/procedures/admin';
import { adminTrpcRouter } from '@/trpc/trpc-admin';

// ── Constants ──────────────────────────────────────────────────────────────

const HIGH_RISK_CATEGORIES = ['high_risk_action', 'security_alert', 'cross_account_query'] as const;

// ── Input schemas ──────────────────────────────────────────────────────────

const byTraceIdInput = z.object({
  traceId: z.string().min(8),
});

const byUserIdInput = z.object({
  userId: z.number().int(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(50),
  eventCategory: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

const byAdminIdInput = z.object({
  adminUserId: z.number().int(),
});

const searchInput = z.object({
  keyword: z.string().min(2).max(100),
  eventCategory: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  target: z.string().optional(),
});

const exportPdfInput = z.object({
  traceId: z.string().min(8),
  caseNumber: z.string().min(1),
  reason: z.string().min(1),
});

// ── Helpers ────────────────────────────────────────────────────────────────

function getIp(ctx: { req: Request }): string {
  return (
    ctx.req.headers.get('x-forwarded-for') ??
    ctx.req.headers.get('x-real-ip') ??
    '127.0.0.1'
  );
}

function getActorMode(ctx: { req: Request }): string | null {
  return ctx.req.headers.get('x-actor-mode');
}

// ── Router ─────────────────────────────────────────────────────────────────

export const adminAuditRouter = adminTrpcRouter({
  /** Returns the current admin user's last 50 audit log entries. */
  listMine: adminProcedure.query(async ({ ctx }) => {
    const adminUserId = ctx.activeAdminUser?.id;
    if (!adminUserId) return [];

    return ctx.prisma.adminAuditLog.findMany({
      where: { actorAdminId: adminUserId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        eventType: true,
        eventCategory: true,
        createdAt: true,
        payload: true,
      },
    });
  }),

  /**
   * Cross-table trace lookup — audit_log + admin_audit_log + cost_log + feedback_log.
   * AC-2: $transaction + SET LOCAL · Promise.all 并行 · 按 createdAt 升序合并。
   * Writes audit for 'cross_account_query' + 'view_trace_timeline'.
   * Returns { timeline: [], summary: { eventCount: 0, spanMs: 0 } } when not found.
   */
  byTraceId: adminProcedure
    .input(byTraceIdInput)
    .query(async ({ ctx, input }) => {
      const { traceId } = input;
      const adminId = ctx.activeAdminUser?.id ?? 0;
      const adminRole = ctx.activeAdminUser?.role ?? 'admin';
      const ip = getIp(ctx);
      const ua = ctx.req.headers.get('user-agent') ?? '';
      const sessionId = ctx.adminSession?.id ?? '';

      // $transaction + SET LOCAL (AC-2 · LD-A3)
      const [auditLogs, adminAuditLogs, costLogs, feedbackLogs] =
        await ctx.prisma.$transaction(async (tx) => {
          await tx.$executeRaw`SELECT set_config('app.role', 'admin', true)`;

          // SHIELD: Promise.all 并行 · 不串行
          return Promise.all([
            tx.auditLog.findMany({
              where: { traceId },
              orderBy: { createdAt: 'asc' },
              select: {
                id: true,
                eventType: true,
                eventCategory: true,
                createdAt: true,
                payload: true,
                userId: true,
                success: true,
              },
            }),
            tx.adminAuditLog.findMany({
              where: { traceId },
              orderBy: { createdAt: 'asc' },
              select: {
                id: true,
                eventType: true,
                eventCategory: true,
                createdAt: true,
                payload: true,
                actorAdminId: true,
                success: true,
              },
            }),
            tx.costLog.findMany({
              where: { traceId },
              orderBy: { createdAt: 'asc' },
              select: {
                id: true,
                eventType: true,
                createdAt: true,
                costUsd: true,
                modelUsed: true,
                userId: true,
                success: true,
              },
            }),
            tx.feedbackLog.findMany({
              where: { traceId },
              orderBy: { createdAt: 'asc' },
              select: {
                id: true,
                createdAt: true,
                rating: true,
                agentId: true,
                userId: true,
              },
            }),
          ]);
        });

      // Normalize to common shape and merge sorted by createdAt asc
      const timeline = [
        ...auditLogs.map((r) => ({
          source: 'audit_log' as const,
          id: Number(r.id),
          traceId,
          eventType: r.eventType,
          eventCategory: r.eventCategory,
          createdAt: r.createdAt,
          payload: r.payload,
        })),
        ...adminAuditLogs.map((r) => ({
          source: 'admin_audit_log' as const,
          id: r.id,
          traceId,
          eventType: r.eventType,
          eventCategory: r.eventCategory,
          createdAt: r.createdAt,
          payload: r.payload,
        })),
        ...costLogs.map((r) => ({
          source: 'cost_log' as const,
          id: Number(r.id),
          traceId,
          eventType: r.eventType,
          eventCategory: 'cost',
          createdAt: r.createdAt,
          payload: { costUsd: r.costUsd?.toString() ?? null, modelUsed: r.modelUsed },
        })),
        ...feedbackLogs.map((r) => ({
          source: 'feedback_log' as const,
          id: r.id,
          traceId,
          eventType: 'user_feedback',
          eventCategory: 'feedback',
          createdAt: r.createdAt,
          payload: { rating: r.rating, agentId: r.agentId },
        })),
      ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      // Write audit (LD-A3 append-only) — cross_account_query + view_trace_timeline
      await Promise.all([
        logAdminAction({
          actorAdminId: adminId,
          actorRole: adminRole,
          eventCategory: 'cross_account_query',
          eventType: 'cross_account_query',
          payload: { traceId },
          traceId: ctx.traceId,
          ip,
          userAgent: ua,
          sessionId,
          success: true,
        }),
        logAdminAction({
          actorAdminId: adminId,
          actorRole: adminRole,
          eventCategory: 'data_query',
          eventType: 'view_trace_timeline',
          payload: { traceId, eventCount: timeline.length },
          traceId: ctx.traceId,
          ip,
          userAgent: ua,
          sessionId,
          success: true,
        }),
      ]);

      if (timeline.length === 0) {
        return { timeline: [], summary: { eventCount: 0, spanMs: 0 } };
      }

      const spanMs =
        timeline[timeline.length - 1]!.createdAt.getTime() -
        timeline[0]!.createdAt.getTime();

      return {
        timeline,
        summary: { eventCount: timeline.length, spanMs },
      };
    }),

  /**
   * User audit timeline from audit_log with pagination, eventCategory filter, time range.
   * Returns timeline + grouped map + pagination metadata.
   */
  byUserId: adminProcedure
    .input(byUserIdInput)
    .query(async ({ ctx, input }) => {
      const { userId, page, pageSize, eventCategory, startDate, endDate } = input;

      const where = {
        userId,
        ...(eventCategory ? { eventCategory } : {}),
        ...(startDate ?? endDate
          ? {
              createdAt: {
                ...(startDate ? { gte: startDate } : {}),
                ...(endDate ? { lte: endDate } : {}),
              },
            }
          : {}),
      };

      // SHIELD: Promise.all 并行 · 不串行
      const [logs, total] = await Promise.all([
        ctx.prisma.auditLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: pageSize,
          skip: (page - 1) * pageSize,
          select: {
            id: true,
            eventType: true,
            eventCategory: true,
            createdAt: true,
            payload: true,
            traceId: true,
            success: true,
          },
        }),
        ctx.prisma.auditLog.count({ where }),
      ]);

      // Group by eventCategory
      const grouped: Record<string, typeof logs> = {};
      for (const log of logs) {
        const cat = log.eventCategory;
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat]!.push(log);
      }

      return { timeline: logs, grouped, total, page, pageSize };
    }),

  /**
   * Admin operation timeline from admin_audit_log.
   * Restricted to super_admin OR readonly_admin with actorMode='legal' (法务模式).
   * High-risk events are flagged with isHighRisk=true.
   */
  byAdminId: adminProcedure
    .input(byAdminIdInput)
    .query(async ({ ctx, input }) => {
      const role = ctx.activeAdminUser?.role ?? '';
      const actorMode = getActorMode(ctx);

      // SHIELD: check actorMode=legal for readonly_admin · 不只 super_admin
      if (
        !['super_admin', 'readonly_admin'].includes(role) ||
        (role === 'readonly_admin' && actorMode !== 'legal')
      ) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'insufficient_role' });
      }

      const logs = await ctx.prisma.adminAuditLog.findMany({
        where: { actorAdminId: input.adminUserId },
        orderBy: { createdAt: 'desc' },
        take: 200,
        select: {
          id: true,
          eventType: true,
          eventCategory: true,
          createdAt: true,
          payload: true,
          traceId: true,
          success: true,
          actorRole: true,
          actorMode: true,
        },
      });

      return logs.map((log) => ({
        ...log,
        isHighRisk: (HIGH_RISK_CATEGORIES as readonly string[]).includes(log.eventCategory),
      }));
    }),

  /**
   * Full-text search across admin_audit_log.
   * SHIELD: prisma.contains mode:insensitive — prevents SQL injection.
   * Caps at take:200.
   */
  search: adminProcedure
    .input(searchInput)
    .query(async ({ ctx, input }) => {
      const { keyword, eventCategory, startDate, endDate, target } = input;

      // SHIELD: prisma.contains mode:insensitive prevents SQL injection
      const results = await ctx.prisma.adminAuditLog.findMany({
        where: {
          OR: [
            { eventType: { contains: keyword, mode: 'insensitive' } },
            { eventCategory: { contains: keyword, mode: 'insensitive' } },
            { targetEntity: { contains: keyword, mode: 'insensitive' } },
          ],
          ...(eventCategory ? { eventCategory } : {}),
          ...(startDate ?? endDate
            ? {
                createdAt: {
                  ...(startDate ? { gte: startDate } : {}),
                  ...(endDate ? { lte: endDate } : {}),
                },
              }
            : {}),
          ...(target
            ? { targetEntity: { contains: target, mode: 'insensitive' } }
            : {}),
        },
        take: 200,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          eventType: true,
          eventCategory: true,
          createdAt: true,
          traceId: true,
          actorAdminId: true,
          actorRole: true,
          targetUserId: true,
          targetEntity: true,
          success: true,
        },
      });

      return results;
    }),

  /**
   * Generate a forensic PDF for a trace ID.
   * Calls byTraceId logic + pdf-forensic.service (US-018).
   * Returns { base64, traceId, caseNumber }.
   */
  exportPdf: adminProcedure
    .input(exportPdfInput)
    .mutation(async ({ ctx, input }) => {
      const { traceId, caseNumber, reason } = input;
      const adminId = ctx.activeAdminUser?.id ?? 0;
      const adminRole = ctx.activeAdminUser?.role ?? '';
      const ip = getIp(ctx);
      const ua = ctx.req.headers.get('user-agent') ?? '';
      const sessionId = ctx.adminSession?.id ?? '';

      // SHIELD: Promise.all 并行 · 不串行
      const [auditLogs, adminAuditLogs, costLogs, feedbackLogs] = await Promise.all([
        ctx.prisma.auditLog.findMany({
          where: { traceId },
          orderBy: { createdAt: 'asc' },
          take: 500,
        }),
        ctx.prisma.adminAuditLog.findMany({
          where: { traceId },
          orderBy: { createdAt: 'asc' },
          take: 500,
        }),
        ctx.prisma.costLog.findMany({
          where: { traceId },
          orderBy: { createdAt: 'asc' },
          take: 500,
        }),
        ctx.prisma.feedbackLog.findMany({
          where: { traceId },
          orderBy: { createdAt: 'asc' },
          take: 500,
        }),
      ]);

      const timeline = [...auditLogs, ...adminAuditLogs, ...costLogs, ...feedbackLogs].sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
      );

      // Generate PDF via pdf-forensic.service (US-018 will provide real impl)
      const base64 = await generateForensicPdf({
        traceId,
        caseNumber,
        reason,
        timeline,
        generatedByAdminId: adminId,
        generatedByRole: adminRole,
      });

      // Write audit (LD-A3 append-only)
      await logAdminAction({
        actorAdminId: adminId,
        actorRole: adminRole,
        eventCategory: 'export',
        eventType: 'export_forensic_pdf',
        payload: { traceId, caseNumber, reason },
        traceId: ctx.traceId,
        ip,
        userAgent: ua,
        sessionId,
        success: true,
      });

      return { base64, traceId, caseNumber };
    }),
});
