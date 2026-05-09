/**
 * invite router — PRD-2 US-006
 * AC-3: 1 procedure (redeem) · check InviteCode + mark used + link user
 * AC-4: duplicate redeem → CONFLICT 409
 * Uses globalProcedure: InviteCode is a global table (LD-009 exception, no per-account RLS)
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { globalProcedure } from '@/trpc/middleware/account-isolation';
import { router } from '@/trpc/trpc';

import type { Prisma } from '@prisma/client';


const redeemInput = z.object({
  code: z.string().min(1).max(32),
});

const INVITE_SELECT = {
  id: true,
  code: true,
  isActive: true,
  maxUses: true,
  usedCount: true,
  usedById: true,
  usedAt: true,
  expiresAt: true,
  createdAt: true,
} satisfies Prisma.InviteCodeSelect;

export const inviteRouter = router({
  /**
   * Redeem an invite code — associates the authenticated user with the code.
   * AC-3: checks code exists + marks used + links userId
   * AC-4: already used (usedAt set or usedCount >= maxUses) → CONFLICT 409
   */
  redeem: globalProcedure
    .input(redeemInput)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'login_required' });
      }

      const invite = await ctx.prisma.inviteCode.findUnique({
        where: { code: input.code },
        select: INVITE_SELECT,
      });

      if (!invite) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'invite_code_not_found' });
      }

      if (
        !invite.isActive ||
        invite.usedCount >= invite.maxUses ||
        invite.usedAt !== null ||
        (invite.expiresAt !== null && invite.expiresAt < new Date())
      ) {
        throw new TRPCError({ code: 'CONFLICT', message: 'invite_code_already_used' });
      }

      return ctx.prisma.inviteCode.update({
        where: { code: input.code },
        data: {
          usedById: ctx.user.id,
          usedAt: new Date(),
          usedCount: { increment: 1 },
        },
        select: INVITE_SELECT,
      });
    }),
});
