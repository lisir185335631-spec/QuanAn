// PRD-11 US-020 · adminRouter.invites — 6 procedures
// list/create/batchImport/invalidate/detail/campaignFunnel
// SHIELD: invalidate 高风险 · 走 Approval Gates stub(super_admin→auto_executed · admin→pending)
// SHIELD: batchImport CSV chunk 100 · ≤ 10000 行限制 · papaparse 解析
// SHIELD: SET LOCAL via $transaction (adminRLS bypass)

import { randomBytes } from 'node:crypto';

import { TRPCError } from '@trpc/server';
import Papa from 'papaparse';
import { z } from 'zod';

import { logAdminAction } from '@/services/admin/admin-audit-service';
import { getCampaignFunnel } from '@/services/admin/invites/campaign.service';
import { adminProcedure } from '@/trpc/procedures/admin';
import { adminTrpcRouter } from '@/trpc/trpc-admin';

// ── Constants ─────────────────────────────────────────────────────────────

const BATCH_IMPORT_MAX_ROWS = 10_000;
const BATCH_CHUNK_SIZE = 100;

// ── Helpers ───────────────────────────────────────────────────────────────

function getIp(ctx: { req: Request }): string {
  return (
    ctx.req.headers.get('x-forwarded-for') ??
    ctx.req.headers.get('x-real-ip') ??
    '127.0.0.1'
  );
}

function generateCode(): string {
  return randomBytes(8).toString('hex').toUpperCase();
}

async function guardMutation(ctx: Parameters<Parameters<typeof adminProcedure.mutation>[0]>[0]['ctx']): Promise<void> {
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

// ── Input schemas ─────────────────────────────────────────────────────────

const listInput = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  statusFilter: z.enum(['active', 'inactive', 'used', 'expired']).optional(),
  campaignFilter: z.string().optional(),
});

const createInput = z.object({
  code: z.string().min(1).max(32).optional(),
  campaign: z.string().max(64).optional(),
  expiresAt: z.coerce.date().optional(),
  quotaLimit: z.number().int().min(1).default(1),
});

const batchImportInput = z.object({
  csvData: z.string().min(1),
});

const invalidateInput = z.object({
  code: z.string().min(1),
  reason: z.string().min(5),
});

const detailInput = z.object({
  code: z.string().min(1),
});

const campaignFunnelInput = z.object({
  campaignKey: z.string().min(1),
});

// ── Router ────────────────────────────────────────────────────────────────

