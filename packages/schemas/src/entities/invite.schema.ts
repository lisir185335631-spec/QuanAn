// @quanan/schemas/entities/invite — PRD-2 US-006

import { z } from 'zod';

export const inviteCodeSchema = z.object({
  id: z.number().int().positive(),
  code: z.string().max(32),
  isActive: z.boolean(),
  maxUses: z.number().int(),
  usedCount: z.number().int(),
  usedById: z.number().int().positive().nullable(),
  usedAt: z.date().nullable(),
  expiresAt: z.date().nullable(),
  createdAt: z.date(),
});

export const redeemInviteInput = z.object({
  code: z.string().min(1).max(32),
});

export type InviteCodeFields = z.infer<typeof inviteCodeSchema>;
export type RedeemInviteInput = z.infer<typeof redeemInviteInput>;
