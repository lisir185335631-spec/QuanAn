/**
 * aiVideoFrontend schema — PRD-6 US-008
 * Frontend-only zod schema for /ai-video form validation.
 * scenesCount uses z.preprocess to coerce select string → number.
 */

import { z } from 'zod';

export const aiVideoFrontendInput = z.object({
  sourceCopy: z.string().min(10, 'sourceCopy 至少 10 个字符').max(3000, '原始文案不超过3000字符'),
  scenesCount: z.preprocess(
    (v) => (v === '' || v === undefined ? 5 : Number(v)),
    z.number().int().min(5, '镜头数应在 5-8 之间').max(8, '镜头数应在 5-8 之间'),
  ),
  imageStyle: z.enum(['vivid', 'natural']).default('natural'),
});
