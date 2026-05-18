// PRD-12 US-004 · adminRouter.reviewTrending — 6 procedures
// list/detail/approve/reject/batchAction/configRules
// SHIELD: approve + batchAction.approve 共用 _createTrendingItemInTx — 唯一 trendingItem.create 点 (LD-A-5)
// SHIELD: approve $transaction 原子 · update queue + create trendingItem + update queue.trendingItemId
// SHIELD: configRules 仅 super_admin · 非 super_admin → privilege_escalation audit + 403
// SHIELD: batchAction queueIds max 100 · each item 单独 audit

import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import type { Prisma, PrismaClient } from '@prisma/client';

import { logAdminAction } from '@/services/admin/admin-audit-service';
import { adminProcedure } from '@/trpc/procedures/admin';
import { adminTrpcRouter } from '@/trpc/trpc-admin';

// ── Constants ─────────────────────────────────────────────────────────────

const BATCH_MAX = 100;

// ── Helpers ───────────────────────────────────────────────────────────────

function getIp(ctx: { req: Request }): string {
  return (
    ctx.req.headers.get('x-forwarded-for') ??
    ctx.req.headers.get('x-real-ip') ??
    '0.0.0.0'
  );
}

type AdminCtx = Parameters<Parameters<typeof adminProcedure.mutation>[0]>[0]['ctx'];

async function guardMutation(ctx: AdminCtx): Promise<void> {
  if (ctx.activeAdminUser?.role === 'readonly_admin') {
    void logAdminAction({
      actorAdminId: ctx.activeAdminUser.id,
      actorRole: ctx.activeAdminUser.role,
      eventCategory: 'security_alert',
      eventType: 'privilege_escalation',
      payload: { role: ctx.activeAdminUser.role, action: 'mutation_attempt' },
      traceId: ctx.traceId,
      ip: getIp(ctx),
      userAgent: ctx.req.headers.get('user-agent') ?? '',
      sessionId: ctx.adminSession?.id ?? '',
      success: false,
      errorCode: 'FORBIDDEN',
    });
    throw new TRPCError({ code: 'FORBIDDEN', message: 'privilege_escalation' });
  }
}

async function guardSuperAdmin(ctx: AdminCtx): Promise<void> {
  if (ctx.activeAdminUser?.role !== 'super_admin') {
    void logAdminAction({
      actorAdminId: ctx.activeAdminUser!.id,
      actorRole: ctx.activeAdminUser!.role,
      eventCategory: 'security_alert',
      eventType: 'privilege_escalation',
      payload: { role: ctx.activeAdminUser!.role, action: 'configRules_attempt' },
      traceId: ctx.traceId,
      ip: getIp(ctx),
      userAgent: ctx.req.headers.get('user-agent') ?? '',
      sessionId: ctx.adminSession?.id ?? '',
      success: false,
      errorCode: 'FORBIDDEN',
    });
    throw new TRPCError({ code: 'FORBIDDEN', message: 'privilege_escalation' });
  }
}

type TxClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

interface QueueApproveData {
  sourcePlatform: string;
  sourceUrl: string;
  sourceItemId: string | null;
  rawContent: unknown;
}

/**
 * ★ LD-A-5 单点: 唯一允许 trendingItem.create 的函数
 * 在 $transaction 内被 approve + batchAction.approve 共用
 */
async function _createTrendingItemInTx(
  tx: TxClient,
  queue: QueueApproveData,
  vendorOverride?: string,
): Promise<number> {
  const raw = queue.rawContent as Record<string, unknown>;
  const trendingItem = await tx.trendingItem.create({
    data: {
      platform: queue.sourcePlatform,
      sourceUrl: queue.sourceUrl,
      sourceItemId: queue.sourceItemId,
      vendor: vendorOverride ?? (raw['vendor'] as string | undefined) ?? queue.sourcePlatform,
      title: (raw['title'] as string | undefined) ?? queue.sourceUrl,
      contentText: (raw['contentText'] as string | undefined) ?? (raw['content'] as string | undefined) ?? undefined,
      industry: (raw['industry'] as string | undefined) ?? undefined,
      presentStyle: (raw['presentStyle'] as string | undefined) ?? undefined,
      authorName: (raw['authorName'] as string | undefined) ?? undefined,
      authorFollowers: typeof raw['authorFollowers'] === 'number' ? raw['authorFollowers'] : undefined,
      viewCount: typeof raw['viewCount'] === 'number' ? BigInt(raw['viewCount']) : BigInt(0),
      likeCount: typeof raw['likeCount'] === 'number' ? raw['likeCount'] : 0,
      shareCount: typeof raw['shareCount'] === 'number' ? raw['shareCount'] : 0,
      commentCount: typeof raw['commentCount'] === 'number' ? raw['commentCount'] : 0,
      publishedAt: raw['publishedAt'] ? new Date(raw['publishedAt'] as string) : undefined,
    },
  });
  return trendingItem.id;
}

