/**
 * Unit tests — PRD-8 US-011 AC-9
 * VoiceChatAgent: 12 tests
 *   - 每工具 dispatch mock (5)
 *   - L1 push/get/clear (3)
 *   - subscription 3 chunks (1)
 *   - tool call dispatch (1)
 *   - fallback (1)
 *   - timeout (1)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  VoiceChatAgent,
  VOICE_CHAT_TOOLS,
  type ToolDispatchFn,
  type VoiceChatStreamChunk,
} from '@/specialists/VoiceChatAgent';
import type { ILLMGateway, LLMStreamChunk } from '@/specialists/base/types';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/memory/l1-buffer', () => ({
  pushTurn: vi.fn().mockResolvedValue(undefined),
  getTurns: vi.fn().mockResolvedValue([]),
  clearBuffer: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    costLog: { create: vi.fn().mockResolvedValue({}) },
  },
}));

vi.mock('@/services/context-assembler/ContextAssembler', () => ({
  contextAssembler: { assemble: vi.fn().mockResolvedValue({ systemPrompt: '', userPrompt: '', metadata: { contextTokens: 0, layersUsed: [], ragHits: [] } }) },
}));

import { pushTurn, getTurns, clearBuffer } from '@/memory/l1-buffer';

// Helper: build a mock LLM gateway that yields given chunks
function buildMockGateway(chunks: LLMStreamChunk[]): ILLMGateway {
  return {
    complete: vi.fn(),
    stream: async function* () {
      for (const chunk of chunks) yield chunk;
    },
  };
}

// Helper: collect all chunks from executeStream
async function collectChunks(
  agent: VoiceChatAgent,
  userMessage: string,
  dispatchTool: ToolDispatchFn = async (_n, _a) => '{}',
): Promise<VoiceChatStreamChunk[]> {
  const results: VoiceChatStreamChunk[] = [];
  for await (const chunk of agent.executeStream(
    { accountId: 1, userInput: { userMessage } },
    dispatchTool,
  )) {
    results.push(chunk);
  }
  return results;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('VoiceChatAgent (US-011)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getTurns).mockResolvedValue([]);
    vi.mocked(pushTurn).mockResolvedValue(undefined);
    vi.mocked(clearBuffer).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ── VOICE_CHAT_TOOLS export ────────────────────────────────────────────────

  it('VOICE_CHAT_TOOLS exports 5 tools with correct names', () => {
    expect(VOICE_CHAT_TOOLS).toHaveLength(5);
    const names = VOICE_CHAT_TOOLS.map((t) => t.name);
    expect(names).toContain('get_current_step');
    expect(names).toContain('search_history');
    expect(names).toContain('query_diagnosis');
    expect(names).toContain('get_today_tasks');
    expect(names).toContain('get_evolution_insights');
  });

  // ── Tool dispatch: each of 5 tools dispatched via ToolDispatchFn ──────────

  it('dispatch: get_current_step called with correct name', async () => {
    const gateway = buildMockGateway([
      { type: 'meta', meta: { model: 'claude-test' } },
      { type: 'tool_call', result: { name: 'get_current_step', args: {} } } as LLMStreamChunk & { result: unknown },
      { type: 'done', tokens: { prompt: 10, completion: 5, total: 15 } },
    ]);
    const agent = new VoiceChatAgent(gateway);
    const dispatched: string[] = [];
    const dispatch: ToolDispatchFn = async (name) => {
      dispatched.push(name);
      return '{"steps":[]}';
    };
    const chunks = await collectChunks(agent, '你好', dispatch);
    expect(dispatched).toContain('get_current_step');
    expect(chunks.some((c) => c.type === 'tool_call')).toBe(true);
  });

  it('dispatch: search_history called with keyword arg', async () => {
    const gateway = buildMockGateway([
      { type: 'meta', meta: { model: 'claude-test' } },
      { type: 'tool_call', result: { name: 'search_history', args: { keyword: '选题' } } } as LLMStreamChunk & { result: unknown },
      { type: 'done', tokens: { prompt: 10, completion: 5, total: 15 } },
    ]);
    const agent = new VoiceChatAgent(gateway);
    const dispatched: Array<{ name: string; args: Record<string, unknown> }> = [];
    const dispatch: ToolDispatchFn = async (name, args) => {
      dispatched.push({ name, args });
      return '{"results":[]}';
    };
    await collectChunks(agent, '帮我搜选题', dispatch);
    expect(dispatched[0]?.name).toBe('search_history');
    expect(dispatched[0]?.args).toMatchObject({ keyword: '选题' });
  });

  it('dispatch: query_diagnosis emits tool_result chunk', async () => {
    const gateway = buildMockGateway([
      { type: 'meta', meta: { model: 'claude-test' } },
      { type: 'tool_call', result: { name: 'query_diagnosis', args: {} } } as LLMStreamChunk & { result: unknown },
      { type: 'done' },
    ]);
    const agent = new VoiceChatAgent(gateway);
    const chunks = await collectChunks(agent, '我的诊断怎么样', async () => '{"overallScore":7}');
    const toolResult = chunks.find((c) => c.type === 'tool_result');
    expect(toolResult).toBeDefined();
    expect(toolResult?.type === 'tool_result' && toolResult.result).toContain('overallScore');
  });

  it('dispatch: get_today_tasks emits tool_call + tool_result', async () => {
    const gateway = buildMockGateway([
      { type: 'meta', meta: { model: 'claude-test' } },
      { type: 'tool_call', result: { name: 'get_today_tasks', args: {} } } as LLMStreamChunk & { result: unknown },
      { type: 'done' },
    ]);
    const agent = new VoiceChatAgent(gateway);
    const chunks = await collectChunks(agent, '今日任务', async () => '{"tasks":[]}');
    expect(chunks.some((c) => c.type === 'tool_call' && c.type === 'tool_call' && 'toolName' in c && c.toolName === 'get_today_tasks')).toBe(true);
    expect(chunks.some((c) => c.type === 'tool_result')).toBe(true);
  });

  it('dispatch: get_evolution_insights dispatched', async () => {
    const gateway = buildMockGateway([
      { type: 'meta', meta: { model: 'claude-test' } },
      { type: 'tool_call', result: { name: 'get_evolution_insights', args: {} } } as LLMStreamChunk & { result: unknown },
      { type: 'done' },
    ]);
    const agent = new VoiceChatAgent(gateway);
    const dispatched: string[] = [];
    await collectChunks(agent, '我的进化情况', async (name) => {
      dispatched.push(name);
      return '{}';
    });
    expect(dispatched).toContain('get_evolution_insights');
  });

  // ── L1 Buffer: push/get/clear ─────────────────────────────────────────────

  it('L1 Buffer: pushTurn called twice (user+assistant) per turn', async () => {
    const gateway = buildMockGateway([
      { type: 'meta', meta: { model: 'claude-test' } },
      { type: 'delta', delta: '你好' },
      { type: 'done', tokens: { prompt: 5, completion: 3, total: 8 } },
    ]);
    const agent = new VoiceChatAgent(gateway);
    await collectChunks(agent, '你好呀');
    expect(pushTurn).toHaveBeenCalledTimes(2);
  });

  it('L1 Buffer: getTurns called with accountId=1, limit=10', async () => {
    const gateway = buildMockGateway([
      { type: 'meta', meta: { model: 'claude-test' } },
      { type: 'done' },
    ]);
    const agent = new VoiceChatAgent(gateway);
    await collectChunks(agent, '你好');
    expect(getTurns).toHaveBeenCalledWith(1, 10);
  });

  it('L1 Buffer: clearSession calls clearBuffer', async () => {
    const agent = new VoiceChatAgent();
    await agent.clearSession(42);
    expect(clearBuffer).toHaveBeenCalledWith(42);
  });

  // ── Subscription: 3 chunks (delta + tool_call + done) ────────────────────

  it('subscription: yields delta + tool_call + tool_result + done chunks', async () => {
    const gateway = buildMockGateway([
      { type: 'meta', meta: { model: 'claude-test' } },
      { type: 'delta', delta: '好的' },
      { type: 'tool_call', result: { name: 'get_current_step', args: {} } } as LLMStreamChunk & { result: unknown },
      { type: 'done', tokens: { prompt: 10, completion: 5, total: 15 } },
    ]);
    const agent = new VoiceChatAgent(gateway);
    const chunks = await collectChunks(agent, '我的进度', async () => '{}');
    const types = chunks.map((c) => c.type);
    expect(types).toContain('delta');
    expect(types).toContain('tool_call');
    expect(types).toContain('tool_result');
    expect(types).toContain('done');
  });

  // ── Tool call dispatch combined test ─────────────────────────────────────

  it('tool_call: dispatch result injected into tool_result chunk', async () => {
    const gateway = buildMockGateway([
      { type: 'meta', meta: { model: 'claude-test' } },
      { type: 'tool_call', result: { name: 'query_diagnosis', args: {} } } as LLMStreamChunk & { result: unknown },
      { type: 'done' },
    ]);
    const agent = new VoiceChatAgent(gateway);
    const chunks = await collectChunks(agent, '诊断', async () => '{"score":8}');
    const tr = chunks.find((c) => c.type === 'tool_result');
    expect(tr?.type === 'tool_result' && tr.result).toBe('{"score":8}');
  });

  // ── Fallback: gateway without stream → error chunk ────────────────────────

  it('fallback: no stream() → yields error chunk', async () => {
    const gateway: ILLMGateway = { complete: vi.fn() };
    const agent = new VoiceChatAgent(gateway);
    const chunks = await collectChunks(agent, '你好');
    expect(chunks[0]?.type).toBe('error');
  });

  // ── Timeout: gateway error chunk propagated ───────────────────────────────

  it('timeout: stream error chunk → yields error and stops', async () => {
    const gateway = buildMockGateway([
      { type: 'meta', meta: { model: 'claude-test' } },
      { type: 'error', error: { code: 'TIMEOUT', message: 'LLM timeout' } },
    ]);
    const agent = new VoiceChatAgent(gateway);
    const chunks = await collectChunks(agent, '你好');
    expect(chunks.some((c) => c.type === 'error')).toBe(true);
    // After error, no done chunk
    expect(chunks.some((c) => c.type === 'done')).toBe(false);
  });
});
