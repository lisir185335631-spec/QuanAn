/**
 * Account router — PRD-2 US-002
 * AC-2: getActive returns active IpAccount; switchActive updates user.activeAccountId
 * globalProcedure used for switchActive (modifies User table — GLOBAL TABLE per AGENTS.md §1)
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router } from '@/trpc/trpc';
import { protectedProcedure, globalProcedure } from '@/trpc/middleware/account-isolation';

export const accountRouter = router({
  getActive: protectedProcedure.query(async ({ ctx }) => {
    const { prisma, activeAccountId } = ctx;

    const account = await prisma.ipAccount.findUnique({
      where: { id: activeAccountId! },
      select: {
        id: true,
        name: true,
        platform: true,
        stage: true,
        industry: true,
        followersRange: true,
      },
    });

    return account ?? null;
  }),

  switchActive: globalProcedure
    .input(z.object({ accountId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const { prisma, user } = ctx;

      if (!user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      // Verify account belongs to this user and is active
      const account = await prisma.ipAccount.findFirst({
        where: { id: input.accountId, userId: user.id, isActive: true },
        select: { id: true },
      });

      if (!account) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'account_not_found' });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { activeAccountId: input.accountId },
      });

      return { ok: true };
    }),
});
