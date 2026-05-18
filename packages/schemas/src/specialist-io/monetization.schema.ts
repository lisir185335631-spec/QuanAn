/**
 * Monetization Specialist I/O schemas — PRD-2 US-004 + PRD-15 US-004
 */

import { z } from 'zod';

export { Step4bInputSchema as MonetizationInputSchema } from './step-inputs.schema';
export type { Step4bInput as MonetizationInput } from './step-inputs.schema';

export const generateMonetizationInput = z.object({
  stepKey: z.string().min(1).max(64).default('step4b'),
  industryContext: z.record(z.unknown()).optional(),
  audienceProfile: z.record(z.unknown()).optional(),
});

export const monetizationResultSchema = z.object({
  id: z.number().int().positive(),
  content: z.string(),
  agentId: z.string(),
  traceId: z.string().nullable(),
  createdAt: z.date(),
});

export type GenerateMonetizationInput = z.infer<typeof generateMonetizationInput>;
export type MonetizationResult = z.infer<typeof monetizationResultSchema>;
