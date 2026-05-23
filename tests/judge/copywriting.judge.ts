/**
 * QuanAn · US-016 · CopywritingAgent LLM Judge
 * AC-2: golden case — step7 mode / 健身行业 / xiaohongshu
 * AC-10: real scenario input
 * AC-11: quantifiable criteria (markdown ≥ 500 chars, ≥1 # heading, hooks ≥ 1)
 */

import { describe, it, expect, vi } from 'vitest';
import { runJudge, PASS_SCORE_THRESHOLD } from './judge-runner';
import type { JudgeCase } from './judge-runner';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/lib/prisma', () => ({
  prisma: { costLog: { create: vi.fn().mockResolvedValue({ id: BigInt(1) }) } },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ── Helper: build long markdown ───────────────────────────────────────────────

const MARKDOWN_BODY = `
## 为什么 90% 的健身新手第一年效果很差？

很多人开始健身时充满热情，每天去健身房，但 3 个月后看不到效果就放弃了。

### 核心问题一：没有设定可量化目标

❌ 错误：我要变瘦变健康
✅ 正确：3个月内体脂从25%降到20%，每周减重0.5kg

### 核心问题二：训练计划不科学

新手应该从**全身训练(Full Body Workout)**开始：
- 周一三五：力量训练(深蹲+硬拉+卧推+划船)
- 周二四：有氧+拉伸

### 核心问题三：饮食结构错误

每日摄入公式：
- 蛋白质：体重(kg) × 2g = 每日蛋白质克数
- 碳水：总热量的 40%
- 脂肪：总热量的 30%

### 实操清单(本周就能开始)

1. ✅ 下载食物称重 App，今天开始记录饮食
2. ✅ 预约健身教练评估，明确你的基础代谢
3. ✅ 购置基础器材：哑铃(5kg)+弹力带+瑜伽垫

**记住：一致性 > 强度。坚持平淡的训练，胜过偶尔的爆发。**
`.trim();

const goldenCase: JudgeCase = {
  specialistId: 'CopywritingAgent',
  mode: 'step7',
  input: { industry: 'fitness', platform: 'xiaohongshu', topic: '健身新手第一年避坑指南' },
  actualOutput: {
    markdown: `# 健身新手必看：第一年这样练，效率提升300%\n\n${MARKDOWN_BODY}`,
    structure: '痛点钩子 → 问题拆解(3个核心问题) → 解决方案 → 行动清单 → 金句收尾',
    hooks: [
      '90%的健身新手第一年白练？看完这篇少走3年弯路',
      '我健身3年没效果，直到明白了这3件事',
      '教练不会主动告诉你的健身秘密，建议收藏',
    ],
    cta: '点赞收藏，下次健身前再看一遍！有问题评论区见～',
  },
  criteria: [
    'markdown 字段长度不少于 500 个字符',
    'markdown 包含至少 1 个以 "# " 开头的标题行',
    'structure 为非空字符串，描述文案结构',
    'hooks 数组至少包含 1 个元素，每个元素为非空字符串',
    'cta 为非空字符串，包含行动引导语',
  ],
  expectedKeyFields: ['markdown', 'structure', 'hooks', 'cta'],
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe.skipIf(!process.env.ANTHROPIC_API_KEY)('CopywritingAgent LLM Judge — step7/fitness/xiaohongshu golden case', () => {

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

});
