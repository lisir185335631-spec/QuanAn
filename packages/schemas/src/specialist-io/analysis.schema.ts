/**
 * AnalysisAgent I/O schemas — PRD-5 US-001
 * viral mode: 爆款文案拆解 + 仿写
 * structural mode: 文案结构评分 + 优化建议
 */

import { z } from 'zod';
import { HOT_ELEMENT_KEYS_22 } from './constants';

// ── Inputs ────────────────────────────────────────────────────────────────────

/** structural mode 输入: 用户自己的文案 */
export const analysisStructuralInput = z.object({
  copy: z.string().min(10, { message: '文案至少10字' }).max(3000, { message: '文案不超过3000字' }),
});

/** viral mode 输入: 爆款文案 + 可选标题 */
export const analysisViralInput = z.object({
  lastTitle: z.string().max(200).optional(),
  lastCopy: z.string().min(10).max(3000),
});

// ── Outputs ───────────────────────────────────────────────────────────────────

/** structural mode 输出: 多维度评分 + 优化建议 */
export const analysisStructuralOutput = z.object({
  scores: z.object({
    hook: z.number().int().min(0).max(100),
    structure: z.number().int().min(0).max(100),
    emotion: z.number().int().min(0).max(100),
    specificity: z.number().int().min(0).max(100),
    cta: z.number().int().min(0).max(100),
    overall: z.number().int().min(0).max(100),
  }),
  optimizations: z
    .array(
      z.object({
        dimension: z.string(),
        issue: z.string(),
        suggestion: z.string(),
      }),
    )
    .min(3)
    .max(5),
  rewriteSnippet: z.string().min(50).max(200),
});

/** viral mode 输出: 元素拆解 + 洞察 + 仿写版 */
export const analysisViralOutput = z.object({
  analysis: z.object({
    elements: z.array(z.enum(HOT_ELEMENT_KEYS_22)),
    structure: z.string(),
    hookType: z.string(),
    viralFormula: z.string(),
  }),
  insights: z
    .array(
      z.object({
        element: z.string(),
        explanation: z.string(),
        impact: z.enum(['高', '中', '低']),
      }),
    )
    .min(3),
  rewriteVersion: z.string().min(50),
});

// ── Type inference ────────────────────────────────────────────────────────────

export type AnalysisStructuralInput = z.infer<typeof analysisStructuralInput>;
export type AnalysisViralInput = z.infer<typeof analysisViralInput>;
export type AnalysisStructuralOutput = z.infer<typeof analysisStructuralOutput>;
export type AnalysisViralOutput = z.infer<typeof analysisViralOutput>;
