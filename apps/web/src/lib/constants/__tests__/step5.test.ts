import { describe, expect, it } from 'vitest';

import {
  STEP5_BUTTON_GENERATE,
  STEP5_CATEGORIES_5,
  STEP5_FILE_MAX_MB,
  STEP5_FILE_UPLOADS_2,
  STEP5_INPUTS_2,
  STEP5_SUBTITLE,
  STEP5_TOTAL_TOPICS,
} from '../step5';
import type { Step5Topic } from '../step5';

describe('STEP5 constants', () => {
  it('SUBTITLE 字面严格 1:1 spec §7.6 line 1595', () => {
    expect(STEP5_SUBTITLE).toBe(
      '输入你的行业和产品信息，还可以上传产品资料和人物介绍文档，AI 将结合这些素材一次性生成 5 大类爆款选题（流量型/变现型/人设型/认知型/案例型），每类 20 个选题，共 100 个。',
    );
  });

  it('5 类 label 数组字面 1:1 spec §7.6 line 1626-1630', () => {
    const labels = STEP5_CATEGORIES_5.map((c) => c.label);
    expect(labels).toEqual(['流量型', '变现型', '人设型', '认知型', '案例型']);
  });

  it('INPUTS_2 数量锁 · length === 2', () => {
    expect(STEP5_INPUTS_2.length).toBe(2);
  });

  it('FILE_UPLOADS_2 数量锁 · length === 2', () => {
    expect(STEP5_FILE_UPLOADS_2.length).toBe(2);
  });

  it('FILE_MAX_MB === 20', () => {
    expect(STEP5_FILE_MAX_MB).toBe(20);
  });

  it('BUTTON_GENERATE 字面严格 1:1 spec §7.6 line 1606', () => {
    expect(STEP5_BUTTON_GENERATE).toBe('一键生成 5大类 爆款选题');
  });

  it('TOTAL_TOPICS === 100', () => {
    expect(STEP5_TOTAL_TOPICS).toBe(100);
  });

  it('Step5Topic interface 字段结构', () => {
    const topic: Step5Topic = {
      id: 'topic-001',
      category: 'traffic',
      title: '测试选题',
      hook: '开场钩子',
      structure: '内容结构',
      formula: '标题公式',
      platform: '抖音',
      difficulty: '简单',
      potential_stars: 4,
    };
    expect(topic.id).toBe('topic-001');
    expect(topic.category).toBe('traffic');
    expect(typeof topic.title).toBe('string');
    expect(topic.platform).toBe('抖音');
    expect(topic.potential_stars).toBe(4);
  });
});
