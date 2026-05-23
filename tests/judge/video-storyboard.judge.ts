/**
 * QuanAn · US-014 · VideoAgent storyboard mode LLM Judge
 * AC-3: 2 golden cases — 美食探店(5-8 scenes) + 旅游 vlog
 * criteria: 5-8 scenes + imagePromptEn 全 ASCII 英文 regex /^[\x20-\x7E\t\n\r]+$/
 */

import { describe, expect, it, vi } from 'vitest';

import { PASS_SCORE_THRESHOLD, runJudge } from './judge-runner';
import type { JudgeCase } from './judge-runner';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/lib/prisma', () => ({
  prisma: { costLog: { create: vi.fn().mockResolvedValue({ id: BigInt(1) }) } },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ── ASCII-only regex (same as AC-4 StoryboardSceneSchema) ─────────────────────

const ASCII_ONLY_REGEX = /^[ -~\t\n\r]+$/;

function isAsciiOnly(str: string): boolean {
  return ASCII_ONLY_REGEX.test(str);
}

// ── Golden cases ──────────────────────────────────────────────────────────────

const goldenCaseFood: JudgeCase = {
  specialistId: 'VideoAgent',
  mode: 'storyboard',
  input: { industry: '美食', platform: 'douyin', sourceCopy: '探访上海最火网红小龙虾店，排队3小时值不值？带大家看看真实体验！', scenesCount: 5 },
  actualOutput: {
    title: '上海网红小龙虾店探店 vlog',
    totalDuration: '60s',
    scenes: [
      { index: 1, description: '博主站在餐厅门口，展示排队长龙，拍摄招牌特写', imagePromptEn: 'food blogger standing outside popular restaurant entrance, long queue of customers, neon sign closeup, Shanghai street food scene', duration: '8s' },
      { index: 2, description: '特写展示菜单和招牌菜小龙虾，配菜品介绍', imagePromptEn: 'closeup of laminated menu showing crayfish dishes with prices, red spicy crayfish hero shot on menu background', duration: '10s' },
      { index: 3, description: '服务员端上一大盆红艳艳的小龙虾，热气腾腾', imagePromptEn: 'waiter carrying large steaming bowl of bright red spicy crayfish garnished with chili peppers and garlic, overhead restaurant shot', duration: '12s' },
      { index: 4, description: '博主品尝小龙虾，表情特写展示真实反应', imagePromptEn: 'food blogger tasting crayfish, genuine reaction close-up facial expression, fingers peeling crayfish shell, shallow depth of field', duration: '15s' },
      { index: 5, description: '餐厅环境全景和结尾总结推荐', imagePromptEn: 'wide shot of busy restaurant interior with red lantern decorations, customers enjoying meal, blogger giving thumbs up to camera', duration: '15s' },
    ],
  },
  criteria: [
    'scenes 数组长度在 5-8 之间（含）',
    '每个 scene 包含 index/description/imagePromptEn/duration 字段',
    '每个 scene 的 imagePromptEn 只包含 ASCII 可打印字符（无中文/日文/韩文等非 ASCII 字符）',
    'title 为非空字符串',
    'totalDuration 为非空字符串',
  ],
  expectedKeyFields: ['title', 'totalDuration', 'scenes'],
};

const goldenCaseTravel: JudgeCase = {
  specialistId: 'VideoAgent',
  mode: 'storyboard',
  input: { industry: '旅游', platform: 'xiaohongshu', sourceCopy: '云南大理7天自由行攻略，网红打卡地 + 隐藏宝藏景点全揭秘！', scenesCount: 6 },
  actualOutput: {
    title: '云南大理7天自由行 vlog',
    totalDuration: '75s',
    scenes: [
      { index: 1, description: '大理古城城门全景，阳光洒落青石板路', imagePromptEn: 'panoramic view of Dali Ancient City gate under golden sunlight, tourists walking on cobblestone path, traditional Bai architecture with flowers', duration: '10s' },
      { index: 2, description: '洱海日出航拍视角，薄雾笼罩湖面', imagePromptEn: 'aerial drone shot of Erhai Lake at sunrise, misty morning fog over calm water surface, golden light reflection, mountain backdrop', duration: '12s' },
      { index: 3, description: '苍山雪景远眺，与洱海形成对比', imagePromptEn: 'distant view of snow-capped Cangshan mountain peaks contrasting with blue Erhai Lake below, clear sky, dramatic landscape', duration: '10s' },
      { index: 4, description: '古城民宿庭院，鲜花盛开藤蔓缠绕', imagePromptEn: 'charming courtyard of traditional Bai-style guesthouse, blooming bougainvillea pink flowers climbing white walls, wooden lattice windows', duration: '8s' },
      { index: 5, description: '当地特色美食乳扇和鲜花饼展示', imagePromptEn: 'traditional Yunnan food spread including rubing cheese being grilled, rose petal flower cake on wooden table, local street market', duration: '10s' },
      { index: 6, description: '博主在双廊日落剪影收尾', imagePromptEn: 'silhouette of traveler blogger against dramatic orange sunset sky at Shuanglang pier, golden reflections on calm lake water', duration: '25s' },
    ],
  },
  criteria: [
    'scenes 数组长度在 5-8 之间（含）',
    '每个 scene 包含 index/description/imagePromptEn/duration 字段',
    '每个 scene 的 imagePromptEn 只包含 ASCII 可打印字符（无中文/日文/韩文等非 ASCII 字符）',
    'title 为非空字符串',
    'totalDuration 为非空字符串',
  ],
  expectedKeyFields: ['title', 'totalDuration', 'scenes'],
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe.skipIf(!process.env.ANTHROPIC_API_KEY)('VideoAgent storyboard mode LLM Judge — 美食 + 旅游 2 golden cases', () => {

  it('美食探店 golden case passes judge with score >= threshold', async () => {
    const result = await runJudge(goldenCaseFood);

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

  it('旅游 vlog golden case passes judge with score >= threshold', async () => {
    const result = await runJudge(goldenCaseTravel);

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

  it('imagePromptEn is ASCII-only in 美食 golden case scenes', () => {
    const scenes = goldenCaseFood.actualOutput.scenes as Array<{ imagePromptEn: string }>;
    for (const scene of scenes) {
      expect(isAsciiOnly(scene.imagePromptEn)).toBe(true);
    }
  });

  it('imagePromptEn is ASCII-only in 旅游 golden case scenes', () => {
    const scenes = goldenCaseTravel.actualOutput.scenes as Array<{ imagePromptEn: string }>;
    for (const scene of scenes) {
      expect(isAsciiOnly(scene.imagePromptEn)).toBe(true);
    }
  });

  it('scenes count is between 5 and 8 inclusive in both golden cases', () => {
    const foodScenes = goldenCaseFood.actualOutput.scenes as unknown[];
    const travelScenes = goldenCaseTravel.actualOutput.scenes as unknown[];

    expect(foodScenes.length).toBeGreaterThanOrEqual(5);
    expect(foodScenes.length).toBeLessThanOrEqual(8);
    expect(travelScenes.length).toBeGreaterThanOrEqual(5);
    expect(travelScenes.length).toBeLessThanOrEqual(8);
  });
});