export const invitesRouter = adminTrpcRouter({
  /**
   * Paginated invite code list with search + filters.
   * AC-2: $transaction + SET LOCAL · writes audit.
   */
  list: adminProcedure.input(listInput).query(async ({ input, ctx }) => {
    const { page, pageSize, search, statusFilter, campaignFilter } = input;
    const db = ctx.adminPrisma ?? ctx.prisma;
    const skip = (page - 1) * pageSize;
    const now = new Date();

    const where: Record<string, unknown> = {};

    if (search) {
      where['OR'] = [
        { code: { contains: search, mode: 'insensitive' } },
        { campaign: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (campaignFilter) {
      where['campaign'] = campaignFilter;
    }

    if (statusFilter === 'active') {
      where['isActive'] = true;
      where['usedAt'] = null;
    } else if (statusFilter === 'inactive') {
      where['isActive'] = false;
    } else if (statusFilter === 'used') {
      where['usedAt'] = { not: null };
    } else if (statusFilter === 'expired') {
      where['expiresAt'] = { lt: now };
    }

    const [codes, count] = await Promise.all([
      db.inviteCode.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          code: true,
          isActive: true,
          maxUses: true,
          usedCount: true,
          expiresAt: true,
          campaign: true,
          notes: true,
          createdAt: true,
          usedAt: true,
          usedById: true,
        },
      }),
      db.inviteCode.count({ where }),
    ]);

    void logAdminAction({
      actorAdminId: ctx.activeAdminUser!.id,
      actorRole: ctx.activeAdminUser!.role,
      eventCategory: 'admin_action',
      eventType: 'list_invite_codes',
      payload: { page, pageSize, search, statusFilter, campaignFilter },
      traceId: ctx.traceId,
      ip: getIp(ctx),
      userAgent: ctx.req.headers.get('user-agent') ?? '',
      sessionId: ctx.adminSession?.id ?? '',
      success: true,
    });

    return { codes, count, page, pageSize };
  }),

  /**
   * Create a single invite code.
   * AC-3: low risk audit · no Approval Gate.
   */
  create: adminProcedure.input(createInput).mutation(async ({ input, ctx }) => {
    await guardMutation(ctx);
    const db = ctx.adminPrisma ?? ctx.prisma;
    const { campaign, expiresAt, quotaLimit } = input;
    const code = input.code ?? generateCode();

    const invite = await db.inviteCode.create({
      data: {
        code,
        campaign,
        expiresAt,
        maxUses: quotaLimit,
        createdById: ctx.activeAdminUser!.id,
        isActive: true,
      },
    });

    void logAdminAction({
      actorAdminId: ctx.activeAdminUser!.id,
      actorRole: ctx.activeAdminUser!.role,
      eventCategory: 'admin_action',
      eventType: 'create_invite_code',
      payload: { code, campaign, expiresAt, quotaLimit },
      traceId: ctx.traceId,
      ip: getIp(ctx),
      userAgent: ctx.req.headers.get('user-agent') ?? '',
      sessionId: ctx.adminSession?.id ?? '',
      success: true,
    });

    return invite;
  }),

  /**
   * Batch import invite codes from CSV.
   * AC-4: papaparse · chunk 100 · ≤ 10000 rows · skip duplicates + return errors.
   */
  batchImport: adminProcedure.input(batchImportInput).mutation(async ({ input, ctx }) => {
    await guardMutation(ctx);
    const db = ctx.adminPrisma ?? ctx.prisma;

    const parsed = Papa.parse<Record<string, string>>(input.csvData, {
      header: true,
      skipEmptyLines: true,
    });

    const rows = parsed.data;

    if (rows.length > BATCH_IMPORT_MAX_ROWS) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `batchImport: row count ${rows.length} exceeds limit ${BATCH_IMPORT_MAX_ROWS}`,
      });
    }

    const errors: Array<{ row: number; code: string; reason: string }> = [];
    const imported: string[] = [];

    for (let i = 0; i < rows.length; i += BATCH_CHUNK_SIZE) {
      const chunk = rows.slice(i, i + BATCH_CHUNK_SIZE);

      for (let j = 0; j < chunk.length; j++) {
        const row = chunk[j]!;
        const rowNum = i + j + 1;
        const code = row['code']?.trim();

        if (!code) {
          errors.push({ row: rowNum, code: '', reason: 'missing code' });
          continue;
        }

        const expiresAt = row['expiresAt'] ? new Date(row['expiresAt']) : undefined;
        const quotaLimit = row['quotaLimit'] ? parseInt(row['quotaLimit'], 10) : 1;
        const campaign = row['campaign']?.trim() || undefined;

        try {
          await db.inviteCode.create({
            data: {
              code,
              campaign,
              expiresAt,
              maxUses: isNaN(quotaLimit) ? 1 : quotaLimit,
              createdById: ctx.activeAdminUser!.id,
              isActive: true,
            },
          });
          imported.push(code);
        } catch (err) {
          const pgErr = err as { code?: string };
          if (pgErr.code === 'P2002') {
            // duplicate code — skip + record error
            errors.push({ row: rowNum, code, reason: 'duplicate code' });
          } else {
            errors.push({ row: rowNum, code, reason: String(err) });
          }
        }
      }
    }

    void logAdminAction({
      actorAdminId: ctx.activeAdminUser!.id,
      actorRole: ctx.activeAdminUser!.role,
      eventCategory: 'admin_action',
      eventType: 'batch_import_invite_codes',
      payload: { totalRows: rows.length, imported: imported.length, errors: errors.length },
      traceId: ctx.traceId,
      ip: getIp(ctx),
      userAgent: ctx.req.headers.get('user-agent') ?? '',
      sessionId: ctx.adminSession?.id ?? '',
      success: true,
    });

    return { imported: imported.length, errors };
  }),

  /**
   * Invalidate (deactivate) an invite code.
   * AC-5: HIGH RISK · Approval Gates stub.
   *   super_admin → auto_executed (create approval_request + execute)
   *   admin → pending (create approval_request, no execute)
   * AC-8: already invalidated → ValidationError('already invalidated')
   */
  invalidate: adminProcedure.input(invalidateInput).mutation(async ({ input, ctx }) => {
    await guardMutation(ctx);
    const db = ctx.adminPrisma ?? ctx.prisma;
    const { code, reason } = input;

    const invite = await db.inviteCode.findUnique({
      where: { code },
      select: { id: true, code: true, isActive: true, campaign: true },
    });

    if (!invite) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'invite_code_not_found' });
    }

    if (!invite.isActive) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'already invalidated' });
    }

    const actorRole = ctx.activeAdminUser!.role;
    const actionPayload = { code, campaign: invite.campaign, reason };
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    if (actorRole === 'super_admin') {
      // Approval Gate: super_admin → auto_executed
      const approvalRequest = await db.approvalRequest.create({
        data: {
          requesterAdminId: ctx.activeAdminUser!.id,
          requesterRole: actorRole,
          actionType: 'invalidate_invite_code',
          actionPayload,
          riskLevel: 'high',
          requireDualApproval: false,
          requesterReason: reason,
          status: 'auto_executed',
          expiresAt,
          approverAdminId: ctx.activeAdminUser!.id,
          executedAt: new Date(),
        },
      });

      await db.inviteCode.update({
        where: { code },
        data: { isActive: false },
      });

      void logAdminAction({
        actorAdminId: ctx.activeAdminUser!.id,
        actorRole: actorRole,
        eventCategory: 'high_risk_action',
        eventType: 'invalidate_invite_code',
        payload: actionPayload,
        approvalRequestId: approvalRequest.id,
        traceId: ctx.traceId,
        ip: getIp(ctx),
        userAgent: ctx.req.headers.get('user-agent') ?? '',
        sessionId: ctx.adminSession?.id ?? '',
        success: true,
      });

      return { status: 'auto_executed' as const, approvalRequestId: approvalRequest.id };
    } else {
      // admin → pending, wait for super_admin approval
      const approvalRequest = await db.approvalRequest.create({
        data: {
          requesterAdminId: ctx.activeAdminUser!.id,
          requesterRole: actorRole,
          actionType: 'invalidate_invite_code',
          actionPayload,
          riskLevel: 'high',
          requireDualApproval: false,
          requesterReason: reason,
          status: 'pending',
          expiresAt,
        },
      });

      void logAdminAction({
        actorAdminId: ctx.activeAdminUser!.id,
        actorRole: actorRole,
        eventCategory: 'high_risk_action',
        eventType: 'approval_request_create',
        payload: { actionType: 'invalidate_invite_code', ...actionPayload },
        approvalRequestId: approvalRequest.id,
        traceId: ctx.traceId,
        ip: getIp(ctx),
        userAgent: ctx.req.headers.get('user-agent') ?? '',
        sessionId: ctx.adminSession?.id ?? '',
        success: true,
      });

      return { status: 'pending' as const, approvalRequestId: approvalRequest.id };
    }
  }),

  /**
   * Detail: invite code metadata + activation history + step9 progress.
   * AC-6: invite code + who used it / when / IP + step9 progress.
   */
  detail: adminProcedure.input(detailInput).query(async ({ input, ctx }) => {
    const db = ctx.adminPrisma ?? ctx.prisma;
    const { code } = input;

    const invite = await db.inviteCode.findUnique({
      where: { code },
      select: {
        id: true,
        code: true,
        isActive: true,
        maxUses: true,
        usedCount: true,
        expiresAt: true,
        campaign: true,
        notes: true,
        createdAt: true,
        usedAt: true,
        usedById: true,
        createdBy: { select: { id: true, email: true } },
        usedBy: {
          select: {
            id: true,
            email: true,
            isActivated: true,
            createdAt: true,
          },
        },
      },
    });

    if (!invite) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'invite_code_not_found' });
    }

    type ActivationEntry = {
      id: bigint;
      userId: number | null;
      eventType: string;
      createdAt: Date;
      ipAddress: string | null;
      userAgent: string | null;
    };

    // activation history from audit log
    const activationHistory: ActivationEntry[] = await db.auditLog.findMany({
      where: {
        OR: [
          { payload: { path: ['code'], equals: code } },
          ...(invite.usedById ? [{ userId: invite.usedById }] : []),
        ],
        eventType: { in: ['redeem_invite', 'invite_redeemed', 'redeem'] },
      },
      orderBy: { createdAt: 'asc' },
      take: 50,
      select: {
        id: true,
        userId: true,
        eventType: true,
        createdAt: true,
        ipAddress: true,
        userAgent: true,
      },
    }).catch((): ActivationEntry[] => []);

    // step9 progress for the user who used this invite
    let step9Progress: Array<{ stepKey: string; status: string; updatedAt: Date }> = [];
    if (invite.usedById) {
      const account = await db.ipAccount.findFirst({
        where: { userId: invite.usedById },
        select: { id: true },
      }).catch(() => null);

      if (account) {
        step9Progress = await db.stepData.findMany({
          where: { accountId: account.id },
          orderBy: { stepKey: 'asc' },
          select: { stepKey: true, status: true, updatedAt: true },
        }).catch(() => []);
      }
    }

    void logAdminAction({
      actorAdminId: ctx.activeAdminUser!.id,
      actorRole: ctx.activeAdminUser!.role,
      eventCategory: 'admin_action',
      eventType: 'view_invite_detail',
      payload: { code },
      traceId: ctx.traceId,
      ip: getIp(ctx),
      userAgent: ctx.req.headers.get('user-agent') ?? '',
      sessionId: ctx.adminSession?.id ?? '',
      success: true,
    });

    return { invite, activationHistory, step9Progress };
  }),

  /**
   * Campaign conversion funnel — 4 stages.
   * AC-7: calls campaign.service.getCampaignFunnel · returns [{stage, count}].
   */
  campaignFunnel: adminProcedure.input(campaignFunnelInput).query(async ({ input, ctx }) => {
    const funnel = await getCampaignFunnel(input.campaignKey);

    void logAdminAction({
      actorAdminId: ctx.activeAdminUser!.id,
      actorRole: ctx.activeAdminUser!.role,
      eventCategory: 'admin_action',
      eventType: 'view_campaign_funnel',
      payload: { campaignKey: input.campaignKey },
      traceId: ctx.traceId,
      ip: getIp(ctx),
      userAgent: ctx.req.headers.get('user-agent') ?? '',
      sessionId: ctx.adminSession?.id ?? '',
      success: true,
    });

    // Convert to [{stage, count}] format as specified in AC-7
    return [
      { stage: 'registered', count: funnel.stages.registered },
      { stage: 'activated', count: funnel.stages.activated },
      { stage: 'step9Completed', count: funnel.stages.step9Completed },
      { stage: 'd30Retained', count: funnel.stages.d30Retained },
    ];
  }),
});
