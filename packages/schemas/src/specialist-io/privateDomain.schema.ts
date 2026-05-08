/**
 * PrivateDomain Specialist I/O schemas — PRD-2 US-005
 * AC-5: input/output schemas in packages/schemas/src/specialist-io/
 */

import { z } from 'zod';

export const generatePrivateDomainInput = z.object({
  stepKey: z.string().min(1).max(64),
  stage: z.enum(['awareness', 'interest', 'desire', 'action', 'loyalty', 'advocacy']).optional(),
  context: z.record(z.unknown()).optional(),
});

export const privateDomainResultSchema = z.object({
  id: z.number().int().positive(),
  content: z.string(),
  agentId: z.string(),
  traceId: z.string().nullable(),
  createdAt: z.date(),
});

export type GeneratePrivateDomainInput = z.infer<typeof generatePrivateDomainInput>;
export type PrivateDomainResult = z.infer<typeof privateDomainResultSchema>;
