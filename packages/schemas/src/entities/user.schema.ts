/**
 * User zod schema — US-005
 * lastLoginAt + lastLoginIp optional fields for admin user management.
 */

import { z } from 'zod';

export const userSchema = z.object({
  id: z.number().int().positive(),
  email: z.string().email(),
  name: z.string(),
  role: z.string(),
  plan: z.string(),
  industry: z.string().nullable().optional(),
  isActivated: z.boolean(),
  lastLoginAt: z.date().nullable().optional(),
  lastLoginIp: z.string().max(45).nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type UserFields = z.infer<typeof userSchema>;
