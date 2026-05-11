/**
 * DailyTask Cron Runner — PRD-8 US-002 AC-5
 * cron.schedule('0 0 * * *') 定义每日 0 点触发 DailyTaskAgent
 * ⚠️ cron.start() 不在本 story 调用(留 US-007 启动 · 避免 stub 跑)
 */

import { schedule } from 'node-cron';

import { logger } from '@/lib/logger';

/** 每日 0 点任务调度入口 (PRD-8 US-007 真接) */
export const dailyTaskCron = schedule(
  '0 0 * * *',
  () => {
    // PRD-8 US-007 真接: 批量为所有活跃账号生成今日任务
    logger.info('daily_task_cron.triggered · US-007 stub · no-op');
  },
  {
    scheduled: false, // US-007 启动时改 scheduled: true 或调 dailyTaskCron.start()
    timezone: 'Asia/Shanghai',
  },
);
