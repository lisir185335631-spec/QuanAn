/**
 * QuanAn · PRD-5 US-002
 * AnalysisAgent — /analysis(structural) + /video-analysis(viral)
 *
 * AC-1:  继承 BaseSpecialist · 五层配置 · model_tier='lightweight' · streaming=false
 * AC-2:  inputSchema getter 按 _mode 返回 analysisViralInput | analysisStructuralInput
 * AC-3:  outputSchema getter 按 _mode 返回对应 schema · throw 'Unknown mode' 兜底
 * AC-4:  invokeLLM 设 _mode → 调 LLMGateway.complete(non-SSE · responseFormat · model_tier=lightweight)
 * AC-5:  fallbackTemplate viral / structural 各兜底 · 满足 schema min 约束
 * AC-11: export const analysisAgent = new AnalysisAgent() (REJ-004 单实例)
 * SHIELD REJ-001: no direct SDK import
 * SHIELD REJ-002: single LLM call · no loop
 * SHIELD REJ-003/D-019: model_tier passed · not hardcoded
 * SHIELD REJ-007: outputSchema getter 按 mode
 * TD-014: multi-mode _mode race window · P3 单 user 串行安全 · 高并发治理留 PRD-7+
 */

import { z } from 'zod';

import { piiMask } from '@/lib/compliance/pii-mask';

import { BaseSpecialist } from './base/BaseSpecialist';

import type {
  SpecialistConfig,
  SpecialistRequest,
  InvokeLLMResult,
  AssembledContext,
  ILLMGateway,
} from './base/types';

// ── Mode type ─────────────────────────────────────────────────────────────────

export type AnalysisMode = 'viral' | 'structural';

// ── I/O schemas (inline equiv of @quanan/schemas/specialist-io analysis.schema) ──
// Note: Zod schemas inlined — @quanan/schemas/specialist-io has canonical definition for client use

/** viral mode input: 爆款文案 + 可选标题 */
export const analysisViralInput = z.object({
  lastTitle: z.string().max(200).optional(),
  lastCopy: z.string().min(10).max(3000),
});

/** structural mode input: 用户自己的文案 */
export const analysisStructuralInput = z.object({
  copy: z.string().min(10).max(3000),
});

/** viral mode output: 元素拆解 + 洞察 + 仿写版 + 爆款结构(viralStructure) */
export const analysisViralOutput = z.object({
  analysis: z.object({
    elements: z.array(z.string()),
    structure: z.string(),
    hookType: z.string(),
    viralFormula: z.string(),
    evaluation: z.string().optional(),
  }),
  // PRD-37 US-P09 AC3: 顶层 viralStructure — hook/正文/CTA 结构化拆解
  viralStructure: z.object({
    hook: z.string().min(10),      // 开场钩子(≥10字·描述钩子手法+内容)
    body: z.string().min(10),      // 正文结构(≥10字·描述展开逻辑/叙事节奏)
    cta: z.string().min(5),        // 行动号召(≥5字·描述 CTA 类型+话术)
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
  hookAnalysis: z
    .object({
      score: z.number().int().min(0).max(100),
      maxScore: z.number().int().min(1).max(100),
      type: z.string(),
      technique: z.string(),
      evaluation: z.string(),
    })
    .optional(),
  topicStrategy: z
    .object({
      category: z.string(),
      angle: z.string(),
      targetAudience: z.string(),
      evaluation: z.string(),
    })
    .optional(),
  timeline: z.array(z.string()).min(1).optional(),
});

/** structural mode output: 多维度评分 + 优化建议 */
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
  elements: z.array(z.string()).min(1),
  pros: z.array(z.string()).min(1),
  cons: z.array(z.string()).min(1),
});

export type AnalysisViralInput = z.infer<typeof analysisViralInput>;
export type AnalysisStructuralInput = z.infer<typeof analysisStructuralInput>;
export type AnalysisViralOutput = z.infer<typeof analysisViralOutput>;
export type AnalysisStructuralOutput = z.infer<typeof analysisStructuralOutput>;
export type AnalysisInput = AnalysisViralInput | AnalysisStructuralInput;
export type AnalysisOutput = AnalysisViralOutput | AnalysisStructuralOutput;

// ── Base schemas for responseFormat (no min/length constraints) ───────────────

