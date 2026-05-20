/**
 * QuanAn · PRD-8 US-011
 * VoiceChatAgent — 真接 LLMGateway.stream() + 5 工具 + L1 Buffer + tRPC subscription
 *
 * AC-1: execute() 真接 LLMGateway.stream() · model_tier='reasoning' · tools=VOICE_CHAT_TOOLS · timeout 30s
 * AC-3: L1 Buffer pushTurn(user+assistant) · getTurns(10) 注入下次调用
 * AC-5: l1-buffer.ts EXPIRE:1800 (30 min TTL)
 * AC-6: cost_log eventType='l5_agent' · agentMode=null · modelUsed
 * AC-7: 每轮 ≤ 80 字 post-validate 截断
 * AC-8: 同 accountId 单 session 并发防护(module-level Map)
 * SHIELD: outputSchema=z.never() · tools 通过 tools array+dispatch · 不是 mode 切换
 */

import { randomUUID } from 'node:crypto';

import { Decimal } from '@prisma/client/runtime/library';
import { z } from 'zod';

import { generateSpecialistTraceId } from '@/agents/base/types';
import type { SpecialistId } from '@/agents/base/types';
import { logger } from '@/lib/logger';
import { prisma as _prisma } from '@/lib/prisma';
import { clearBuffer, getTurns, pushTurn } from '@/memory/l1-buffer';

import { BaseSpecialist } from './base/BaseSpecialist';

import type {
  AssembledContext,
  ILLMGateway,
  InvokeLLMResult,
  LLMStreamChunk,
  SpecialistConfig,
  SpecialistRequest,
  SpecialistResponse,
} from './base/types';
import type { VoiceChatBuffer, VoiceChatTurn } from '@quanan/schemas/specialist-io';

export { VoiceChatBufferSchema } from '@quanan/schemas/specialist-io';
export type { VoiceChatBuffer, VoiceChatTurn, VoiceChatRole } from '@quanan/schemas/specialist-io';

// ── VOICE_CHAT_TOOLS — 5 工具 (SoT · §1.0.4) ──────────────────────────────────

export const VOICE_CHAT_TOOLS = [
  {
    name: 'get_current_step' as const,
    description: '查询当前 IP 账号 9 步主线的完成进度',
    parameters: { type: 'object' as const, properties: {}, required: [] as string[] },
  },
  {
    name: 'search_history' as const,
    description: '在用户的历史生成内容中搜索 · 按关键词模糊匹配',
    parameters: {
      type: 'object' as const,
      properties: {
        keyword: { type: 'string', description: '搜索关键词' },
        limit: { type: 'number', default: 5 },
      },
      required: ['keyword'] as string[],
    },
  },
  {
    name: 'query_diagnosis' as const,
    description: '查最新诊断报告(8 维度短板)',
    parameters: { type: 'object' as const, properties: {}, required: [] as string[] },
  },
  {
    name: 'get_today_tasks' as const,
    description: '查今日 3-5 个推荐任务',
    parameters: { type: 'object' as const, properties: {}, required: [] as string[] },
  },
  {
    name: 'get_evolution_insights' as const,
    description: '查当前 EvolutionProfile + 最新 insight',
    parameters: { type: 'object' as const, properties: {}, required: [] as string[] },
  },
] as const;

export type VoiceChatToolName = (typeof VOICE_CHAT_TOOLS)[number]['name'];

// ── Streaming chunk types (AC-4) ──────────────────────────────────────────────

export type VoiceChatStreamChunk =
  | { type: 'meta'; meta: { model: string } }
  | { type: 'delta'; delta: string }
  | { type: 'tool_call'; toolName: string; args: Record<string, unknown> }
  | { type: 'tool_result'; toolName: string; result: string }
  | { type: 'done'; sessionId: string; modelUsed: string; turns: number; tokensUsed: { prompt: number; completion: number; total: number } }
  | { type: 'error'; error: string };

// Tool dispatcher callback type
export type ToolDispatchFn = (name: string, args: Record<string, unknown>) => Promise<string>;

// ── Per-account session guard (AC-8) ─────────────────────────────────────────

const _activeSessions = new Map<number, boolean>();

// ── Input schema ──────────────────────────────────────────────────────────────

const voiceChatAgentInput = z.object({
  userMessage: z.string().min(1).max(2000),
  sessionId: z.string().uuid().optional(),
});

type VoiceChatAgentInput = z.infer<typeof voiceChatAgentInput>;

// ── Config ────────────────────────────────────────────────────────────────────

