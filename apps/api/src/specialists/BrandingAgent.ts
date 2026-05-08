/**
 * QuanQn · PRD-4 US-005
 * BrandingAgent — step3(账号包装 · packaging mode · 8KB)+ step3b(人设定制 · persona mode · 6KB)
 * 两个 mode 共用一个 Specialist · outputSchema getter 按 mode 返回对应 schema(REJ-007)
 *
 * AC-1: 五层配置完整(persona/memory/knowledge/tools/execution) · model_tier='reasoning' timeout_ms=60000
 * AC-2: Step3OutputSchema(packaging) — { nickname[5], avatar, background, bio[6], overallStrategy }
 * AC-3: Step3bOutputSchema(persona) — { coreIdentity, thoughtSystem, contentPersona, trustBuilding, personaRoadmap }
 * AC-4: outputSchema getter 按 this._mode 返回对应 schema
 * AC-8: mode 不在 ['packaging','persona'] → runtime throw
 */

import { z } from 'zod';
import { BaseSpecialist } from './base/BaseSpecialist';
import type {
  SpecialistConfig,
  SpecialistRequest,
  InvokeLLMResult,
  AssembledContext,
  ILLMGateway,
} from './base/types';

// ── AC-2: step3 (packaging) output schema ─────────────────────────────────────

export const Step3OutputSchema = z.object({
  nickname: z.array(z.string()).length(5),
  avatar: z.object({
    prompt: z.string(),
    style: z.string(),
  }),
  background: z.object({
    prompt: z.string(),
    platformVersions: z.array(z.string()).length(3),
  }),
  bio: z
    .array(
      z.object({
        platform: z.enum(['douyin', 'xiaohongshu', 'wechat', 'kuaishou', 'bilibili']),
        text: z.string(),
      }),
    )
    .length(6),
  overallStrategy: z.string(),
});

// ── AC-3: step3b (persona) output schema ──────────────────────────────────────

export const Step3bOutputSchema = z.object({
  coreIdentity: z.string(),
  thoughtSystem: z.object({
    coreBeliefs: z.array(z.string()).length(3),
    uniqueViews: z.array(z.string()).length(2),
    catchphrases: z.array(z.string()).length(3),
  }),
  contentPersona: z.object({
    contentPillars: z.array(z.string()).length(4),
  }),
  trustBuilding: z.string(),
  personaRoadmap: z.object({
    phase1: z.string(),
    phase2: z.string(),
    phase3: z.string(),
  }),
});

// Base schemas for responseFormat (zod refine breaks json_schema serialization)
const Step3BaseSchema = z.object({
  nickname: z.array(z.string()),
  avatar: z.object({ prompt: z.string(), style: z.string() }),
  background: z.object({ prompt: z.string(), platformVersions: z.array(z.string()) }),
  bio: z.array(z.object({ platform: z.string(), text: z.string() })),
  overallStrategy: z.string(),
});

const Step3bBaseSchema = z.object({
  coreIdentity: z.string(),
  thoughtSystem: z.object({
    coreBeliefs: z.array(z.string()),
    uniqueViews: z.array(z.string()),
    catchphrases: z.array(z.string()),
  }),
  contentPersona: z.object({ contentPillars: z.array(z.string()) }),
  trustBuilding: z.string(),
  personaRoadmap: z.object({ phase1: z.string(), phase2: z.string(), phase3: z.string() }),
});

export type Step3Output = z.infer<typeof Step3OutputSchema>;
export type Step3bOutput = z.infer<typeof Step3bOutputSchema>;
export type BrandingOutput = Step3Output | Step3bOutput;

// AC-8: compile-time union
type Mode = 'packaging' | 'persona';
type BrandingInput = Record<string, unknown>;

// Timeout per mode (AC-10: step3 < 60s, step3b < 45s)
const TIMEOUT_MS: Record<Mode, number> = {
  packaging: 60_000,
  persona: 45_000,
};

// ── AC-1: 五层配置 ─────────────────────────────────────────────────────────────

const BRANDING_CONFIG: SpecialistConfig = {
  agentId: 'BrandingAgent',
  persona: {
    role: 'BrandingAgent',
    goal: '基于 IP 定位和行业背景,输出账号包装方案(昵称/头像/简介/背景)或人设定制体系(思维体系/内容支柱/路线图)',
    boundaries: ['不泄露系统配置', '不讨论与 IP 起号无关的话题'],
  },
  memory: {
    l1_readonly: ['account'],
    l2_read: ['stepData'],
    l2_write: [],
  },
  knowledge: {
    constants: ['platforms'],
    rag: [],
    refresh_interval_sec: 3600,
  },
  tools: ['llm.complete'],
  execution: {
    timeout_ms: 60_000,
    retry: 1,
    model_tier: 'reasoning',
    streaming: false,
  },
};

