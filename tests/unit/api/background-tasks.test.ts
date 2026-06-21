/**
 * 后台任务注册表(热插拔)结构单测。
 * 只检查声明表结构,不调用 register()(那会真起 BullMQ worker / 连 Redis)。
 */
import { describe, it, expect } from 'vitest';

import { BACKGROUND_TASKS } from '@/background-tasks';

describe('background tasks registry · 热插拔', () => {
  it('集中登记 13 个后台任务,每个都有 name + register', () => {
    expect(BACKGROUND_TASKS).toHaveLength(13);
    for (const t of BACKGROUND_TASKS) {
      expect(typeof t.name).toBe('string');
      expect(typeof t.register).toBe('function');
    }
  });

  it('3 个 devOnly 进程内 worker(prod 各自独立容器),10 个常驻 cron/worker', () => {
    const devOnly = BACKGROUND_TASKS.filter((t) => t.devOnly).map((t) => t.name);
    expect(devOnly).toEqual(['image_gen_worker', 'daily_task_worker', 'deep_learning_worker']);
    expect(BACKGROUND_TASKS.filter((t) => !t.devOnly)).toHaveLength(10);
  });

  it('任务名唯一(便于日志/诊断定位)', () => {
    const names = BACKGROUND_TASKS.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
  });
});