const AnalysisViralBaseSchema = z.object({
  analysis: z.object({
    elements: z.array(z.string()),
    structure: z.string(),
    hookType: z.string(),
    viralFormula: z.string(),
    evaluation: z.string().optional(),
  }),
  // PRD-37 US-P09 AC3: viralStructure — hook/body/cta 结构化拆解(base schema·无 min 约束)
  viralStructure: z.object({
    hook: z.string(),
    body: z.string(),
    cta: z.string(),
  }),
  insights: z.array(
    z.object({
      element: z.string(),
      explanation: z.string(),
      impact: z.string(),
    }),
  ),
  rewriteVersion: z.string(),
  hookAnalysis: z
    .object({
      score: z.number(),
      maxScore: z.number(),
      type: z.string(),
      technique: z.string(),
      evaluation: z.string(),
    })
    .optional(),
  topicStrategy: z
    .object({
      category: z.string(),
      angle: z.string(),
      targetAudience: z.string(),
      evaluation: z.string(),
    })
    .optional(),
  timeline: z.array(z.string()).optional(),
});

const AnalysisStructuralBaseSchema = z.object({
  scores: z.object({
    hook: z.number(),
    structure: z.number(),
    emotion: z.number(),
    specificity: z.number(),
    cta: z.number(),
    overall: z.number(),
  }),
  optimizations: z.array(
    z.object({
      dimension: z.string(),
      issue: z.string(),
      suggestion: z.string(),
    }),
  ),
  rewriteSnippet: z.string(),
  elements: z.array(z.string()),
  pros: z.array(z.string()),
  cons: z.array(z.string()),
});

// ── 五层配置 ───────────────────────────────────────────────────────────────────

const ANALYSIS_CONFIG: SpecialistConfig = {
  agentId: 'AnalysisAgent',
  persona: {
    role: 'AnalysisAgent',
    goal: '文案分析师：viral mode 拆解爆款+仿写 / structural mode 多维度评分+优化建议',
    boundaries: [
      '不评论真实人物，仅分析文本',
      '仿写差异化 ≥ 50%，不抄袭原文',
      '引用 22 元素时使用真名',
      '评分必须有客观依据，不主观打分',
    ],
  },
  memory: {
    l1_readonly: ['account'],
    l2_read: ['stepData'],
    l2_write: ['history'],
  },
  knowledge: {
    constants: ['hotElements'],
    rag: [],
    refresh_interval_sec: 3600,
  },
  tools: ['llm.complete'],
  execution: {
    timeout_ms: 30_000, // AC-1: short output · non-SSE
    retry: 1,
    model_tier: 'lightweight', // AC-1: analysis doesn't need reasoning tier
    streaming: false,
  },
};

// ── Fallback content ──────────────────────────────────────────────────────────

// viral fallback — must satisfy:
//   analysis.elements: [] (no min), insights.min(3), rewriteVersion.min(50)
const _VIRAL_REWRITE_BASE = '这是一篇基于爆款元素心理学重写的仿写版文案，融入了钩子、情绪共鸣和行动引导三个核心要素。';
// _VIRAL_REWRITE_BASE.length ≈ 44 chars; × 2 = 88 chars > 50 ✓

// structural fallback — must satisfy:
//   optimizations.min(3), rewriteSnippet.min(50).max(200)
const _STRUCTURAL_SNIPPET_BASE = '这是优化后的关键段落示例，包含更清晰的钩子和更强的行动引导，建议参考此结构改写全文。';
// length ≈ 41 chars; × 2 = 82 chars > 50, < 200 ✓

// ── AnalysisAgent ─────────────────────────────────────────────────────────────

export class AnalysisAgent extends BaseSpecialist<AnalysisInput, AnalysisOutput> {
  /**
   * TD-014: _mode set in invokeLLM — race window exists under concurrent requests.
   * P3 single-user serial calls are safe. High-concurrency governance deferred to PRD-7+.
   * (AGENTS §11.6.3 · 5 处复用 · REJ-007 pattern)
   */
  private _mode: AnalysisMode = 'viral';

  readonly config: SpecialistConfig = ANALYSIS_CONFIG;

  // AC-2: inputSchema getter 按 _mode 返回对应 schema
  // Uses union to handle both modes at execute() input-parse time
  // (default 'viral' is set before execute() parses input; structural input accepted via union)
  get inputSchema(): z.ZodType<AnalysisInput> {
    return z.union([analysisViralInput, analysisStructuralInput]) as z.ZodType<AnalysisInput>;
  }

  // AC-3: outputSchema getter 按 _mode · throw 'Unknown mode' 兜底
  get outputSchema(): z.ZodType<AnalysisOutput> {
    if (this._mode === 'viral') return analysisViralOutput as z.ZodType<AnalysisOutput>;
    if (this._mode === 'structural') return analysisStructuralOutput as z.ZodType<AnalysisOutput>;
    throw new Error('Unknown mode');
  }

