/**
 * QuanQn · ContextAssembler · prompt 注入唯一入口
 * 派生自 ARCHITECTURE.md §4.6 + §5.5 + ADR-007 + LD-007 + R-11
 *
 * 6 路并行 · L2 Core / L4 Profile / L4 Diagnosis / L4 Samples / 常量 / RAG
 * Specialist 不允许自拼 prompt(grep 检测)
 * US-007: IContextAssembler interface + assembleStep stub
 */

import type { AssembledContext, SpecialistId } from './types';
import { piiMask } from '@/lib/compliance/pii-mask';

/** AC-2 (US-007): ContextAssembler interface for step-scoped context assembly */
export interface IContextAssembler {
  assembleStep(
    step: string,
    accountId: number,
  ): Promise<{ step: string; accountId: number; lastResults: Record<string, unknown> }>;
}

export interface AssembleRequest {
  agentId: SpecialistId;
  accountId: number;
  mode?: string;
  userInput: unknown;
  needRag?: readonly string[];
  needLayers?: readonly string[];
}

class ContextAssembler implements IContextAssembler {
  /** AC-2 (US-007): stub returns { step, accountId, lastResults: {} }; P3 fills real layers */
  async assembleStep(
    step: string,
    accountId: number,
  ): Promise<{ step: string; accountId: number; lastResults: Record<string, unknown> }> {
    return { step, accountId, lastResults: {} };
  }

  async assemble(req: AssembleRequest): Promise<AssembledContext> {
    // 1. PII 脱敏(LD-018 R-14)· 输入端处理
    const maskedInput = piiMask(req.userInput);

    // 2. 6 路并行(stub · P3 阶段填充真实实现)
    const [account, stepData, evolutionProfile, diagnosis, topKSamples, constantsRag] = await Promise.all([
      this.loadAccount(req.accountId),
      this.loadStepData(req.accountId),
      this.loadEvolutionProfile(req.accountId),
      this.loadLatestDiagnosis(req.accountId),
      this.loadTopKSamples(req.accountId, maskedInput, req.agentId),
      this.loadConstantsAndRag(req.agentId, req.needRag),
    ]);

    // 3. 拼 system prompt(模板见 PROMPTS.md §0.1)
    const systemPrompt = this.composePrompt({
      agentId: req.agentId,
      mode: req.mode,
      account,
      stepData,
      evolutionProfile,
      diagnosis,
      topKSamples,
      constantsRag,
    });

    return {
      systemPrompt,
      userPrompt: this.formatUserPrompt(maskedInput),
      tools: [],
      metadata: {
        contextTokens: 0,
        layersUsed: ['L2', 'L4', 'constants', ...(req.needRag ?? [])],
        ragHits: [],
      },
    };
  }

  // ============== 6 路并行加载(stub · P3 期间填充) ==============

  private async loadAccount(_accountId: number): Promise<unknown> {
    // TODO P1 · prisma.ipAccount.findUnique
    return null;
  }

  private async loadStepData(_accountId: number): Promise<unknown> {
    // TODO P1 · prisma.stepData.findMany
    return null;
  }

  private async loadEvolutionProfile(_accountId: number): Promise<unknown> {
    // TODO P1 · prisma.evolutionProfile.findUnique + Redis 热缓存(TTL 5min)
    return null;
  }

  private async loadLatestDiagnosis(_accountId: number): Promise<unknown> {
    // TODO P1 · prisma.diagnosisReport.findFirst orderBy createdAt desc
    return null;
  }

  private async loadTopKSamples(_accountId: number, _input: unknown, _agentId: SpecialistId): Promise<unknown[]> {
    // TODO P3 · pgvector top-K(仅 CopywritingAgent / VideoAgent 需要)
    return [];
  }

  private async loadConstantsAndRag(_agentId: SpecialistId, _needRag?: readonly string[]): Promise<unknown> {
    // TODO P3 · MethodologyQueryWorker + pgvector 检索
    return null;
  }

  // ============== prompt 拼接 ==============

  private composePrompt(_opts: unknown): string {
    // TODO P3 · 用 Handlebars 渲染 PROMPTS.md §0.1 的 5 段模板
    // 注入冷启动降级(§4.4-D 6 场景)
    return '[ContextAssembler stub · P3 phase will fill]';
  }

  private formatUserPrompt(input: unknown): string {
    return `<user_input>${JSON.stringify(input)}</user_input>`;
  }
}

export const contextAssembler = new ContextAssembler();