const VOICE_CHAT_CONFIG: SpecialistConfig = {
  agentId: 'VoiceChatAgent',
  persona: {
    role: 'VoiceChatAgent',
    goal: '跟用户语音对话 · 帮他理清思路 / 查数据 / 给建议',
    boundaries: [
      '不假装是真人(主动 self-disclose AI 身份)',
      '不在没用户授权时调工具',
      '每轮 ≤ 80 字 · 让用户主动说下一句',
      '短句 + 口语化(目标是"听"不是"读")',
    ],
  },
  memory: {
    l1_readonly: ['voice_chat_buffer'],
    l2_read: ['step_data', 'diagnosis', 'daily_task', 'evolution_insight'],
    l2_write: ['voice_chat_buffer'],
  },
  knowledge: {
    constants: [],
    rag: ['history'],
    refresh_interval_sec: 1800,
  },
  tools: ['llm.stream', 'llm.tools'],
  execution: {
    timeout_ms: 30_000,
    retry: 0,
    model_tier: 'reasoning',
    streaming: true,
  },
};

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `你是一个语音 AI 助理。帮用户理清思路、查数据、给建议。

规则:
- 每轮回复 ≤ 80 字(严格遵守)
- 短句 + 口语化
- 不假装是真人
- 需要调工具时先简单提示用户`;

// ── VoiceChatAgent ────────────────────────────────────────────────────────────

export class VoiceChatAgent extends BaseSpecialist<VoiceChatAgentInput, VoiceChatBuffer> {
  readonly config = VOICE_CHAT_CONFIG;
  readonly inputSchema = voiceChatAgentInput;
  // SHIELD: z.never() cast — streaming 不走 safeParse · execute() fully overridden
  readonly outputSchema = z.never() as unknown as z.ZodType<VoiceChatBuffer>;

  constructor(gateway?: ILLMGateway) {
    super(gateway);
  }

  /**
   * AC-1: execute() 真接 LLMGateway.stream() · no-tool mode (uses module-level prisma)
   * Returns SpecialistResponse<VoiceChatBuffer> with current buffer state after turn.
   */
  override async execute(
    req: SpecialistRequest<VoiceChatAgentInput>,
  ): Promise<SpecialistResponse<VoiceChatBuffer>> {
    const traceId = req.traceId ?? generateSpecialistTraceId(
      req.accountId,
      this.config.agentId as SpecialistId,
    );
    const startedAt = Date.now();

    this.inputSchema.parse(req.userInput);

    let modelUsed = '';
    let tokensUsed = { prompt: 0, completion: 0, total: 0 };

    // No-op tool dispatcher (execute() without prisma context)
    const noopDispatch: ToolDispatchFn = (_name, _args) => Promise.resolve('{}');

    for await (const chunk of this.executeStream({ ...req, traceId }, noopDispatch)) {
      if (chunk.type === 'done') {
        modelUsed = chunk.modelUsed;
        tokensUsed = chunk.tokensUsed;
      }
    }

    const turns = await getTurns(req.accountId, 20);
    const buffer: VoiceChatBuffer = {
      accountId: req.accountId,
      turns,
      sessionId: req.userInput.sessionId ?? randomUUID(),
      createdAt: Date.now(),
    };

    return {
      result: buffer,
      isFallback: false,
      durationMs: Date.now() - startedAt,
      tokensUsed,
      modelUsed,
      traceId,
    };
  }

