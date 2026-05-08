/**
 * StepData zod schema — PRD-2 US-003
 * AC-4: stepKey enum (9 steps) + inputs/result Json
 */

import { z } from 'zod';

export const STEP_KEYS = [
  'step1',
  'step3',
  'step3b',
  'step4',
  'step4b',
  'step5',
  'step6',
  'step7',
  'step8',
] as const;

export type StepKey = (typeof STEP_KEYS)[number];

export const stepKeySchema = z.enum(STEP_KEYS);

export const saveStepDataInput = z.object({
  stepKey: stepKeySchema,
  inputs: z.record(z.unknown()),
});

export const getStepDataInput = z.object({
  stepKey: stepKeySchema,
});

export type SaveStepDataInput = z.infer<typeof saveStepDataInput>;
export type GetStepDataInput = z.infer<typeof getStepDataInput>;