// ── Input schemas ─────────────────────────────────────────────────────────

const listInput = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  statusFilter: z
    .enum(['pending', 'approved', 'rejected', 'auto_approved', 'auto_rejected'])
    .optional(),
  platformFilter: z.string().optional(),
  dateRange: z
    .object({
      from: z.coerce.date().optional(),
      to: z.coerce.date().optional(),
    })
    .optional(),
  autoVerdictFilter: z.enum(['auto_approved', 'auto_rejected', 'needs_review']).optional(),
});

const detailInput = z.object({
  queueId: z.number().int(),
});

const approveInput = z.object({
  queueId: z.number().int(),
  vendor: z.string().min(1).max(32).optional(),
});

const rejectInput = z.object({
  queueId: z.number().int(),
  rejectReason: z.string().min(5),
});

const batchActionInput = z.object({
  queueIds: z.array(z.number().int()).min(1).max(BATCH_MAX),
  action: z.enum(['approve', 'reject']),
  reason: z.string().optional(),
});

const configRulesInput = z.object({
  ruleType: z.enum(['banned_word', 'sampling_rate', 'industry_quota']),
  ruleKey: z.string().min(1),
  ruleValue: z.record(z.unknown()),
  enabled: z.boolean().default(true),
});

// ── Router ────────────────────────────────────────────────────────────────

