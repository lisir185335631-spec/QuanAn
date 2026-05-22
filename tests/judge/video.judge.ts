/**
 * QuanAn · US-016 · VideoAgent LLM Judge
 * AC-2: golden case — shooting mode / 美食行业 / douyin
 * AC-10: real scenario input
 * AC-11: quantifiable criteria (shotList ≥ 1, 13 fields/shot)
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

// ── Golden case ───────────────────────────────────────────────────────────────

const goldenCase: JudgeCase = {
  specialistId: 'VideoAgent',
  mode: 'shooting',
  input: { industry: 'food', platform: 'douyin', sourceCopy: '今天教大家做一道超简单的家常红烧肉，不需要任何厨艺基础也能做好！' },
  actualOutput: {
    shotList: [
      {
        scene: '开场钩子镜头',
        duration: '3秒',
        action: '厨师拿起金黄猪肉特写',
        dialogue: '大家好，今天教大家3步做出饭店级红烧肉！',
        cameraAngle: '特写',
        prop: '新鲜五花肉500g',
        lighting: '暖光补光灯',
        transition: '快切',
        sfx: '诱人的咕嘟声',
        voiceover: '学会了你的家人会爱上你的厨艺',
        subtitle: '3步做出饭店红烧肉',
        costume: '白色厨师服',
        location: '家庭厨房',
      },
      {
        scene: '食材准备',
        duration: '5秒',
        action: '展示全部食材并介绍',
        dialogue: '需要五花肉、生抽、老抽、冰糖、姜片',
        cameraAngle: '俯拍45度',
        prop: '食材摆盘展示板',
        lighting: '自然光+补光',
        transition: '溶解',
        sfx: '轻快BGM',
        voiceover: '所有食材超市都能买到，花费不超过30元',
        subtitle: '食材清单',
        costume: '白色厨师服',
        location: '厨房操作台',
      },
    ],
    equipment: ['手机支架', '补光灯', '无线麦克风', '俯拍架'],
    schedule: '单日完成拍摄：上午9点食材准备，10点开始拍摄，12点收工，下午剪辑',
  },
  criteria: [
    'shotList 数组至少包含 1 个镜头对象',
    '每个 shot 包含 scene/duration/action/dialogue/cameraAngle/prop/lighting/transition/sfx/voiceover/subtitle/costume/location 共 13 个字段',
    'equipment 为非空字符串数组',
    'schedule 为非空字符串，描述拍摄时间安排',
    '每个 shot 的 13 个字段值均为非空字符串',
  ],
  expectedKeyFields: ['shotList', 'equipment', 'schedule'],
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe.skipIf(!process.env.ANTHROPIC_API_KEY)('VideoAgent LLM Judge — shooting/food/douyin golden case', () => {

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
