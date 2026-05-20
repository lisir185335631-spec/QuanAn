/**
 * PRD-24 US-001 · daily-tasks constants unit tests (D-233 AC-10)
 * ≥ 4 tests: STUB 长度 / 字面 spec line 2438-2440 / LOADING_TEXT / EMPTY constants
 */
import { describe, expect, it } from 'vitest';

import {
  DAILY_TASKS_EMPTY_CTA,
  DAILY_TASKS_EMPTY_DESC,
  DAILY_TASKS_EMPTY_TITLE,
  DAILY_TASKS_LOADING_TEXT,
  DAILY_TASKS_STUB,
} from '../daily-tasks';

describe('daily-tasks constants', () => {
  it('DAILY_TASKS_STUB 长度 3-5', () => {
    expect(DAILY_TASKS_STUB.length).toBeGreaterThanOrEqual(3);
    expect(DAILY_TASKS_STUB.length).toBeLessThanOrEqual(5);
  });

  it('DAILY_TASKS_STUB 字面包含 spec §8.5.2 line 2438-2440 示例', () => {
    const titles = DAILY_TASKS_STUB.map((t) => t.title);
    expect(titles).toContain('今天发布 1 条 step/7 生成的文案');
    expect(titles).toContain('优化 step/3 的简介');
    expect(titles).toContain('回复粉丝评论 X 条');
  });

  it('DAILY_TASKS_LOADING_TEXT 字面锁 "AI 老师正在为你制定今日任务..."', () => {
    expect(DAILY_TASKS_LOADING_TEXT).toBe('AI 老师正在为你制定今日任务...');
  });

  it('DAILY_TASKS_EMPTY_* 字面锁', () => {
    expect(DAILY_TASKS_EMPTY_TITLE).toBe('请先创建 IP 账号');
    expect(DAILY_TASKS_EMPTY_DESC).toBe('完成账号配置后即可获取每日任务');
    expect(DAILY_TASKS_EMPTY_CTA).toBe('添加账号');
  });

  it('每项 stub 任务包含 id/title/hint 字段且类型正确', () => {
    DAILY_TASKS_STUB.forEach((task) => {
      expect(task).toHaveProperty('id');
      expect(task).toHaveProperty('title');
      expect(task).toHaveProperty('hint');
      expect(typeof task.id).toBe('string');
      expect(typeof task.title).toBe('string');
      expect(typeof task.hint).toBe('string');
    });
  });
});
