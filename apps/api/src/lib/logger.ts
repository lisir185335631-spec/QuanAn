/**
 * QuanQn · 结构化日志(LD-013 · trace_id 贯穿)
 * AGENTS §6.9 · 严禁 console.log · 必须用 logger
 * US-007: AsyncLocalStorage traceStore + pino mixin 自动注入 traceId
 */

import { AsyncLocalStorage } from 'node:async_hooks';

// eslint-disable-next-line import/no-named-as-default
import pino from 'pino';

/** trace_id 上下文存储 — trace middleware 设置，logger 自动读取 */
export const traceStore = new AsyncLocalStorage<{ traceId: string }>();

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  transport:
    process.env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } }
      : undefined,
  formatters: {
    level: (label) => ({ level: label }),
  },
  // eslint-disable-next-line import/no-named-as-default-member
  timestamp: pino.stdTimeFunctions.isoTime,
  mixin() {
    const store = traceStore.getStore();
    return store?.traceId ? { traceId: store.traceId } : {};
  },
});
