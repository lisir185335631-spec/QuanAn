/**
 * BoomGenerate Specialist I/O schemas — PRD-2 US-004
 */

import { z } from 'zod';

export const generateBoomInput = z.object({
  stepKey: z.string().min(1).max(64),
  theme: z.string().max(64).optional(),
  tone: z.string().max(32).optional(),
  context: z.record(z.unknown()).optional(),
});

export const boomResultSchema = z.object({
  id: z.number().int().positive(),
  content: z.string(),
  agentId: z.string(),
  traceId: z.string().nullable(),
  createdAt: z.date(),
});

export type GenerateBoomInput = z.infer<typeof generateBoomInput>;
export type BoomResult = z.infer<typeof boomResultSchema>;