  /**
   * AC-4: Main streaming interface used by tRPC subscription voiceChat.start
   * Yields delta/tool_call/tool_result/done chunks.
   * AC-1: calls llmGateway.stream() with tools=VOICE_CHAT_TOOLS · model_tier='reasoning' · timeout 30s
   * AC-3: getTurns(10) → inject history · pushTurn user+assistant after completion
   * AC-6: writes cost_log eventType='l5_agent' agentMode=null modelUsed
   * AC-7: post-validate 80-char truncation
   * AC-8: per-accountId session guard
   */
  async *executeStream(
    req: SpecialistRequest<VoiceChatAgentInput> & { traceId?: string },
    dispatchTool: ToolDispatchFn,
  ): AsyncGenerator<VoiceChatStreamChunk> {
    const { accountId, userInput } = req;
    const traceId = req.traceId ?? generateSpecialistTraceId(
      accountId,
      this.config.agentId as SpecialistId,
    );
    const sessionId = userInput.sessionId ?? randomUUID();
    const startedAt = Date.now();

    // AC-8: single session per accountId
    if (_activeSessions.get(accountId)) {
      yield { type: 'error', error: 'voice_chat_conflict: another session active' };
      return;
    }
    _activeSessions.set(accountId, true);

    try {
      if (!this.llmGateway.stream) {
        yield { type: 'error', error: 'LLMGateway does not support streaming' };
        return;
      }

      // AC-3: get recent 10 turns from L1 Buffer
      const recentTurns = await getTurns(accountId, 10);
      const historyStr = recentTurns.length > 0
        ? '\n\n# 对话历史(最近 10 轮)\n' +
          recentTurns.map((t) => `${t.role === 'user' ? '用户' : 'AI'}: ${t.content}`).join('\n')
        : '';

      const streamReq = {
        model_tier: 'reasoning' as const,
        systemPrompt: SYSTEM_PROMPT,
        userPrompt: userInput.userMessage + historyStr,
        tools: VOICE_CHAT_TOOLS,
        metadata: {
          trace_id: traceId,
          agentId: this.config.agentId,
          accountId,
          userId: 0,
          eventType: 'l5_agent', // AC-6
        },
        timeout_ms: 30_000, // AC-1: 30s
      };

      let modelUsed = '';
      let tokens = { prompt: 0, completion: 0, total: 0 };
      let assistantText = '';
      const toolCallsMeta: Array<{ name: string; args: Record<string, unknown>; result: string }> = [];

      // AC-1: call LLMGateway.stream() with tools
      for await (const chunk of this.llmGateway.stream(streamReq as Parameters<NonNullable<ILLMGateway['stream']>>[0])) {
        const c = chunk as LLMStreamChunk & {
          result?: { name?: string; args?: Record<string, unknown> };
        };

        if (c.type === 'meta' && c.meta) {
          modelUsed = c.meta.model;
          yield { type: 'meta' as const, meta: { model: c.meta.model } };
        } else if (c.type === 'delta' && c.delta) {
          assistantText += c.delta;
          yield { type: 'delta', delta: c.delta };
        } else if (c.type === 'tool_call' && c.result) {
          const toolName = (c.result.name ?? '');
          const toolArgs = (c.result.args ?? {});
          yield { type: 'tool_call', toolName, args: toolArgs };
          const result = await dispatchTool(toolName, toolArgs);
          yield { type: 'tool_result', toolName, result };
          toolCallsMeta.push({ name: toolName, args: toolArgs, result });
        } else if (c.type === 'done') {
          tokens = c.tokens ?? tokens;
        } else if (c.type === 'error') {
          yield { type: 'error', error: c.error?.message ?? 'stream error' };
          return;
        }
      }

      // AC-7: post-validate 80-char truncation
      if ([...assistantText].length > 80) {
        assistantText = [...assistantText].slice(0, 80).join('') + '…';
      }

      // AC-3: push user + assistant turns to L1 Buffer
      const nowMs = Date.now();
      const userTurn: VoiceChatTurn = {
        turnId: randomUUID(),
        role: 'user',
        content: userInput.userMessage,
        timestamp: nowMs,
      };
      const assistantTurn: VoiceChatTurn = {
        turnId: randomUUID(),
        role: 'assistant',
        content: assistantText,
        toolCalls: toolCallsMeta.length > 0
          ? toolCallsMeta.map((tc) => ({
              name: tc.name as VoiceChatToolName,
              args: tc.args,
              result: tc.result,
            }))
          : undefined,
        timestamp: nowMs + 1,
      };
      await pushTurn(accountId, userTurn);
      await pushTurn(accountId, assistantTurn);

      // AC-6: cost_log eventType='l5_agent' agentMode=null modelUsed
      await this._writeL5CostLog({
        accountId,
        traceId,
        modelUsed: modelUsed || 'unknown',
        tokens,
        durationMs: Date.now() - startedAt,
      });

      const currentTurns = await getTurns(accountId, 20);
      yield {
        type: 'done',
        sessionId,
        modelUsed: modelUsed || 'unknown',
        turns: currentTurns.length,
        tokensUsed: tokens,
      };
    } finally {
      _activeSessions.delete(accountId);
    }
  }

  /** Clear L1 Buffer for an account (e.g., on session end) */
  async clearSession(accountId: number): Promise<void> {
    await clearBuffer(accountId);
  }

  /** AC-6: write cost_log with eventType='l5_agent' agentMode=null */
  private async _writeL5CostLog(data: {
    accountId: number;
    traceId: string;
    modelUsed: string;
    tokens: { prompt: number; completion: number; total: number };
    durationMs: number;
  }): Promise<void> {
    const provider = data.modelUsed.startsWith('claude-')
      ? 'anthropic'
      : data.modelUsed.startsWith('gpt-')
        ? 'openai'
        : 'none';
    try {
      await _prisma.costLog.create({
        data: {
          agentId: this.config.agentId,
          accountId: data.accountId,
          traceId: data.traceId,
          eventType: 'specialist_call', // AC-12
          agentMode: null,
          callType: 'specialist_call',
          modelTier: this.config.execution.model_tier,
          modelUsed: data.modelUsed,
          provider,
          promptTokens: data.tokens.prompt,
          completionTokens: data.tokens.completion,
          totalTokens: data.tokens.total,
          costUsd: new Decimal('0.000000'),
          durationMs: data.durationMs,
          success: true,
          streaming: true,
          isFallback: false,
          target: { agentId: this.config.agentId },
        },
      });
    } catch (err) {
      logger.error({ err, traceId: data.traceId }, 'voice_chat.cost_log.write_failed');
    }
  }

  // BaseSpecialist requires invokeLLM — never called (execute is fully overridden)
  protected override invokeLLM(
    _ctx: AssembledContext,
    _req: SpecialistRequest<VoiceChatAgentInput>,
  ): Promise<InvokeLLMResult> {
    return Promise.reject(new Error('VoiceChatAgent: use executeStream() not invokeLLM()'));
  }
}

export const voiceChatAgent = new VoiceChatAgent();
