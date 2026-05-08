/**
 * IpAccount zod schema — PRD-2 US-003
 * AC-3: 7 field schema (id/userId/name/industry/platform/stage/isActive)
 */

import { z } from 'zod';

export const ipAccountSchema = z.object({
  id: z.number().int().positive(),
  userId: z.number().int().positive(),
  name: z.string().min(1).max(100),
  industry: z.string().min(1).max(64),
  platform: z.string().min(1).max(32),
  stage: z.string().min(1).max(32),
  isActive: z.boolean(),
});

export const createIpAccountInput = ipAccountSchema.omit({ id: true, userId: true, isActive: true });

export const updateIpAccountInput = createIpAccountInput.partial();

export type IpAccountFields = z.infer<typeof ipAccountSchema>;
export type CreateIpAccountInput = z.infer<typeof createIpAccountInput>;
export type UpdateIpAccountInput = z.infer<typeof updateIpAccountInput>;
