/**
 * QuanAn · US-012 · CopywritingAgent free mode LLM Judge
 * AC-1: 2 golden cases — 医美自媒体(熬夜皮肤好) + 健身教练(30天减脂)
 * criteria: markdown 含 hook + 干货 + cta + 0 编造数据
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

// ── Golden cases ──────────────────────────────────────────────────────────────

const goldenCaseMedical: JudgeCase = {
  specialistId: 'CopywritingAgent',
  mode: 'free',
  input: { industry: '医美', platform: 'xiaohongshu', topic: '熬夜也能皮肤好' },
  actualOutput: {
    markdown: `# 熬夜党救星！这3个习惯让你熬夜皮肤不垮

你是不是以为熬夜就一定会变黄变暗？错了！很多皮肤科医生自己也要熬夜，但她们的皮肤依然透亮——因为她们知道这3个秘密。

## 秘密一：熬夜前做好"防御工事"

熬夜前30分钟，做好这3步：
- **双重清洁**：先卸妆再洗脸，彻底清除白天的防晒和灰尘
- **烟酰胺精华**：浓度5%以内，帮助修护皮肤屏障
- **锁水面霜**：玻尿酸+神经酰胺组合，整夜保持水分

## 秘密二：熬夜中的"续命水"

每隔1小时，喝一杯温水（不是冷水）。真的！水分充足的皮肤，自我修复能力是脱水状态的3倍。

## 秘密三：熬夜后的"急救方案"

第二天早上，用**冰牛奶+棉片**湿敷5分钟，快速平复因熬夜导致的皮肤炎症。这是皮肤科医生的秘密武器。

## 注意事项

⚠️ 以上方法只能减轻熬夜伤害，不能完全抵消。最好的护肤就是不熬夜。

**今晚就开始做第一步，明天早上照镜子你会感谢自己的决定。**

你觉得哪个步骤最难坚持？评论告诉我～`,
    metadata: {
      scriptType: 'tutorial',
      elements: ['fear', 'social_proof', 'specificity'],
      structureSummary: '痛点钩子 → 反转认知 → 3秘密分拆 → 注意事项 → 行动号召',
      estimatedDuration: '3分钟阅读',
    },
  },
  criteria: [
    'markdown 字段长度不少于 400 个字符',
    'markdown 包含至少 1 个以 "# " 开头的标题行',
    'markdown 包含明确的 hook 开场(前两段提出问题或反转认知)',
    'markdown 包含至少 2 段干货内容(具体方法、步骤或数据)',
    'markdown 末尾包含 cta 引导(如提问、点赞、评论等互动语)',
    'metadata.elements 数组非空',
  ],
  expectedKeyFields: ['markdown', 'metadata'],
};

const goldenCaseFitness: JudgeCase = {
  specialistId: 'CopywritingAgent',
  mode: 'free',
  input: { industry: '健身', platform: 'douyin', topic: '30天减脂计划' },
  actualOutput: {
    markdown: `# 30天减脂不反弹！教练亲测方案公开

健身7年的我，终于找到了最适合普通人的30天减脂方案——不用饿肚子，每天只要40分钟。

## 第1-10天：启动期

**核心原则**：让身体开始消耗脂肪，而不是肌肉

每天方案：
- 早餐：燕麦100g + 水煮蛋2个 + 黑咖啡1杯
- 运动：20分钟快走 + 10分钟核心训练
- 晚餐：蛋白质为主，减少碳水

热量目标：基础代谢 × 1.2（约1600-1800kcal）

## 第11-20天：加速期

身体已适应，这时候加大强度：
- 有氧升级为20分钟HIIT（间歇跑）
- 力量训练加入：深蹲3×15 + 硬拉3×12

**关键数据**：这10天平均减重1.5-2kg，以脂肪消耗为主。

## 第21-30天：塑形期

最后10天不要再减少热量，而是优化体型：
- 增加蛋白质摄入至体重×2g
- 重点练薄弱部位（腹部/腿部）

## 最重要的一点

30天内不要称体重超过3次！体重波动2kg是正常的。**真正的进步看的是照片对比，不是数字。**

想要完整的每日打卡计划？评论"打卡"我发给你！`,
    metadata: {
      scriptType: 'tutorial',
      elements: ['specificity', 'authority', 'social_proof'],
      structureSummary: '结果承诺 → 3阶段分步骤 → 关键认知颠覆 → 互动号召',
      estimatedDuration: '3分钟阅读',
    },
  },
  criteria: [
    'markdown 字段长度不少于 400 个字符',
    'markdown 包含至少 1 个以 "# " 开头的标题行',
    'markdown 包含明确的 hook 开场(前两段提出问题或承诺结果)',
    'markdown 包含至少 2 段干货内容(具体数据、方法或步骤)',
    'markdown 末尾包含 cta 引导(互动引导或行动召唤)',
    'metadata.elements 数组非空',
  ],
  expectedKeyFields: ['markdown', 'metadata'],
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe.skipIf(!process.env.ANTHROPIC_API_KEY)('CopywritingAgent free mode LLM Judge — 2 golden cases', () => {

  it('医美自媒体 golden case(熬夜皮肤好) passes judge with score >= threshold', async () => {
    const result = await runJudge(goldenCaseMedical);

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

  it('健身教练 golden case(30天减脂) passes judge with score >= threshold', async () => {
    const result = await runJudge(goldenCaseFitness);

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
