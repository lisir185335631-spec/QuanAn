/**
 * ipAccounts router — PRD-2 US-003
 * AC-1: 6 procedures (list/active/create/update/delete/switchActive) · all pass RLS middleware
 * AC-5: list returns all user-owned accounts (ip_accounts RLS uses user_id isolation)
 * AC-6: switchActive writes audit_log 'account.switch' + updates user.activeAccountId
 * Note: Zod schemas inlined — @quanqn/schemas/entities has the canonical definition for client use
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import type { Prisma } from '@prisma/client';
import { router } from '@/trpc/trpc';
import { protectedProcedure, globalProcedure } from '@/trpc/middleware/account-isolation';

const ACCOUNT_SELECT = {
  id: true,
  name: true,
  industry: true,
  platform: true,
  stage: true,
  isActive: true,
  followersRange: true,
} satisfies Prisma.IpAccountSelect;

const createIpAccountInput = z.object({
  name: z.string().min(1).max(100),
  industry: z.string().min(1).max(64),
  platform: z.string().min(1).max(32),
  stage: z.string().min(1).max(32),
});

const updateIpAccountInput = createIpAccountInput.partial();

export const ipAccountsRouter = router({
  /** AC-5: returns all user-owned ip_accounts; ip_accounts RLS filters by current_user_id */
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.ipAccount.findMany({
      select: ACCOUNT_SELECT,
      orderBy: { createdAt: 'asc' },
    });
  }),

  /** Returns the currently active ip_account */
  active: protectedProcedure.query(async ({ ctx }) => {
    const { prisma, activeAccountId } = ctx;
    const account = await prisma.ipAccount.findUnique({
      where: { id: activeAccountId! },
      select: ACCOUNT_SELECT,
    });
    return account ?? null;
  }),

  /** Creates a new ip_account for the current user */
  create: protectedProcedure
    .input(createIpAccountInput)
    .mutation(async ({ ctx, input }) => {
      const { prisma, user, traceId } = ctx;
      return prisma.ipAccount.create({
        data: {
          ...input,
          userId: user!.id,
          traceId: traceId ?? null,
        },
        select: ACCOUNT_SELECT,
      });
    }),

  /** Updates the currently active ip_account */
  update: protectedProcedure
    .input(updateIpAccountInput)
    .mutation(async ({ ctx, input }) => {
      const { prisma, activeAccountId } = ctx;
      return prisma.ipAccount.update({
        where: { id: activeAccountId! },
        data: input,
        select: ACCOUNT_SELECT,
      });
    }),

  /** Soft-deletes an ip_account (isActive=false · archivedAt=now) */
  delete: protectedProcedure
    .input(z.object({ accountId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      // ip_accounts RLS (user_id isolation) prevents touching another user's account
      await prisma.ipAccount.update({
        where: { id: input.accountId },
        data: { isActive: false, archivedAt: new Date() },
      });
      return { ok: true };
    }),

  /**
   * AC-6: updates user.activeAccountId + writes audit_log 'account.switch'
   * Uses globalProcedure: modifies users table (global) + must bypass per-account RLS
   */
  switchActive: globalProcedure
    .input(z.object({ accountId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const { prisma, user, traceId } = ctx;

      if (!user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      // Verify account belongs to this user (no RLS — globalProcedure)
      const account = await prisma.ipAccount.findFirst({
        where: { id: input.accountId, userId: user.id },
        select: { id: true },
      });

      if (!account) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'account_not_found' });
      }

      const previousAccountId = user.activeAccountId ?? null;

      await prisma.user.update({
        where: { id: user.id },
        data: { activeAccountId: input.accountId },
      });

      // AC-6: write audit_log 'account.switch'
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          accountId: input.accountId,
          eventType: 'account.switch',
          eventCategory: 'account',
          resourceType: 'ip_account',
          resourceId: input.accountId,
          payload: { previousAccountId } as Prisma.InputJsonValue,
          traceId: traceId ?? null,
          success: true,
        },
      });

      // Return new activeAccountId so client can refresh middleware (AC-6)
      return { ok: true, activeAccountId: input.accountId };
    }),
});