export const reviewTrendingRouter = adminTrpcRouter({
  /**
   * Paginated trending review queue list with filters.
   * AC-2: $transaction + SET LOCAL (via adminRLS middleware ctx.adminPrisma)
   * Audit: data_query/list_trending_review_queue
   */
  list: adminProcedure.input(listInput).query(async ({ input, ctx }) => {
    const { page, pageSize, statusFilter, platformFilter, dateRange, autoVerdictFilter } = input;
    const db = ctx.adminPrisma ?? ctx.prisma;
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};
    if (statusFilter) where['status'] = statusFilter;
    if (platformFilter) where['sourcePlatform'] = platformFilter;
    if (autoVerdictFilter) where['autoVerdict'] = autoVerdictFilter;
    if (dateRange?.from || dateRange?.to) {
      const rangeFilter: Record<string, Date> = {};
      if (dateRange.from) rangeFilter['gte'] = dateRange.from;
      if (dateRange.to) rangeFilter['lte'] = dateRange.to;
      where['fetchedAt'] = rangeFilter;
    }

    const [items, count] = await Promise.all([
      db.trendingReviewQueue.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { fetchedAt: 'desc' },
        select: {
          id: true,
          sourcePlatform: true,
          sourceItemId: true,
          sourceUrl: true,
          autoVerdict: true,
          status: true,
          reviewerAdminId: true,
          reviewedAt: true,
          rejectReason: true,
          trendingItemId: true,
          fetchedAt: true,
        },
      }),
      db.trendingReviewQueue.count({ where }),
    ]);

    void logAdminAction({
      actorAdminId: ctx.activeAdminUser!.id,
      actorRole: ctx.activeAdminUser!.role,
      eventCategory: 'data_query',
      eventType: 'list_trending_review_queue',
      payload: { page, pageSize, statusFilter, platformFilter, autoVerdictFilter },
      traceId: ctx.traceId,
      ip: getIp(ctx),
      userAgent: ctx.req.headers.get('user-agent') ?? '',
      sessionId: ctx.adminSession?.id ?? '',
      success: true,
    });

    return { items, count, page, pageSize };
  }),

  /**
   * Full detail: rawContent + autoScanResult + chain trace (trendingItemId if approved).
   * AC-3
   */
  detail: adminProcedure.input(detailInput).query(async ({ input, ctx }) => {
    const db = ctx.adminPrisma ?? ctx.prisma;
    const item = await db.trendingReviewQueue.findUnique({ where: { id: input.queueId } });
    if (!item) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'trending_review_queue_not_found' });
    }
    return item;
  }),

  /**
   * Approve a queue item — atomic $transaction.
   * AC-4/AC-5/AC-9. LD-A-5: single trendingItem.create via _createTrendingItemInTx.
   * Audit: data_mutation/trending_review_approve.
   */
  approve: adminProcedure.input(approveInput).mutation(async ({ input, ctx }) => {
    await guardMutation(ctx);
    const { queueId, vendor } = input;

    const result = await ctx.prisma.$transaction(async (tx) => {
      const queue = await tx.trendingReviewQueue.findUnique({ where: { id: queueId } });

      if (!queue) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'trending_review_queue_not_found' });
      }
      if (queue.status === 'approved') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'already_approved' });
      }
      if (queue.trendingItemId !== null) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'already_has_trending_item' });
      }

      await tx.trendingReviewQueue.update({
        where: { id: queueId },
        data: { status: 'approved', reviewerAdminId: ctx.activeAdminUser!.id, reviewedAt: new Date() },
      });

      // ★ LD-A-5 single point delegated to _createTrendingItemInTx
      const trendingItemId = await _createTrendingItemInTx(tx as unknown as TxClient, queue, vendor);

      await tx.trendingReviewQueue.update({
        where: { id: queueId },
        data: { trendingItemId },
      });

      return { queueId, trendingItemId };
    });

    void logAdminAction({
      actorAdminId: ctx.activeAdminUser!.id,
      actorRole: ctx.activeAdminUser!.role,
      eventCategory: 'data_mutation',
      eventType: 'trending_review_approve',
      payload: { queueId, trendingItemId: result.trendingItemId },
      traceId: ctx.traceId,
      ip: getIp(ctx),
      userAgent: ctx.req.headers.get('user-agent') ?? '',
      sessionId: ctx.adminSession?.id ?? '',
      success: true,
    });

    return result;
  }),

  /**
   * Reject a queue item.
   * AC-6: rejectReason min 5. AC-9: already rejected → error.
   * Audit: trending_review_reject.
   */
  reject: adminProcedure.input(rejectInput).mutation(async ({ input, ctx }) => {
    await guardMutation(ctx);
    const db = ctx.adminPrisma ?? ctx.prisma;
    const { queueId, rejectReason } = input;

    const queue = await db.trendingReviewQueue.findUnique({
      where: { id: queueId },
      select: { id: true, status: true },
    });

    if (!queue) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'trending_review_queue_not_found' });
    }
    if (queue.status === 'rejected') {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'already_rejected' });
    }

    await db.trendingReviewQueue.update({
      where: { id: queueId },
      data: {
        status: 'rejected',
        reviewerAdminId: ctx.activeAdminUser!.id,
        reviewedAt: new Date(),
        rejectReason,
      },
    });

    void logAdminAction({
      actorAdminId: ctx.activeAdminUser!.id,
      actorRole: ctx.activeAdminUser!.role,
      eventCategory: 'data_mutation',
      eventType: 'trending_review_reject',
      payload: { queueId, rejectReason },
      traceId: ctx.traceId,
      ip: getIp(ctx),
      userAgent: ctx.req.headers.get('user-agent') ?? '',
      sessionId: ctx.adminSession?.id ?? '',
      success: true,
    });

    return { queueId, status: 'rejected' as const };
  }),

  /**
   * Batch approve or reject up to 100 queue items.
   * AC-7: each item separate audit. AC-10: queueIds > 100 → zod error. AC-11: readonly_admin 403.
   * batchAction.approve also delegates to _createTrendingItemInTx (LD-A-5 compliant).
   */
  batchAction: adminProcedure.input(batchActionInput).mutation(async ({ input, ctx }) => {
    await guardMutation(ctx);
    const db = ctx.adminPrisma ?? ctx.prisma;
    const { queueIds, action, reason } = input;

    const results: Array<{ queueId: number; success: boolean; error?: string }> = [];

    for (const queueId of queueIds) {
      try {
        const queue = await db.trendingReviewQueue.findUnique({
          where: { id: queueId },
          select: {
            id: true,
            status: true,
            trendingItemId: true,
            rawContent: true,
            sourcePlatform: true,
            sourceUrl: true,
            sourceItemId: true,
          },
        });

        if (!queue) {
          results.push({ queueId, success: false, error: 'not_found' });
          continue;
        }

        if (action === 'approve') {
          if (queue.status === 'approved' || queue.trendingItemId !== null) {
            results.push({ queueId, success: false, error: 'already_processed' });
            continue;
          }
          await ctx.prisma.$transaction(async (tx) => {
            await tx.trendingReviewQueue.update({
              where: { id: queueId },
              data: {
                status: 'approved',
                reviewerAdminId: ctx.activeAdminUser!.id,
                reviewedAt: new Date(),
              },
            });
            // ★ LD-A-5 delegated to _createTrendingItemInTx (same function as approve)
            const trendingItemId = await _createTrendingItemInTx(tx as unknown as TxClient, queue);
            await tx.trendingReviewQueue.update({
              where: { id: queueId },
              data: { trendingItemId },
            });
          });
        } else {
          if (queue.status === 'rejected') {
            results.push({ queueId, success: false, error: 'already_rejected' });
            continue;
          }
          await db.trendingReviewQueue.update({
            where: { id: queueId },
            data: {
              status: 'rejected',
              reviewerAdminId: ctx.activeAdminUser!.id,
              reviewedAt: new Date(),
              rejectReason: reason ?? 'batch_reject',
            },
          });
        }

        results.push({ queueId, success: true });

        // AC-7: each item 单独 audit
        void logAdminAction({
          actorAdminId: ctx.activeAdminUser!.id,
          actorRole: ctx.activeAdminUser!.role,
          eventCategory: 'data_mutation',
          eventType: `trending_review_batch_${action}`,
          payload: { queueId, action, reason },
          traceId: ctx.traceId,
          ip: getIp(ctx),
          userAgent: ctx.req.headers.get('user-agent') ?? '',
          sessionId: ctx.adminSession?.id ?? '',
          success: true,
        });
      } catch (err) {
        results.push({ queueId, success: false, error: String(err) });
      }
    }

    return { results, total: queueIds.length, succeeded: results.filter((r) => r.success).length };
  }),

  /**
   * Update auto review rules — super_admin only.
   * AC-8: non-super_admin → privilege_escalation audit + 403.
   * Audit: config_change/auto_review_rule_update.
   */
  configRules: adminProcedure.input(configRulesInput).mutation(async ({ input, ctx }) => {
    await guardSuperAdmin(ctx);
    const db = ctx.adminPrisma ?? ctx.prisma;
    const { ruleType, ruleKey, ruleValue, enabled } = input;

    const rule = await db.autoReviewRule.upsert({
      where: { ruleType_ruleKey: { ruleType, ruleKey } },
      update: {
        ruleValue: ruleValue as Prisma.InputJsonValue,
        enabled,
        updatedByAdminId: ctx.activeAdminUser!.id,
      },
      create: {
        ruleType,
        ruleKey,
        ruleValue: ruleValue as Prisma.InputJsonValue,
        enabled,
        updatedByAdminId: ctx.activeAdminUser!.id,
      },
    });

    void logAdminAction({
      actorAdminId: ctx.activeAdminUser!.id,
      actorRole: ctx.activeAdminUser!.role,
      eventCategory: 'config_change',
      eventType: 'auto_review_rule_update',
      payload: { ruleType, ruleKey, enabled },
      traceId: ctx.traceId,
      ip: getIp(ctx),
      userAgent: ctx.req.headers.get('user-agent') ?? '',
      sessionId: ctx.adminSession?.id ?? '',
      success: true,
    });

    return rule;
  }),
});
