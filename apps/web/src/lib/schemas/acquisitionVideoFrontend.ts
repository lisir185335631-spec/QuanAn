/**
 * acquisitionVideoFrontend schema — PRD-6 US-006
 * Frontend-only zod schema for /acquisition-video form validation.
 * Separated from the page component so tests can import without @/ alias resolution.
 */

import { z } from 'zod';

export const acquisitionVideoFrontendInput = z.object({
  sourceCopy: z.string().min(10, 'sourceCopy 至少 10 个字符').max(3000, '原始文案不能超过3000字符'),
  conversionGoal: z.string().min(1, '转化目标必填'),
  platform: z.string().optional(),
  duration: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.enum(['15s', '30s', '60s', '180s']).optional(),
  ),
});
