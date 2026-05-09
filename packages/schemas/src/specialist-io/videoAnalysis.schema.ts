/**
 * VideoAnalysis Specialist I/O schemas — PRD-5 US-001
 * Rewritten from PRD-2 URL-based to copy-based (viral mode)
 */

import { z } from 'zod';

/** /video-analysis 工具页输入: 爆款文案全文 + 可选标题 */
export const analyzeVideoInput = z.object({
  lastTitle: z.string().max(200).optional(),
  lastCopy: z.string().min(10).max(3000),
});

export type AnalyzeVideoInput = z.infer<typeof analyzeVideoInput>;
