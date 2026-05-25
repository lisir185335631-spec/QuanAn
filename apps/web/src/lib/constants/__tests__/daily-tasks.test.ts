/**
 * /daily-tasks constants unit tests (sally 真实页 mock-first)
 * 对齐新常量: DAILY_TASKS_H1 / SUBTITLE / CHIP / 4 MOCK task / 3 STATS / tag mapping
 */
import { describe, expect, it } from 'vitest';

import {
  CATEGORY_ICON_MAP,
  DAILY_TASKS_CHIP,
  DAILY_TASKS_FOOTER_BTN_1,
  DAILY_TASKS_FOOTER_BTN_1_HREF,
  DAILY_TASKS_FOOTER_BTN_2,
  DAILY_TASKS_FOOTER_BTN_2_HREF,
  DAILY_TASKS_H1,
  DAILY_TASKS_MOCK,
  DAILY_TASKS_PROGRESS_COMPLETED,
  DAILY_TASKS_PROGRESS_LABEL,
  DAILY_TASKS_PROGRESS_TOTAL,
  DAILY_TASKS_STATS,
  DAILY_TASKS_SUBTITLE,
  PRIORITY_LABELS,
} from '../daily-tasks';

describe('daily-tasks constants (sally mock-first)', () => {
  it('page-level 字面锁: CHIP / H1 / SUBTITLE', () => {
    expect(DAILY_TASKS_CHIP).toBe('每日任务');
    expect(DAILY_TASKS_H1).toBe('今日行动清单');
    expect(DAILY_TASKS_SUBTITLE).toBe('每天完成具体任务，一步步打造变现IP');
  });

  it('DAILY_TASKS_MOCK 长度 = 4', () => {
    expect(DAILY_TASKS_MOCK).toHaveLength(4);
  });

  it('DAILY_TASKS_MOCK 每项含 id / title / priority / category / desc', () => {
    DAILY_TASKS_MOCK.forEach((task) => {
      expect(task).toHaveProperty('id');
      expect(task).toHaveProperty('title');
      expect(task).toHaveProperty('priority');
      expect(task).toHaveProperty('category');
      expect(task).toHaveProperty('desc');
      expect(typeof task.id).toBe('string');
      expect(typeof task.title).toBe('string');
      expect(typeof task.desc).toBe('string');
    });
  });

  it('DAILY_TASKS_STATS 长度 = 3 · label 字面锁', () => {
    expect(DAILY_TASKS_STATS).toHaveLength(3);
    const labels = DAILY_TASKS_STATS.map((s) => s.label);
    expect(labels).toContain('连续打卡天数');
    expect(labels).toContain('累计打卡天数');
    expect(labels).toContain('累计完成任务');
  });

  it('progress constants 字面锁', () => {
    expect(DAILY_TASKS_PROGRESS_LABEL).toBe('今日进度');
    expect(DAILY_TASKS_PROGRESS_COMPLETED).toBe(0);
    expect(DAILY_TASKS_PROGRESS_TOTAL).toBe(4);
  });

  it('PRIORITY_LABELS tag mapping 完整性', () => {
    expect(PRIORITY_LABELS.high).toBe('高');
    expect(PRIORITY_LABELS.medium).toBe('中');
    expect(PRIORITY_LABELS.low).toBe('低');
  });

  it('CATEGORY_ICON_MAP 包含 3 个 category', () => {
    expect(CATEGORY_ICON_MAP['学习研究']).toBeDefined();
    expect(CATEGORY_ICON_MAP['内容创作']).toBeDefined();
    expect(CATEGORY_ICON_MAP['账号优化']).toBeDefined();
  });

  it('footer button 字面锁 + href', () => {
    expect(DAILY_TASKS_FOOTER_BTN_1).toBe('IP诊断');
    expect(DAILY_TASKS_FOOTER_BTN_2).toBe('继续做IP方案');
    expect(DAILY_TASKS_FOOTER_BTN_1_HREF).toBe('/diagnosis');
    expect(DAILY_TASKS_FOOTER_BTN_2_HREF).toBe('/step/1');
  });
});
