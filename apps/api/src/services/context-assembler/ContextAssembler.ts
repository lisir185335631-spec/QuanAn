/**
 * ContextAssembler — 7 Specialist 的 prompt 装配中枢
 *
 * 5 路并行 fetch · Promise.allSettled · 各路独立 5s timeout · 缺数据降级(D-020)
 * PRD-8 US-001 AC-8: 加第 5 路 L4 EvolutionInsight latest · evolutionInsight 字段输出
 * PRD-9 US-003: _fetchRag 升级真 RAG · [Section 6] 注入 · L5_rag layersUsed
 * AC-1: assemble(req) → Promise<AssembledContext> · 对齐 ARCHITECTURE §6.4
 * AC-2: Promise.allSettled + 5s timeout + 降级注入空段
 * AC-8: metadata.layersUsed 真实反映成功层
 * AC-9: contextTokens = chars/4 粗算
 * AC-10: systemPrompt 禁止包含 LLM 密钥或 API URL(R-001 安全红线)
 */

import { piiMask } from '@/lib/compliance/pii-mask';
import { prisma } from '@/lib/prisma';
import { getLatestInsight } from '@/memory/l4-profile';
import { methodologyQueryWorker } from '@/workers/methodology-query';
import { ragRetrieveWorker } from '@/workers/rag';

import { SPECIALIST_TEMPLATES } from './templates';

import type { AssembleRequest, AssembledContext } from './types';
import type { KnowledgeChunkContent } from '@quanqn/schemas';
import type { EvolutionInsightContent } from '@quanqn/schemas/specialist-io';

const FETCH_TIMEOUT_MS = 5_000;

/** 给任意 Promise 加 hard timeout */
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`context-assembler: fetch timeout after ${ms}ms`)), ms),
    ),
  ]);
}

type StepRow = { stepKey: string; result: unknown };
type Constants = ReturnType<typeof methodologyQueryWorker.getAll>;

export class ContextAssembler {
  /**
   * 组装 AssembledContext · 4 路并行 fetch + 降级 + prompt 拼接
   * 总耗时应 ≤ 800ms(4 路并行 · cap 5s · 平均数据库 < 200ms)
   */
  async assemble(req: AssembleRequest): Promise<AssembledContext> {
    const [l2Result, l4InsightResult, l4SamplesResult, l5RagResult, constantsResult] =
      await Promise.allSettled([
        withTimeout(this._fetchStepData(req.accountId), FETCH_TIMEOUT_MS),
        withTimeout(getLatestInsight(req.accountId), FETCH_TIMEOUT_MS),
        withTimeout(this._fetchSamples(req.accountId), FETCH_TIMEOUT_MS),
        withTimeout(this._fetchRag(req), FETCH_TIMEOUT_MS),
        withTimeout(this._fetchConstants(), FETCH_TIMEOUT_MS),
      ]);

    const layersUsed: string[] = [];

    // L2 step data
    const stepData: StepRow[] | null =
      l2Result.status === 'fulfilled' ? l2Result.value : null;
    if (stepData !== null && stepData.length > 0) {
      layersUsed.push('L2_step_data');
    }

    // L4 EvolutionInsight — PRD-8 US-001 AC-8: 第 5 路 · 失败 fallback null
    const evolutionInsight: EvolutionInsightContent | null =
      l4InsightResult.status === 'fulfilled' ? l4InsightResult.value : null;
    if (evolutionInsight !== null) {
      layersUsed.push('L4_evolution_insight');
    }

    // L4 Samples — 本期降级跑空
    void l4SamplesResult;

    // L5 RAG — PRD-9 US-003: 真 RAG · 失败降级空段(D-020 · AC-3)
    const ragChunks: KnowledgeChunkContent[] =
      l5RagResult.status === 'fulfilled' ? l5RagResult.value : [];
    if (ragChunks.length > 0) {
      layersUsed.push('L5_rag');
    }
    const ragHits: { source: string; count: number }[] =
      ragChunks.length > 0
        ? Object.entries(
            ragChunks.reduce<Record<string, number>>((acc, c) => {
              acc[c.type] = (acc[c.type] ?? 0) + 1;
              return acc;
            }, {}),
          ).map(([source, count]) => ({ source, count }))
        : [];

    // 常量
    const constants: Constants | null =
      constantsResult.status === 'fulfilled' ? constantsResult.value : null;
    if (constants !== null) {
      layersUsed.push('constants');
    }

    const systemPrompt = this._composeSystemPrompt(req, stepData, constants, evolutionInsight, ragChunks);
    const userPrompt = this._formatUserPrompt(req.userInput);
    const contextTokens = Math.ceil((systemPrompt.length + userPrompt.length) / 4);

    return {
      systemPrompt,
      userPrompt,
      tools: [],
      evolutionInsight,
      metadata: { contextTokens, layersUsed, ragHits },
    };
  }

