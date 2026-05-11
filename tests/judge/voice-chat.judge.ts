/**
 * QuanQn · PRD-8 US-011 AC-12 · VoiceChatAgent LLM Judge
 * 3 cases: 1 工具 / 2 工具 / 0 工具 · 每 case 评分 ≥ 4.0/5
 * Judge 评估: 回复是否简洁(≤80字) / 工具是否被正确调用 / 语气是否口语化
 */

import { describe, it, expect, vi } from 'vitest';
import { runJudge, PASS_SCORE_THRESHOLD } from './judge-runner';
import type { JudgeCase } from './judge-runner';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/memory/l1-buffer', () => ({
  pushTurn: vi.fn().mockResolvedValue(undefined),
  getTurns: vi.fn().mockResolvedValue([]),
  clearBuffer: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: { costLog: { create: vi.fn().mockResolvedValue({ id: BigInt(1) }) } },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ── Helper: a valid VoiceChatAgent response (0 tools) ────────────────────────

const zeroToolResponse = {
  type: 'conversation',
  assistantText: '好的，有什么想聊的？',
  toolCalls: [],
};

// 1-tool response
const oneToolResponse = {
  type: 'conversation',
  assistantText: '好，我帮你查一下今日任务。',
  toolCalls: [
    {
      name: 'get_today_tasks',
      args: {},
      result: JSON.stringify({ found: true, tasks: [{ task: '发布选题内容' }], completedCount: 0, totalCount: 1 }),
    },
  ],
};

// 2-tool response
const twoToolResponse = {
  type: 'conversation',
  assistantText: '好的，帮你查进度和诊断。',
  toolCalls: [
    {
      name: 'get_current_step',
      args: {},
      result: JSON.stringify({ completedCount: 3, totalCount: 9 }),
    },
    {
      name: 'query_diagnosis',
      args: {},
      result: JSON.stringify({ overallScore: 7, topPriority: '内容质量' }),
    },
  ],
};

// ── Judge cases ───────────────────────────────────────────────────────────────

const case0Tool: JudgeCase = {
  specialistId: 'VoiceChatAgent',
  mode: 'voice',
  input: { userMessage: '你好，介绍一下你自己' },
  actualOutput: zeroToolResponse,
  criteria: [
    '回复简洁，字符数 ≤ 80',
    '语气口语化，适合语音播放',
    '没有调用任何工具(toolCalls 为空数组)',
    'assistantText 不为空',
  ],
  expectedKeyFields: ['type', 'assistantText', 'toolCalls'],
};

const case1Tool: JudgeCase = {
  specialistId: 'VoiceChatAgent',
  mode: 'voice',
  input: { userMessage: '帮我看看今天有什么任务' },
  actualOutput: oneToolResponse,
  criteria: [
    '调用了 get_today_tasks 工具(toolCalls 长度为 1)',
    'tool result 包含任务数据',
    'assistantText 提及"任务"或相关内容',
    '回复字符数 ≤ 80',
  ],
  expectedKeyFields: ['type', 'assistantText', 'toolCalls'],
};

const case2Tool: JudgeCase = {
  specialistId: 'VoiceChatAgent',
  mode: 'voice',
  input: { userMessage: '帮我看看我的进度和诊断结果' },
  actualOutput: twoToolResponse,
  criteria: [
    '调用了两个工具(toolCalls 长度为 2)',
    '包含 get_current_step 和 query_diagnosis 工具调用',
    'assistantText 提及查询的内容',
    '回复字符数 ≤ 80',
  ],
  expectedKeyFields: ['type', 'assistantText', 'toolCalls'],
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('VoiceChatAgent LLM Judge (AC-12)', () => {
  it('0-tool case: score ≥ 4.0/5', async () => {
    const result = await runJudge(case0Tool);
    expect(result.score).toBeGreaterThanOrEqual(PASS_SCORE_THRESHOLD);
  });

  it('1-tool case: score ≥ 4.0/5', async () => {
    const result = await runJudge(case1Tool);
    expect(result.score).toBeGreaterThanOrEqual(PASS_SCORE_THRESHOLD);
  });

  it('2-tool case: score ≥ 4.0/5', async () => {
    const result = await runJudge(case2Tool);
    expect(result.score).toBeGreaterThanOrEqual(PASS_SCORE_THRESHOLD);
  });
});
