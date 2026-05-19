/**
 * QuanAn · 合规接线 unit + integration tests (TD-016 修)
 * 覆盖 LD-018 R-14 PII mask + disclaimer · 验证:
 *   - piiMask: email/phone/id_card/bank_card 脱敏 + 递归对象 + 特殊对象保护
 *   - appendDisclaimerIfSensitive: 医疗/法律/金融 markdown 末尾追加 + 非敏感原样
 *   - attachDisclaimerMeta: JSON 结构加 _disclaimer 元数据
 *   - ContextAssembler._formatUserPrompt 接 piiMask · userPrompt 不含原 PII
 *   - BaseSpecialist.execute 输出按 input.industry 加 disclaimer
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';

import { piiMask, maskString } from '@/lib/compliance/pii-mask';
import { appendDisclaimerIfSensitive, attachDisclaimerMeta } from '@/lib/compliance/disclaimer';
import { ContextAssembler } from '@/services/context-assembler/ContextAssembler';
import { BaseSpecialist } from '@/specialists/base/BaseSpecialist';
import type {
  SpecialistConfig,
  InvokeLLMResult,
  ILLMGateway,
  AssembledContext,
} from '@/specialists/base/types';

// ── Mocks for integration tests ─────────────────────────────────────────────

vi.mock('@/services/context-assembler/ContextAssembler', async () => {
  const actual = await vi.importActual<typeof import('@/services/context-assembler/ContextAssembler')>(
    '@/services/context-assembler/ContextAssembler',
  );
  return {
    ...actual,
    contextAssembler: {
      assemble: vi.fn().mockResolvedValue({
        systemPrompt: '[system-stub]',
        userPrompt: '[user-stub]',
        tools: [],
        metadata: { contextTokens: 0, layersUsed: ['L2'], ragHits: [] },
      }),
    },
  };
});

vi.mock('@/lib/prisma', () => ({
  prisma: {
    costLog: { create: vi.fn().mockResolvedValue({ id: BigInt(1) }) },
    stepData: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ── 1. piiMask unit tests ───────────────────────────────────────────────────

describe('piiMask · string masking', () => {
  it('email 脱敏 → <EMAIL>', () => {
    const r = maskString('contact alice@example.com for details');
    expect(r.text).toBe('contact <EMAIL> for details');
    expect(r.hits).toEqual([{ type: 'email', count: 1 }]);
  });

  it('CN phone 11 位 → <PHONE>', () => {
    const r = maskString('call me at 13800138000 today');
    expect(r.text).toBe('call me at <PHONE> today');
    expect(r.hits[0]?.type).toBe('phone_cn');
  });

  it('id_card 18 位 → <ID_CARD>', () => {
    const r = maskString('身份证 11010119900307721X 验证');
    expect(r.text).toContain('<ID_CARD>');
    expect(r.text).not.toContain('11010119900307721X');
  });

  it('bank card 16-19 位 → <BANK_CARD>', () => {
    const r = maskString('卡号 6228480402564890018 转账');
    expect(r.text).toContain('<BANK_CARD>');
  });

  it('无 PII → 原样', () => {
    const r = maskString('hello world no PII here');
    expect(r.text).toBe('hello world no PII here');
    expect(r.hits).toEqual([]);
  });
});

describe('piiMask · recursive object masking', () => {
  it('递归脱敏 nested object string', () => {
    const input = {
      user: { name: 'Alice', email: 'alice@example.com' },
      orders: [{ phone: '13800138000', amount: 100 }],
    };
    const masked = piiMask(input);
    expect(masked.user.email).toBe('<EMAIL>');
    expect(masked.orders[0].phone).toBe('<PHONE>');
    expect(masked.user.name).toBe('Alice');
    expect(masked.orders[0].amount).toBe(100);
  });

  it('Date / Map / Set / Buffer 不破坏', () => {
    const date = new Date('2026-01-01');
    const map = new Map([['k', 'v']]);
    expect(piiMask(date)).toBe(date);
    expect(piiMask(map)).toBe(map);
    expect(piiMask(new Set([1, 2]))).toBeInstanceOf(Set);
    expect(piiMask(Buffer.from('hello'))).toBeInstanceOf(Buffer);
  });

  it('null / undefined / number / boolean 原样', () => {
    expect(piiMask(null)).toBe(null);
    expect(piiMask(undefined)).toBe(undefined);
    expect(piiMask(42)).toBe(42);
    expect(piiMask(true)).toBe(true);
  });
});

// ── 2. disclaimer unit tests ────────────────────────────────────────────────

describe('appendDisclaimerIfSensitive', () => {
  it('医疗 industry → markdown 末尾加医疗免责', () => {
    const out = appendDisclaimerIfSensitive('# 美容护肤指南', 'health');
    expect(out).toContain('# 美容护肤指南');
    expect(out).toContain('不构成医疗建议');
    expect(out).toContain('执业医师');
  });

  it('金融 industry → 投资风险免责', () => {
    const out = appendDisclaimerIfSensitive('# 理财干货', 'finance');
    expect(out).toContain('不构成投资建议');
    expect(out).toContain('投资有风险');
  });

  it('法律 industry → 法律意见免责', () => {
    const out = appendDisclaimerIfSensitive('# 离婚财产分割', 'law');
    expect(out).toContain('不构成法律意见');
    expect(out).toContain('执业律师');
  });

  it('非敏感 industry (健身) → 原样不加', () => {
    const original = '# 30 天减脂';
    expect(appendDisclaimerIfSensitive(original, 'food')).toBe(original);
  });

  it('空 industry → 原样', () => {
    expect(appendDisclaimerIfSensitive('# 内容', '')).toBe('# 内容');
  });
});

describe('attachDisclaimerMeta', () => {
  it('医疗 → 加 _disclaimer 字段', () => {
    const r = attachDisclaimerMeta({ scores: { hook: 80 } }, 'health');
    expect(r._disclaimer).toContain('不构成医疗建议');
    expect(r.scores).toEqual({ hook: 80 });
  });

  it('非敏感 → 不加 _disclaimer', () => {
    const r = attachDisclaimerMeta({ scores: { hook: 80 } }, 'food');
    expect(r).not.toHaveProperty('_disclaimer');
  });
});

// ── 3. ContextAssembler 接 piiMask integration ──────────────────────────────

describe('ContextAssembler._formatUserPrompt 接 piiMask (TD-016)', () => {
  it('input string 含 PII → userPrompt 含 <EMAIL>/<PHONE> 而非原文', async () => {
    // 直接调 private method via cast (test only · 不暴露 prod surface)
    const ca = new ContextAssembler();
    const formatUserPrompt = (ca as unknown as {
      _formatUserPrompt: (input: unknown) => string;
    })._formatUserPrompt.bind(ca);

    const out = formatUserPrompt('请联系 alice@example.com 或拨打 13800138000');
    expect(out).toContain('<EMAIL>');
    expect(out).toContain('<PHONE>');
    expect(out).not.toContain('alice@example.com');
    expect(out).not.toContain('13800138000');
  });

  it('input object 嵌套 PII → 递归脱敏', async () => {
    const ca = new ContextAssembler();
    const formatUserPrompt = (ca as unknown as {
      _formatUserPrompt: (input: unknown) => string;
    })._formatUserPrompt.bind(ca);

    const out = formatUserPrompt({
      industry: 'health',
      topic: '邮箱 doctor@hospital.cn 咨询',
      contact: { phone: '13800138000' },
    });
    expect(out).toContain('<EMAIL>');
    expect(out).toContain('<PHONE>');
    expect(out).not.toContain('doctor@hospital.cn');
    expect(out).not.toContain('13800138000');
    expect(out).toContain('health'); // industry 不算 PII · 保留
  });
});

// ── 4. BaseSpecialist 接 disclaimer integration ─────────────────────────────

const TestInputSchema = z.object({
  industry: z.string().optional(),
  topic: z.string().min(1),
});
const TestMarkdownOutputSchema = z.object({ markdown: z.string().min(1) });
const TestJsonOutputSchema = z.object({ scores: z.object({ overall: z.number() }) });

class TestMarkdownSpecialist extends BaseSpecialist<
  z.infer<typeof TestInputSchema>,
  z.infer<typeof TestMarkdownOutputSchema>
> {
  readonly config: SpecialistConfig = {
    agentId: 'CopywritingAgent',
    persona: { role: '文案专家', goal: '生成爆款', boundaries: [] },
    memory: { l1_readonly: [], l2_read: [], l2_write: [] },
    knowledge: { constants: [], rag: [], refresh_interval_sec: 600 },
    tools: ['llm.complete'],
    execution: { timeout_ms: 30_000, retry: 1, model_tier: 'lightweight', streaming: false },
  };
  readonly inputSchema = TestInputSchema;
  readonly outputSchema = TestMarkdownOutputSchema;

  protected async invokeLLM(): Promise<InvokeLLMResult> {
    return {
      content: { markdown: '# 测试爆款' },
      tokens: { prompt: 100, completion: 50, total: 150 },
      model: 'claude-haiku-4-5',
      isFallback: false,
    };
  }
}

class TestJsonSpecialist extends BaseSpecialist<
  z.infer<typeof TestInputSchema>,
  z.infer<typeof TestJsonOutputSchema>
> {
  readonly config: SpecialistConfig = {
    agentId: 'AnalysisAgent',
    persona: { role: '分析师', goal: '评分', boundaries: [] },
    memory: { l1_readonly: [], l2_read: [], l2_write: [] },
    knowledge: { constants: [], rag: [], refresh_interval_sec: 600 },
    tools: ['llm.complete'],
    execution: { timeout_ms: 30_000, retry: 1, model_tier: 'lightweight', streaming: false },
  };
  readonly inputSchema = TestInputSchema;
  readonly outputSchema = TestJsonOutputSchema;

  protected async invokeLLM(): Promise<InvokeLLMResult> {
    return {
      content: { scores: { overall: 85 } },
      tokens: { prompt: 100, completion: 50, total: 150 },
      model: 'claude-haiku-4-5',
      isFallback: false,
    };
  }
}

const fakeGateway: ILLMGateway = {
  complete: vi.fn(),
  stream: vi.fn(),
  embed: vi.fn(),
};

describe('BaseSpecialist.execute 接 disclaimer (TD-016)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('医疗 industry + markdown output → 末尾追加医疗免责', async () => {
    const sp = new TestMarkdownSpecialist(fakeGateway);
    const res = await sp.execute({
      accountId: 1,
      mode: 'free',
      userInput: { industry: 'health', topic: '熬夜皮肤好' },
    });
    expect(res.result.markdown).toContain('# 测试爆款');
    expect(res.result.markdown).toContain('不构成医疗建议');
  });

  it('医疗 industry + JSON output → 加 _disclaimer 元数据', async () => {
    const sp = new TestJsonSpecialist(fakeGateway);
    const res = await sp.execute({
      accountId: 1,
      mode: 'structural',
      userInput: { industry: 'health', topic: '减肥文案分析' },
    });
    expect(res.result.scores.overall).toBe(85);
    expect((res.result as unknown as { _disclaimer?: string })._disclaimer).toContain('不构成医疗建议');
  });

  it('非敏感 industry (健身) → markdown 不加 disclaimer', async () => {
    const sp = new TestMarkdownSpecialist(fakeGateway);
    const res = await sp.execute({
      accountId: 1,
      mode: 'free',
      userInput: { industry: 'food', topic: '30 天减脂' },
    });
    expect(res.result.markdown).toBe('# 测试爆款');
    expect(res.result.markdown).not.toContain('不构成');
  });

  it('input 没 industry → 原样无 disclaimer', async () => {
    const sp = new TestMarkdownSpecialist(fakeGateway);
    const res = await sp.execute({
      accountId: 1,
      mode: 'free',
      userInput: { topic: '通用话题' },
    });
    expect(res.result.markdown).toBe('# 测试爆款');
  });
});
