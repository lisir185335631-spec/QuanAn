import { describe, expect, it } from 'vitest';

import {
  IP_PLAN_FOOTER_TPL,
  IP_PLAN_GO_COMPLETE,
  IP_PLAN_H1,
  IP_PLAN_NEXT_BTN,
  IP_PLAN_PROGRESS_LABEL,
  IP_PLAN_STATUS_DONE,
  IP_PLAN_STATUS_TODO,
  IP_PLAN_STEPS,
  IP_PLAN_SUBTITLE_TPL,
  IP_PLAN_VIEW_DETAIL,
} from '../ipPlan';

describe('ipPlan constants', () => {
  it('IP_PLAN_STEPS 共 9 条', () => {
    expect(IP_PLAN_STEPS.length).toBe(9);
  });

  it('默认 done=true 共 4 条', () => {
    expect(IP_PLAN_STEPS.filter((s) => s.done).length).toBe(4);
  });

  it('默认 done=false 共 5 条', () => {
    expect(IP_PLAN_STEPS.filter((s) => !s.done).length).toBe(5);
  });

  it('字面锁 · H1 / 状态 / 进度 / 按钮', () => {
    expect(IP_PLAN_H1).toBe('我的IP方案');
    expect(IP_PLAN_STATUS_DONE).toBe('已完成');
    expect(IP_PLAN_STATUS_TODO).toBe('未完成');
    expect(IP_PLAN_VIEW_DETAIL).toBe('查看详情');
    expect(IP_PLAN_GO_COMPLETE).toBe('去完成');
    expect(IP_PLAN_PROGRESS_LABEL).toBe('IP打造进度');
    expect(IP_PLAN_NEXT_BTN).toBe('继续下一步');
  });

  it('副标 template 全角斜杠 · 已完成 4／9 步', () => {
    expect(IP_PLAN_SUBTITLE_TPL(4, 9)).toBe('已完成 4／9 步');
  });

  it('footer template 全角标点 · 还有 5 步未完成，继续打造你的IP吧！', () => {
    expect(IP_PLAN_FOOTER_TPL(5)).toBe('还有 5 步未完成，继续打造你的IP吧！');
  });

  it('step1 extra · 已选择行业：other(全角冒号)', () => {
    const step1 = IP_PLAN_STEPS[0];
    expect(step1?.extra).toBe('已选择行业：other');
  });
});
