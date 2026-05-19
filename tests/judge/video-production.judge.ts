/**
 * QuanAn · US-014 · VideoAgent production mode LLM Judge
 * AC-1: 2 golden cases — 美妆(彩妆教程) + 健身(减脂计划)
 * criteria: 13 列分镜检查 + 每列字段必填 + model_tier='lightweight' + eventType='judge_call'
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PASS_SCORE_THRESHOLD, runJudge } from './judge-runner';
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

// ── Golden cases ──────────────────────────────────────────────────────────────

const SHOT_COLUMNS_13 = ['scene', 'duration', 'action', 'dialogue', 'cameraAngle', 'prop', 'lighting', 'transition', 'sfx', 'voiceover', 'subtitle', 'costume', 'location'] as const;

const goldenCaseMakeup: JudgeCase = {
  specialistId: 'VideoAgent',
  mode: 'production',
  input: { industry: '美妆', platform: 'xiaohongshu', sourceCopy: '今天教大家一套完整的日系清纯妆容，适合新手零基础，跟着做就能成功！' },
  actualOutput: {
    shotList: [
      {
        scene: '开场钩子',
        duration: '3秒',
        action: '博主展示妆前妆后对比',
        dialogue: '零基础也能学会的日系清纯妆，跟我一起做！',
        cameraAngle: '正面中景',
        prop: '化妆品平铺展示',
        lighting: '柔光环形灯',
        transition: '快切',
        sfx: '轻柔BGM',
        voiceover: '日系清纯妆完整教程',
        subtitle: '零基础也能学会',
        costume: '白色简约上衣',
        location: '梳妆台前',
      },
      {
        scene: '底妆步骤',
        duration: '20秒',
        action: '演示粉底液涂抹手法',
        dialogue: '先用提亮液，然后拍上薄薄一层粉底',
        cameraAngle: '侧面45度特写',
        prop: '粉底液、美妆蛋',
        lighting: '补光灯辅助',
        transition: '溶解',
        sfx: '无',
        voiceover: '底妆要轻薄透亮才有日系感',
        subtitle: '底妆：薄透不厚重',
        costume: '白色简约上衣',
        location: '梳妆台前',
      },
      {
        scene: '眼妆演示',
        duration: '30秒',
        action: '分步骤画眼影和卧蚕',
        dialogue: '卧蚕是日系妆容的灵魂，一定要画！',
        cameraAngle: '超近景眼部特写',
        prop: '眼影盘、眼线液',
        lighting: '环形灯正面',
        transition: '切入',
        sfx: '轻音乐',
        voiceover: '棕色眼影打底，白色卧蚕收尾',
        subtitle: '卧蚕 = 日系感关键',
        costume: '同开场',
        location: '梳妆台前',
      },
    ],
    equipment: ['环形补光灯', '手机支架', '无线麦克风', '侧面辅助灯'],
    schedule: 'Day 1上午：底妆+眼妆镜头；下午：唇妆+修容；Day 2剪辑调色',
  },
  criteria: [
    'shotList 数组至少包含 1 个镜头对象',
    '每个 shot 包含 scene/duration/action/dialogue/cameraAngle/prop/lighting/transition/sfx/voiceover/subtitle/costume/location 共 13 个字段',
    '每个 shot 的 13 个字段值均为非空字符串',
    'equipment 为非空字符串数组',
    'schedule 为非空字符串',
  ],
  expectedKeyFields: ['shotList', 'equipment', 'schedule'],
};

const goldenCaseFitness: JudgeCase = {
  specialistId: 'VideoAgent',
  mode: 'production',
  input: { industry: '健身', platform: 'douyin', sourceCopy: '分享我的30天减脂计划，科学饮食 + 有氧力量结合，让你安全有效瘦下来！' },
  actualOutput: {
    shotList: [
      {
        scene: '结果展示钩子',
        duration: '5秒',
        action: '展示30天前后对比照',
        dialogue: '30天减掉8斤，这是我的完整方案！',
        cameraAngle: '正面中景',
        prop: '前后对比照片',
        lighting: '自然光+补光灯',
        transition: '快切',
        sfx: '激励BGM开场',
        voiceover: '30天减脂真实结果',
        subtitle: '30天 · 减8斤 · 真实方案',
        costume: '运动装',
        location: '健身房镜前',
      },
      {
        scene: '饮食计划讲解',
        duration: '25秒',
        action: '展示每日饮食食材清单',
        dialogue: '早餐燕麦+鸡蛋，午餐蛋白质为主，晚餐轻碳水',
        cameraAngle: '俯拍食材摆盘',
        prop: '食材摆盘、饮食记录表',
        lighting: '顶光+侧补光',
        transition: '推进特写',
        sfx: '轻快节奏',
        voiceover: '一日三餐搭配科学才减脂',
        subtitle: '热量缺口500大卡/天',
        costume: '日常休闲装',
        location: '厨房操作台',
      },
      {
        scene: '训练动作示范',
        duration: '35秒',
        action: '演示HIIT + 深蹲组合动作',
        dialogue: '每天40分钟，3组HIIT加力量训练',
        cameraAngle: '全身正面 + 侧面切换',
        prop: '瑜伽垫、哑铃',
        lighting: '明亮健身房灯光',
        transition: '快速剪辑',
        sfx: '激励音乐',
        voiceover: '动作标准比次数多更重要',
        subtitle: 'HIIT 20min + 力量 20min',
        costume: '专业运动装',
        location: '健身房',
      },
    ],
    equipment: ['手持稳定器', '三脚架', '广角镜头手机夹', '无线麦克风', '补光灯'],
    schedule: 'Day 1上午(9-11点)：户外跑步镜头；下午(14-16点)：室内训练；Day 2：饮食场景；Day 3：剪辑',
  },
  criteria: [
    'shotList 数组至少包含 1 个镜头对象',
    '每个 shot 包含 scene/duration/action/dialogue/cameraAngle/prop/lighting/transition/sfx/voiceover/subtitle/costume/location 共 13 个字段',
    '每个 shot 的 13 个字段值均为非空字符串',
    'equipment 为非空字符串数组',
    'schedule 为非空字符串',
  ],
  expectedKeyFields: ['shotList', 'equipment', 'schedule'],
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('VideoAgent production mode LLM Judge — 美妆 + 健身 2 golden cases', () => {
  beforeEach(() => {
    mockComplete.mockResolvedValue({
      content: { pass: true, score: 8, reason: 'shotList ≥1✓；13字段全填✓；每字段非空✓；equipment 非空✓；schedule 非空✓' },
      tokens: { prompt: 280, completion: 90, total: 370 },
      model: 'claude-haiku-4-5',
      duration_ms: 1200,
      trace_id: 'judge-VideoAgent-production-test',
    });
  });

  it('美妆教程 golden case passes judge with score >= threshold', async () => {
    const result = await runJudge(goldenCaseMakeup);

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

  it('健身减脂 golden case passes judge with score >= threshold', async () => {
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

  it('runJudge calls llmGateway with model_tier=lightweight and eventType=judge_call', async () => {
    await runJudge(goldenCaseMakeup);

    expect(mockComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        model_tier: 'lightweight',
        metadata: expect.objectContaining({ eventType: 'judge_call' }),
        timeout_ms: 10_000,
      }),
    );
  });

  it('all 13 shot columns present in golden case shotList', () => {
    const shots = goldenCaseMakeup.actualOutput.shotList as Record<string, unknown>[];
    for (const shot of shots) {
      for (const col of SHOT_COLUMNS_13) {
        expect(typeof shot[col]).toBe('string');
        expect((shot[col] as string).length).toBeGreaterThan(0);
      }
    }
  });
});