  // ── 4 路 fetch ────────────────────────────────────────────────────────────

  private async _fetchStepData(accountId: number): Promise<StepRow[]> {
    return prisma.stepData.findMany({
      where: { accountId },
      select: { stepKey: true, result: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** L4 Samples — PRD-8 才填 · 本期降级跑空 */
  // eslint-disable-next-line @typescript-eslint/require-await
  private async _fetchSamples(_accountId: number): Promise<never[]> {
    return [];
  }

  /**
   * L5 RAG — PRD-9 US-003 AC-1: 按 agentId 推断 retrieve 策略
   * D-007 单一入口: 所有 RAG 逻辑在此集中 · specialist 文件 0 改动
   */
  private async _fetchRag(req: AssembleRequest): Promise<KnowledgeChunkContent[]> {
    const NON_GENERATIVE = new Set<string>(['DiagnosisAgent', 'DeepLearnAgent', 'EvolutionAgent']);
    if (NON_GENERATIVE.has(req.agentId)) return [];

    const input = req.userInput as Record<string, unknown>;
    const query =
      typeof input?.userMessage === 'string'
        ? input.userMessage
        : typeof input?.lastDescription === 'string'
          ? input.lastDescription
          : req.agentId;

    const traceId = `rag_${req.accountId}_${req.agentId}_${Date.now()}`;
    const retrieve = (type: 'case' | 'formula' | 'element', topK: number) =>
      ragRetrieveWorker.retrieve({ query, topK, type, accountId: req.accountId, traceId });

    // CopywritingAgent (非 boom 模式): 3 case + 1 formula + 1 element = 5 chunks
    if (req.agentId === 'CopywritingAgent' && req.mode !== 'boom') {
      const [cases, formulas, elements] = await Promise.all([
        retrieve('case', 3),
        retrieve('formula', 1),
        retrieve('element', 1),
      ]);
      return [...cases, ...formulas, ...elements];
    }

    // TopicAgent / BoomGenerator(CopywritingAgent mode=boom): 3 element + 2 case
    if (req.agentId === 'TopicAgent' || (req.agentId === 'CopywritingAgent' && req.mode === 'boom')) {
      const [elements, cases] = await Promise.all([
        retrieve('element', 3),
        retrieve('case', 2),
      ]);
      return [...elements, ...cases];
    }

    // 其他 8 生成型: 3 case + 2 element
    const [cases, elements] = await Promise.all([
      retrieve('case', 3),
      retrieve('element', 2),
    ]);
    return [...cases, ...elements];
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  private async _fetchConstants(): Promise<Constants> {
    return methodologyQueryWorker.getAll();
  }

  // ── prompt 拼接 ───────────────────────────────────────────────────────────

  private _buildSection4(insight: EvolutionInsightContent): string {
    const { direction, insights } = insight;
    const lines: string[] = ['[Section 4] 用户偏好画像'];
    lines.push(`- 内容方向: ${direction}`);
    lines.push(`- 风格/调性: ${insights.styleTone}`);
    if (insights.preferredCatchphrases.length > 0) {
      lines.push(`- 偏爱金句: ${insights.preferredCatchphrases.join(' / ')}`);
    }
    if (insights.avoidList.length > 0) {
      lines.push(`- 规避词/风格: ${insights.avoidList.join(' / ')}`);
    }
    if (insights.strongPoints.length > 0) {
      lines.push(`- 强项: ${insights.strongPoints.join(' / ')}`);
    }
    if (insights.weakPoints.length > 0) {
      lines.push(`- 待提升: ${insights.weakPoints.join(' / ')}`);
    }
    return lines.join('\n');
  }

  /** PRD-9 US-003 AC-2: [Section 6] RAG 知识库参考 */
  private _buildSection6(ragChunks: KnowledgeChunkContent[]): string {
    const lines: string[] = [
      `[Section 6] RAG 知识库参考(top-${ragChunks.length} 相似案例 · 仅供生成参考 · 不抄)`,
    ];
    ragChunks.forEach((chunk, i) => {
      const simStr = chunk.similarity !== null ? ` (相似度 ${chunk.similarity.toFixed(3)})` : '';
      const preview = chunk.content.slice(0, 200);
      lines.push(`─ 案例 ${i + 1}: ${chunk.title}${simStr}· ${preview}`);
    });
    return lines.join('\n');
  }

  private _composeSystemPrompt(
    req: AssembleRequest,
    stepData: StepRow[] | null,
    constants: Constants | null,
    evolutionInsight: EvolutionInsightContent | null,
    ragChunks: KnowledgeChunkContent[],
  ): string {
    const tmpl = SPECIALIST_TEMPLATES[req.agentId];
    const persona = tmpl?.persona ?? `你是 ${req.agentId} · IP 起号专家助手`;

    // AC-5: L2 stepData 失败 → 占位 · 不报错
    const stepSection =
      stepData !== null && stepData.length > 0
        ? stepData
            .map((s) => `- ${s.stepKey}: ${JSON.stringify(s.result ?? {})}`)
            .join('\n')
        : '[新用户 · 暂无 step 数据]';

    const lines: string[] = [
      persona,
      '────────────────────────────────────────',
      '# 历史 step 摘要(L2 Core)',
      stepSection,
    ];

    // PRD-8 US-004 AC-1: evolutionInsight 非 null 时注入 [Section 4] 用户偏好画像
    if (evolutionInsight !== null) {
      lines.push(
        '────────────────────────────────────────',
        this._buildSection4(evolutionInsight),
      );
    }

    if (constants !== null) {
      const constParts: string[] = [];
      if (tmpl?.methodology) constParts.push(tmpl.methodology);
      constParts.push(
        `可用脚本类型(${constants.scriptTypes.length} 种): ${constants.scriptTypes.map((s) => s.label).join(' / ')}`,
        `爆款元素(${constants.hotElements.length} 类): ${constants.hotElements.map((e) => e.label).join(' / ')}`,
        `覆盖行业(${constants.industries.length} 类): ${[...new Set(constants.industries.map((i) => i.category))].join(' / ')}`,
      );
      lines.push(
        '────────────────────────────────────────',
        '# 方法论(常量)',
        constParts.join('\n'),
      );
    }

    // PRD-9 US-003 AC-2: L5 RAG [Section 6] · ragChunks 为空时跳过(D-020 降级)
    if (ragChunks.length > 0) {
      lines.push(
        '────────────────────────────────────────',
        this._buildSection6(ragChunks),
      );
    }

    return lines.join('\n');
  }

  private _formatUserPrompt(input: unknown): string {
    // LD-018 R-14 (TD-016 修): PII 脱敏 (email/phone/id_card/bank_card) 防原文进 LLM
    const masked = piiMask(input);
    const body = typeof masked === 'string' ? masked : JSON.stringify(masked);
    return `<user_input>${body}</user_input>`;
  }
}

/** 单例(可被测试替换) */
export const contextAssembler = new ContextAssembler();
