/**
 * Unit tests — PRD-4 US-002
 * ContextAssembler 完整实现(L2/L4/L5 + 常量 4 路并行)
 * AC-11: ≥ 10 tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks(必须在 import 之前声明 · vi.mock 被 hoisted) ──────────────────────

const { mockGetLatestInsight } = vi.hoisted(() => ({
  mockGetLatestInsight: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    stepData: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

vi.mock('@/memory/l4-profile', () => ({
  getLatestInsight: mockGetLatestInsight,
  getDeepLearningSamples: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// PRD-9 US-003: mock ragRetrieveWorker · 防真实 embedding 网络调用
vi.mock('@/workers/rag', () => ({
  ragRetrieveWorker: { retrieve: vi.fn().mockResolvedValue([]) },
}));

// ── Imports ──────────────────────────────────────────────────────────────────

import { ContextAssembler } from '@/services/context-assembler/ContextAssembler';
import { SPECIALIST_TEMPLATES } from '@/services/context-assembler/templates';
import type { AssembleRequest } from '@/services/context-assembler/types';
import { prisma } from '@/lib/prisma';

// ── Typed mock handle ─────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFindMany = vi.mocked((prisma.stepData as any).findMany) as ReturnType<typeof vi.fn>;

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeReq(overrides: Partial<AssembleRequest> = {}): AssembleRequest {
  return {
    agentId: 'CopywritingAgent',
    accountId: 42,
    userInput: { topic: '美妆教程', scriptType: 'tutorial' },
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ContextAssembler', () => {
  let assembler: ContextAssembler;

  beforeEach(() => {
    assembler = new ContextAssembler();
    vi.clearAllMocks();
    mockFindMany.mockResolvedValue([]);
    mockGetLatestInsight.mockResolvedValue(null);
  });

  // AC-2: 4 路并行 fetch 全成功 → layersUsed 有 constants
  it('all routes succeed → AssembledContext 结构完整', async () => {
    mockFindMany.mockResolvedValue([
      { stepKey: 'step1', result: { recommendation: '美妆博主' } },
    ]);
    const ctx = await assembler.assemble(makeReq());

    expect(ctx.systemPrompt).toBeTruthy();
    expect(ctx.userPrompt).toContain('<user_input>');
    expect(ctx.tools).toEqual([]);
    expect(ctx.metadata.layersUsed).toContain('constants');
    expect(ctx.metadata.contextTokens).toBeGreaterThan(0);
  });

  // AC-2: layersUsed 包含 L2_step_data 当 stepData 非空
  it('stepData 非空 → layersUsed 包含 L2_step_data', async () => {
    mockFindMany.mockResolvedValue([
      { stepKey: 'step3', result: { identity: '专业美妆' } },
    ]);
    const ctx = await assembler.assemble(makeReq());

    expect(ctx.metadata.layersUsed).toContain('L2_step_data');
    expect(ctx.systemPrompt).toContain('step3');
  });

  // AC-5: L2 stepData 为空 → 占位符注入 · 不报错
  it('stepData 为空 → 注入占位 [新用户 · 暂无 step 数据]', async () => {
    mockFindMany.mockResolvedValue([]);
    const ctx = await assembler.assemble(makeReq());

    expect(ctx.systemPrompt).toContain('[新用户 · 暂无 step 数据]');
    expect(ctx.metadata.layersUsed).not.toContain('L2_step_data');
  });

  // AC-6 (US-004): evolutionInsight=null → systemPrompt 不含 [Section 4] 段
  it('evolutionInsight=null(新用户) → systemPrompt 不含 [Section 4] 用户偏好画像', async () => {
    mockGetLatestInsight.mockResolvedValue(null);
    const ctx = await assembler.assemble(makeReq());

    expect(ctx.systemPrompt).not.toContain('[Section 4]');
    expect(ctx.systemPrompt).not.toContain('用户偏好画像');
  });

  // AC-7: L5 RAG 始终返回 [] · needRag 字段接口保留
  it('L5 RAG 降级 → ragHits 为空数组', async () => {
    const ctx = await assembler.assemble(makeReq({ needRag: ['knowledge_cases'] }));

    expect(ctx.metadata.ragHits).toEqual([]);
  });

  // AC-2: L2 fetch timeout → 降级占位 · 其他路继续(constants 成功)
  it('L2 stepData fetch timeout → 占位注入 · constants 层不受影响', async () => {
    mockFindMany.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve([{ stepKey: 's', result: {} }]), 10_000)),
    );

    const ctx = await assembler.assemble(makeReq());

    expect(ctx.systemPrompt).toContain('[新用户 · 暂无 step 数据]');
    expect(ctx.metadata.layersUsed).not.toContain('L2_step_data');
    expect(ctx.metadata.layersUsed).toContain('constants');
  }, 8_000);

  // AC-2: L2 fetch reject → 降级 · 不抛出
  it('L2 fetch reject → 降级占位 · assemble 不抛出', async () => {
    mockFindMany.mockRejectedValue(new Error('DB connection failed'));

    const ctx = await assembler.assemble(makeReq());

    expect(ctx.systemPrompt).toContain('[新用户 · 暂无 step 数据]');
    expect(ctx.metadata.layersUsed).not.toContain('L2_step_data');
  });

  // AC-3 + AC-11: 7 Specialist agentId 全有对应模板
  it('7 PRD-4 Specialist agentId 全有模板覆盖', () => {
    const expected = [
      'PositioningAgent',
      'BrandingAgent',
      'MonetizationAgent',
      'TopicAgent',
      'VideoAgent',
      'CopywritingAgent',
      'LivestreamAgent',
    ] as const;

    for (const id of expected) {
      expect(SPECIALIST_TEMPLATES[id], `template missing: ${id}`).toBeDefined();
      expect(SPECIALIST_TEMPLATES[id]?.persona, `persona missing: ${id}`).toBeTruthy();
    }
  });

  // AC-3: 每个模板 persona + methodology 都非空
  it('每个模板 persona 和 methodology 字段非空', () => {
    for (const [agentId, tmpl] of Object.entries(SPECIALIST_TEMPLATES)) {
      expect(tmpl?.persona, `${agentId}.persona`).toBeTruthy();
      expect(tmpl?.methodology, `${agentId}.methodology`).toBeTruthy();
    }
  });

  // AC-4: MethodologyQueryWorker 拉取常量 → prompt 包含方法论内容
  it('MethodologyQueryWorker 拉常量 → systemPrompt 含脚本类型和爆款元素', async () => {
    const ctx = await assembler.assemble(makeReq());

    expect(ctx.systemPrompt).toContain('脚本类型');
    expect(ctx.systemPrompt).toContain('爆款元素');
    expect(ctx.systemPrompt).toContain('方法论');
  });

  // AC-9: contextTokens = ceil((systemPrompt + userPrompt).length / 4)
  it('contextTokens 等于 chars/4 粗算', async () => {
    const ctx = await assembler.assemble(makeReq());

    const expected = Math.ceil((ctx.systemPrompt.length + ctx.userPrompt.length) / 4);
    expect(ctx.metadata.contextTokens).toBe(expected);
  });

  // AC-8: metadata.layersUsed 仅含实际成功的层
  it('metadata.layersUsed 仅含成功层(L2 失败时不含 L2)', async () => {
    mockFindMany.mockRejectedValue(new Error('DB error'));

    const ctx = await assembler.assemble(makeReq());

    expect(ctx.metadata.layersUsed).not.toContain('L2_step_data');
    expect(ctx.metadata.layersUsed).toContain('constants');
  });

  // AC-10: R-001 — systemPrompt 不含 LLM key
  it('R-001: systemPrompt 不含 BASE_LLM_URL / LLM_API_KEY / sk-', async () => {
    mockFindMany.mockResolvedValue([
      { stepKey: 'step1', result: { data: 'any' } },
    ]);
    const ctx = await assembler.assemble(makeReq());

    expect(ctx.systemPrompt).not.toMatch(/BASE_LLM_URL|LLM_API_KEY|sk-/);
  });

  // AC-12: 总 assemble 耗时 ≤ 800ms
  it('assemble 耗时 ≤ 800ms(并行 4 路 · 模拟正常 DB 响应)', async () => {
    mockFindMany.mockResolvedValue([]);
    const start = Date.now();
    await assembler.assemble(makeReq());
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(800);
  });

  // accountId 隔离: prisma.stepData.findMany 必须带 accountId WHERE
  it('prisma.stepData.findMany 调用时传入正确 accountId(反模式 REJ-008)', async () => {
    mockFindMany.mockResolvedValue([]);
    await assembler.assemble(makeReq({ accountId: 999 }));

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { accountId: 999 } }),
    );
  });

  // 未知 agentId → fallback persona · 不抛出
  it('无模板的 agentId(DiagnosisAgent) → fallback persona · 不抛出', async () => {
    const ctx = await assembler.assemble(makeReq({ agentId: 'DiagnosisAgent' }));

    expect(ctx.systemPrompt).toBeTruthy();
    expect(ctx.systemPrompt).toContain('DiagnosisAgent');
  });
});