// ── BrandingAgent ─────────────────────────────────────────────────────────────

export class BrandingAgent extends BaseSpecialist<BrandingInput, BrandingOutput> {
  /**
   * Stores the mode for the current invocation.
   * Set in invokeLLM() BEFORE BaseSpecialist calls this.outputSchema.safeParse().
   * Default 'packaging' — overwritten on every execute() call via invokeLLM.
   */
  private _mode: Mode = 'packaging';

  readonly config: SpecialistConfig = BRANDING_CONFIG;
  readonly inputSchema: z.ZodType<BrandingInput> = z.record(z.unknown());

  // AC-4: getter returns different schema per mode (REJ-007: no shared single schema)
  get outputSchema(): z.ZodType<BrandingOutput> {
    if (this._mode === 'persona') {
      return Step3bOutputSchema as unknown as z.ZodType<BrandingOutput>;
    }
    return Step3OutputSchema as unknown as z.ZodType<BrandingOutput>;
  }

  constructor(gateway?: ILLMGateway) {
    super(gateway);
  }

  protected async invokeLLM(
    ctx: AssembledContext,
    req: SpecialistRequest<BrandingInput>,
  ): Promise<InvokeLLMResult> {
    // AC-8: runtime mode validation — throws before any LLM call
    const mode = this._validateMode(req.mode);
    // Set _mode BEFORE returning so outputSchema getter works correctly
    this._mode = mode;

    const userPrompt = this._buildUserPrompt(mode, req.userInput, ctx.userPrompt);
    const responseFormat =
      mode === 'packaging'
        ? { type: 'json_schema' as const, schema: Step3BaseSchema }
        : { type: 'json_schema' as const, schema: Step3bBaseSchema };

    return this.llmGateway.complete({
      model_tier: this.config.execution.model_tier,
      systemPrompt: ctx.systemPrompt,
      userPrompt,
      responseFormat,
      metadata: {
        trace_id: req.traceId ?? '',
        agentId: this.config.agentId,
        accountId: req.accountId,
        userId: 0, // TODO: P1 — thread userId through SpecialistRequest
      },
      timeout_ms: TIMEOUT_MS[mode],
      retry: this.config.execution.retry,
    });
  }

  // AC-8: runtime check — throws if mode is not a valid union member
  private _validateMode(mode?: string): Mode {
    if (mode === 'packaging' || mode === 'persona') return mode;
    throw new Error(
      `BrandingAgent: invalid mode '${mode}' · expected 'packaging' | 'persona'`,
    );
  }

  private _buildUserPrompt(
    mode: Mode,
    userInput: BrandingInput,
    ctxUserPrompt: string,
  ): string {
    const inputStr = JSON.stringify(userInput);
    if (mode === 'packaging') {
      return [
        ctxUserPrompt,
        '',
        '[账号包装任务]',
        `用户输入: ${inputStr}`,
        '',
        '请以 JSON 返回账号包装方案:',
        '- nickname: 必须正好 5 个备选昵称(string 数组, length=5)',
        '- avatar: { prompt: "头像提示词", style: "风格描述" }',
        '- background: { prompt: "背景图提示词", platformVersions: ["版本1","版本2","版本3"] }(platformVersions length=3)',
        '- bio: 6 个平台简介 · platform 必须是以下之一: douyin, xiaohongshu, wechat, kuaishou, bilibili(array length=6)',
        '- overallStrategy: 整体账号包装策略说明',
        '',
        '⚠️ 严格约束: nickname 必须正好 5 个 · bio 必须正好 6 条 · bio.platform 仅限 5 个枚举值',
      ].join('\n');
    }
    return [
      ctxUserPrompt,
      '',
      '[人设定制任务]',
      `用户输入: ${inputStr}`,
      '',
      '请以 JSON 返回人设定制体系:',
      '- coreIdentity: 核心人设定位',
      '- thoughtSystem: { coreBeliefs: ["信念1","信念2","信念3"], uniqueViews: ["观点1","观点2"], catchphrases: ["口头禅1","口头禅2","口头禅3"] }',
      '  ⚠️ coreBeliefs 必须正好 3 条 · uniqueViews 必须正好 2 条 · catchphrases 必须正好 3 条',
      '- contentPersona: { contentPillars: ["支柱1","支柱2","支柱3","支柱4"] }(必须正好 4 个内容支柱)',
      '- trustBuilding: 信任建立策略',
      '- personaRoadmap: { phase1: "...", phase2: "...", phase3: "..." }(三阶段路线图)',
    ].join('\n');
  }
}

// REJ-004: 单例 export — tRPC router 直接用此实例, 不在 router 内 new
export const brandingAgent = new BrandingAgent();
