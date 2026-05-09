/**
 * QuanQn · US-012 · CopywritingAgent boom mode LLM Judge
 * AC-2: 2 golden cases — 育儿(5候选) + 理财(5候选) · 检查 5 篇风格差异
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runJudge, PASS_SCORE_THRESHOLD } from './judge-runner';
import type { JudgeCase } from './judge-runner';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const { mockComplete } = vi.hoisted(() => ({
  mockComplete: vi.fn(),
}));

vi.mock('@/workers/llm-gateway', () => ({
  llmGateway: { complete: mockComplete },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: { costLog: { create: vi.fn().mockResolvedValue({ id: BigInt(1) }) } },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildBoomCandidate(index: number, theme: string, style: string): string {
  return `【${style}版】\n\n${theme}第${index + 1}篇\n\n${style === '痛点' ? '你有没有想过' : style === '数据' ? '研究显示' : style === '故事' ? '那天发生了一件事' : style === '悬念' ? '有个秘密我一直没说' : '很多人不知道'}，关于${theme}这件事，${style}角度的完整分析在这里。深度内容帮助你从${theme}维度获得突破。最终建议：立刻行动，从今天开始改变你的${theme}状态！`;
}

// ── Golden cases ──────────────────────────────────────────────────────────────

const goldenCaseParenting: JudgeCase = {
  specialistId: 'CopywritingAgent',
  mode: 'boom',
  input: { industry: '育儿', elements: ['emotion', 'fear', 'social_proof'], theme: '如何培养孩子专注力' },
  actualOutput: {
    candidates: [
      buildBoomCandidate(0, '专注力培养', '痛点'),
      buildBoomCandidate(1, '专注力培养', '数据'),
      buildBoomCandidate(2, '专注力培养', '故事'),
      buildBoomCandidate(3, '专注力培养', '悬念'),
      buildBoomCandidate(4, '专注力培养', '干货'),
    ],
    metadata: {
      count: 5,
      elements: ['emotion', 'fear', 'social_proof'],
    },
  },
  criteria: [
    'candidates 数组恰好包含 5 个元素',
    '每个 candidate 字符串长度不少于 200 个字符',
    '5 个 candidate 的开头或风格有明显差异(不能5篇几乎相同)',
    'metadata.count 等于 5',
    'metadata.elements 数组非空',
  ],
  expectedKeyFields: ['candidates', 'metadata'],
};

const goldenCaseFinance: JudgeCase = {
  specialistId: 'CopywritingAgent',
  mode: 'boom',
  input: { industry: '理财', elements: ['fear', 'specificity', 'authority'], theme: '月薪5000如何开始理财' },
  actualOutput: {
    candidates: [
      buildBoomCandidate(0, '月薪5000理财', '痛点'),
      buildBoomCandidate(1, '月薪5000理财', '数据'),
      buildBoomCandidate(2, '月薪5000理财', '故事'),
      buildBoomCandidate(3, '月薪5000理财', '悬念'),
      buildBoomCandidate(4, '月薪5000理财', '干货'),
    ],
    metadata: {
      count: 5,
      elements: ['fear', 'specificity', 'authority'],
    },
  },
  criteria: [
    'candidates 数组恰好包含 5 个元素',
    '每个 candidate 字符串长度不少于 200 个字符',
    '5 个 candidate 的开头或风格有明显差异(不能5篇几乎相同)',
    'metadata.count 等于 5',
    'metadata.elements 数组非空',
  ],
  expectedKeyFields: ['candidates', 'metadata'],
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CopywritingAgent boom mode LLM Judge — 2 golden cases', () => {
  beforeEach(() => {
    mockComplete.mockResolvedValue({
      content: { pass: true, score: 8, reason: 'candidates恰好5条✓；每条超200字✓；5篇风格有差异✓；metadata.count=5✓；elements非空✓' },
      tokens: { prompt: 280, completion: 80, total: 360 },
      model: 'claude-haiku-4-5',
      duration_ms: 1180,
      trace_id: 'judge-CopywritingAgent-boom-test',
    });
  });

  it('育儿 golden case(专注力培养) passes judge with score >= threshold', async () => {
    const result = await runJudge(goldenCaseParenting);

    expect(typeof result.pass).toBe('boolean');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(10);
    expect(result.reason).toBeTruthy();

    if (result.pass) {
      expect(result.score).toBeGreaterThanOrEqual(PASS_SCORE_THRESHOLD);
    } else {
      expect(result.score).toBeLessThan(PASS_SCORE_THRESHOLD);
    }

    expect(result.pass).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(PASS_SCORE_THRESHOLD);
  });

  it('理财 golden case(月薪5000理财) passes judge with score >= threshold', async () => {
    const result = await runJudge(goldenCaseFinance);

    expect(typeof result.pass).toBe('boolean');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(10);
    expect(result.reason).toBeTruthy();

    if (result.pass) {
      expect(result.score).toBeGreaterThanOrEqual(PASS_SCORE_THRESHOLD);
    } else {
      expect(result.score).toBeLessThan(PASS_SCORE_THRESHOLD);
    }

    expect(result.pass).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(PASS_SCORE_THRESHOLD);
  });
});
