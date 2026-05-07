/**
 * QuanQn · 结构化日志(LD-013 · trace_id 贯穿)
 * AGENTS §6.9 · 严禁 console.log · 必须用 logger
 */

import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  transport:
    process.env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } }
      : undefined,
  base: { service: 'quanqn' },
  formatters: {
    level: (label) => ({ level: label }),
  },
});