  // AC-5: fallback templates satisfying schema min constraints
  static override readonly fallbackTemplate: Record<string, unknown> = {
    viral: {
      analysis: {
        elements: ['curiosity', 'contrast'],
        structure: '钩子→痛点→案例→仿写（系统备用）',
        hookType: 'opening_5s',
        viralFormula: '好奇 + 反差 → 情绪共鸣 → 行动（系统备用模板）',
      },
      // PRD-37 US-P09 AC3: viralStructure fallback
      viralStructure: {
        hook: '用反差数据/问句瞬间抓住注意力，在 5 秒内触发「这说的就是我」共鸣（系统备用）',
        body: '痛点展开→案例佐证→解决方案三段推进，情绪逐层递进至共鸣高峰（系统备用）',
        cta: '关注 / 评论区互动引导，降低行动门槛，促进转发扩散（系统备用）',
      },
      insights: [
        {
          element: 'curiosity',
          explanation: '标题制造信息缺口，让用户产生「我要知道答案」的冲动，是驱动点击的核心心理机制。',
          impact: '高' as const,
        },
        {
          element: 'contrast',
          explanation: '通过对比展现落差感，强化用户对「理想状态 vs 现实状态」的感知，加深情绪共鸣。',
          impact: '高' as const,
        },
        {
          element: 'resonance',
          explanation: '内容与目标用户日常经历高度重合，触发「说的就是我」的强烈认同感。',
          impact: '中' as const,
        },
      ],
      rewriteVersion: _VIRAL_REWRITE_BASE.repeat(2),
      hookAnalysis: {
        score: 20,
        maxScore: 100,
        type: '提问型',
        technique: '通过问题引发用户好奇心，拉长观看时间。',
        evaluation: '钩子基础，可加入对比或数字元素增强吸引力。',
      },
      topicStrategy: {
        category: '内容创作',
        angle: '爆款元素分析与仿写',
        targetAudience: '内容创作者、短视频从业者',
        evaluation: '选题聚焦创作痛点，具备一定吸引力，可细化行业定位。',
      },
      timeline: [
        '开头：钩子引入，制造悬念',
        '发展：展开核心论点',
        '高潮：案例支撑与情绪共鸣',
        '结尾：行动引导',
      ],
    } satisfies AnalysisViralOutput,

    structural: {
      scores: {
        hook: 65,
        structure: 70,
        emotion: 60,
        specificity: 55,
        cta: 50,
        overall: 60,
      },
      optimizations: [
        {
          dimension: 'hook',
          issue: '开场钩子吸引力不足，缺乏数字或悬念元素',
          suggestion: '在第一句话中加入具体数字或反问句，例如「90% 的人都不知道...」',
        },
        {
          dimension: 'specificity',
          issue: '内容描述较为抽象，缺乏具体案例和数据支撑',
          suggestion: '用真实数据和场景替换抽象描述，增加可信度和画面感',
        },
        {
          dimension: 'cta',
          issue: '结尾行动引导不够明确，用户不知道下一步该做什么',
          suggestion: '在结尾明确说明希望用户做什么，如「关注账号 / 评论区扣 1 / 私信我」',
        },
      ],
      rewriteSnippet: _STRUCTURAL_SNIPPET_BASE.repeat(2),
      elements: ['钩子开场', '痛点共鸣', '行动引导'],
      pros: ['结构清晰，层次分明。', '开头有一定吸引力。'],
      cons: ['结尾行动引导不够明确。'],
    } satisfies AnalysisStructuralOutput,
  };

  constructor(gateway?: ILLMGateway) {
    super(gateway);
  }

  // AC-4: invokeLLM — set _mode, call LLMGateway.complete (non-SSE)
  protected async invokeLLM(
    ctx: AssembledContext,
    req: SpecialistRequest<AnalysisInput>,
  ): Promise<InvokeLLMResult> {
    // Set _mode before outputSchema getter is called (BaseSpecialist calls it after this returns)
    this._mode = (req.mode ?? 'viral') as AnalysisMode;

    const responseFormat =
      this._mode === 'viral'
        ? { type: 'json_schema' as const, schema: AnalysisViralBaseSchema }
        : { type: 'json_schema' as const, schema: AnalysisStructuralBaseSchema };

    const userPrompt = this._buildUserPrompt(req.userInput, this._mode);

    // SHIELD REJ-002: single LLM call · no loop
    // D-019: model_tier passed to gateway · gateway decides actual model · no hardcoding
    return this.llmGateway.complete({
      model_tier: this.config.execution.model_tier,
      systemPrompt: ctx.systemPrompt,
      userPrompt,
      responseFormat,
      metadata: {
        trace_id: req.traceId ?? '',
        agentId: this.config.agentId,
        accountId: req.accountId,
        userId: req.userId,
      },
      timeout_ms: this.config.execution.timeout_ms,
      retry: this.config.execution.retry,
    });
  }

