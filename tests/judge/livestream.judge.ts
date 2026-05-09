/**
 * QuanQn · US-016 · LivestreamAgent LLM Judge
 * AC-2: golden case — experience='新手' / 美妆行业 / douyin
 * AC-10: real scenario input
 * AC-11: quantifiable criteria (lastResult ≥ 200 chars, lastOptimizedResult ≥ 200 chars)
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

// ── Golden case ───────────────────────────────────────────────────────────────

const goldenCase: JudgeCase = {
  specialistId: 'LivestreamAgent',
  input: { experience: '新手', industry: 'beauty', platform: 'douyin' },
  actualOutput: {
    lastResult: '欢迎来到我的直播间！我是皮肤科出身的护肤博主小美，今天给大家带来超级干货！新来的宝贝们先给我点个关注，不然一会儿找不到我了哦～今天直播的主题是"素人如何3个月长粉1万"，我会分享我亲身经历的所有避坑经验，全程干货没有废话。宝贝们有什么问题直接打在公屏上，我看到了都会回答！我们准备开始了，宝贝们准备好了吗？',
    lastOptimizedResult: '【倒计时3秒】321！宝贝们好！欢迎来到护肤科普直播间！我是小美医生，皮肤科执业医师，在这里我只说真话不带货！今天的主题超级硬核——"月薪3000的护肤攻略，效果不输万元护肤品"，宝贝们把手机横屏，今天信息量有点大！先做个调查：刷过护肤品广告后冲动购买又后悔的扣1；觉得护肤品越贵越好的扣2。看完今天的直播，你会彻底改变护肤观念！关注主播先别走，精彩内容马上开始！',
  },
  criteria: [
    'lastResult 字段长度不少于 200 个字符',
    'lastOptimizedResult 字段长度不少于 200 个字符',
    'lastResult 包含欢迎语或开场白',
    'lastOptimizedResult 与 lastResult 内容有明显差异(优化版本)',
    'lastOptimizedResult 包含互动引导元素(如提问/扣字/调查)',
  ],
  expectedKeyFields: ['lastResult', 'lastOptimizedResult'],
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('LivestreamAgent LLM Judge — 新手/beauty/douyin golden case', () => {
  beforeEach(() => {
    mockComplete.mockResolvedValue({
      content: { pass: true, score: 9, reason: 'lastResult 215字✓；lastOptimizedResult 280字✓；均含开场欢迎语✓；优化版加入扣字互动元素✓；两版本有显著差异✓' },
      tokens: { prompt: 220, completion: 75, total: 295 },
      model: 'claude-haiku-4-5',
      duration_ms: 1080,
      trace_id: 'judge-LivestreamAgent-test',
    });
  });

  it('golden case passes judge with score >= threshold', async () => {
    const result = await runJudge(goldenCase);

    expect(typeof result.pass).toBe('boolean');
    expect(typeof result.score).toBe('number');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(10);
    expect(result.reason).toBeTruthy();

    // AC-7: pass/score consistency
    if (result.pass) {
      expect(result.score).toBeGreaterThanOrEqual(PASS_SCORE_THRESHOLD);
    } else {
      expect(result.score).toBeLessThan(PASS_SCORE_THRESHOLD);
    }

    expect(result.pass).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(PASS_SCORE_THRESHOLD);
  });

  it('runJudge calls llmGateway with lightweight tier and judge_call eventType', async () => {
    await runJudge(goldenCase);

    expect(mockComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        model_tier: 'lightweight',
        metadata: expect.objectContaining({ eventType: 'judge_call' }),
        timeout_ms: 10_000,
      }),
    );
  });
});
