/**
 * ipAccounts router — PRD-2 US-003
 * AC-1: 6 procedures (list/active/create/update/delete/switchActive) · all pass RLS middleware
 * AC-5: list returns all user-owned accounts (ip_accounts RLS uses user_id isolation)
 * AC-6: switchActive writes audit_log 'account.switch' + updates user.activeAccountId
 * Note: Zod schemas inlined — @quanan/schemas/entities has the canonical definition for client use
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { protectedProcedure, globalProcedure } from '@/trpc/middleware/account-isolation';
import { router } from '@/trpc/trpc';

import type { Prisma } from '@prisma/client';


const ACCOUNT_SELECT = {
  id: true,
  name: true,
  industry: true,
  platform: true,
  stage: true,
  isActive: true,
  followersRange: true,
  personalInfo: true,
  ipPositioning: true,
} satisfies Prisma.IpAccountSelect;

const createIpAccountInput = z.object({
  name: z.string().min(1).max(100),
  industry: z.string().min(1).max(64),
  platform: z.string().min(1).max(32),
  stage: z.string().min(1).max(32).default('starter'),
  personalInfo: z.string().max(500).optional(),
});

const updateIpAccountInput = createIpAccountInput.partial();

export const ipAccountsRouter = router({
  /**
   * AC-5: returns all user-owned ip_accounts.
   * Uses globalProcedure so the /accounts management page is accessible to
   * authenticated users who do not yet have an activeAccountId (new users).
   * Explicit where: { userId } replaces RLS since RLS is bypassed.
   */
  list: globalProcedure.query(async ({ ctx }) => {
    const { user, prisma } = ctx;
    if (!user) throw new TRPCError({ code: 'UNAUTHORIZED' });

    const accounts = await prisma.ipAccount.findMany({
      where: { userId: user.id },
      select: ACCOUNT_SELECT,
      orderBy: { createdAt: 'asc' },
    });

    // PRD-15 US-001 AC-4: in dev mode, auto-bind 5 mock accounts if user has none
    if (process.env.NODE_ENV === 'development' && accounts.length === 0) {
      const mockNames = [
        { name: 'AI 创业者小张', industry: 'enterprise', platform: 'douyin', stage: 'starter', followersRange: '0-1000', ipPositioning: 'ip-creator' },
        { name: 'OPC 经营者老王', industry: 'enterprise', platform: 'douyin', stage: 'growth', followersRange: '1000-10000', ipPositioning: 'opc-founder' },
        { name: '实体店主陈姐', industry: 'food', platform: 'douyin', stage: 'starter', followersRange: '0-1000', ipPositioning: 'traditional-transform' },
        { name: 'MCN 矩阵号', industry: 'self_media', platform: 'douyin', stage: 'growth', followersRange: '1000-10000', ipPositioning: 'mcn-manager' },
        { name: 'Demo 演示号', industry: 'beauty', platform: 'douyin', stage: 'starter', followersRange: '0-1000', ipPositioning: 'demo' },
      ];
      const created = await Promise.all(
        mockNames.map((acc) =>
          prisma.ipAccount.create({
            data: { ...acc, userId: user.id },
            select: ACCOUNT_SELECT,
          }),
        ),
      );
      // Set first mock account as active so protectedProcedure works immediately
      const firstId = created[0]?.id;
      if (firstId) {
        await prisma.user.update({
          where: { id: user.id },
          data: { activeAccountId: firstId },
        });
      }
      return created;
    }

    return accounts;
  }),

  /** Returns the currently active ip_account */
  active: globalProcedure.query(async ({ ctx }) => {
    const { user, prisma, activeAccountId } = ctx;
    if (!user) throw new TRPCError({ code: 'UNAUTHORIZED' });
    if (!activeAccountId) return null;
    const account = await prisma.ipAccount.findFirst({
      where: { id: activeAccountId, userId: user.id },
      select: ACCOUNT_SELECT,
    });
    return account ?? null;
  }),

  /** Creates a new ip_account for the current user (globalProcedure: no activeAccountId required) */
  create: globalProcedure
    .input(createIpAccountInput)
    .mutation(async ({ ctx, input }) => {
      const { prisma, user, traceId } = ctx;
      if (!user) throw new TRPCError({ code: 'UNAUTHORIZED' });
      return prisma.ipAccount.create({
        data: {
          ...input,
          userId: user.id,
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