  private _buildUserPrompt(userInput: AnalysisInput, mode: AnalysisMode): string {
    const input = userInput as Record<string, unknown>;

    if (mode === 'viral') {
      return [
        '[爆款文案拆解任务 · viral mode]',
        '',
        `爆款文案: ${piiMask(String(input['lastCopy'] ?? ''))}`,
        `标题: ${piiMask(String(input['lastTitle'] ?? '（未提供）'))}`,
        '',
        '请以 JSON 格式返回拆解结果:',
        '{',
        '  "analysis": {',
        '    "elements": ["命中的 22 元素 key 列表"],',
        '    "structure": "内容结构(如: 钩子→痛点→案例→CTA)",',
        '    "hookType": "钩子类型",',
        '    "viralFormula": "爆款公式概括",',
        '    "evaluation": "叙事节奏综合评估(30-80字，描述内容起伏与节奏感)"',
        '  },',
        // PRD-37 US-P09 AC3: viralStructure 顶层字段 — hook/body/cta 结构化拆解
        '  "viralStructure": {',
        '    "hook": "开场钩子拆解(20-60字)：描述钩子手法+开场具体内容+情绪触发点",',
        '    "body": "正文结构拆解(20-80字)：描述展开逻辑/叙事节奏/论点推进方式",',
        '    "cta": "行动号召拆解(10-40字)：描述 CTA 类型+具体话术+转化目标"',
        '  },',
        '  "insights": [',
        '    { "element": "元素名", "explanation": "为什么这里用此元素", "impact": "高/中/低" }',
        '    // 至少 3 条',
        '  ],',
        '  "rewriteVersion": "仿写版(同结构·不同行业·不抄文字·至少 50 字)",',
        '  "hookAnalysis": {',
        '    "score": 0-100 整数(开头3秒钩子强度),',
        '    "maxScore": 100,',
        '    "type": "钩子类型(如: 提问型/悬念型/反差型)",',
        '    "technique": "具体技法描述(30-80字)",',
        '    "evaluation": "效果评估(30-80字)"',
        '  },',
        '  "topicStrategy": {',
        '    "category": "内容分类(如: 情感/职场/美妆)",',
        '    "angle": "切入角度(一句话概括)",',
        '    "targetAudience": "目标受众描述",',
        '    "evaluation": "选题策略综合评估(50-100字)"',
        '  },',
        '  "timeline": [',
        '    "步骤1: 开头做了什么",',
        '    "步骤2: 中段如何推进",',
        '    "步骤3: 高潮如何构建",',
        '    "步骤4: 结尾如何收尾"',
        '    // 3-6 条叙事时间线',
        '  ]',
        '}',
        '',
        '⚠️ viralStructure 必须非空，hook/body/cta 三字段均需描述具体内容，不得返回空字符串或占位符。',
      ].join('\n');
    }

    return [
      '[文案结构评分任务 · structural mode]',
      '',
      `用户文案: ${piiMask(String(input['copy'] ?? ''))}`,
      '',
      '请以 JSON 格式返回 6 维评分(各 0-100)+ 优化建议 + 爆款元素 + 优缺点:',
      '{',
      '  "scores": {',
      '    "hook": 0-100,',
      '    "structure": 0-100,',
      '    "emotion": 0-100,',
      '    "specificity": 0-100,',
      '    "cta": 0-100,',
      '    "overall": 5维均分',
      '  },',
      '  "optimizations": [',
      '    { "dimension": "维度名", "issue": "问题描述", "suggestion": "优化建议" }',
      '    // 3-5 条',
      '  ],',
      '  "rewriteSnippet": "关键段优化版(50-200 字)",',
      '  "elements": ["识别到的爆款元素1", "爆款元素2", ...],',
      '  "pros": ["优点1", "优点2", ...],',
      '  "cons": ["不足1", "不足2", ...]',
      '}',
      '',
      '⚠️ 评分必须有客观依据 · 不能全 90+',
      '⚠️ elements 至少 1 条 · pros 至少 1 条 · cons 至少 1 条',
    ].join('\n');
  }
}

// AC-11 / REJ-004: 单例 export
export const analysisAgent = new AnalysisAgent();
