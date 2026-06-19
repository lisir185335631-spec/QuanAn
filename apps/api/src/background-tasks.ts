/**
 * 后台任务集中注册表 —— 热插拔
 *
 * 之前:index.ts 的 start() 手写 ~13 段 `await import(...) + worker.on('error') / schedule*()` + log,
 * 加一个 worker/queue 要在 start() 里插一段,易漏、无统一编排。
 *
 * 现在:在 BACKGROUND_TASKS 数组里声明每个任务(devOnly 进程内 worker / 常驻 cron),
 * registerBackgroundTasks 按环境统一遍历启动。新增一个后台任务 = 加一条目,index.ts 零改动。
 */
import { logger } from '@/lib/logger';

export interface BackgroundTask {
  /** 日志 / 诊断用名 */
  name: string;
  /** 仅 dev 在进程内起(prod 各自作为独立 worker 容器跑) */
  devOnly?: boolean;
  /** 启动:import + start/schedule(+ 挂 error handler) */
  register: () => Promise<void>;
}

/**
 * 全部后台任务声明表(顺序即启动顺序)。
 * 每条目完整等价于原 index.ts start() 里对应的一段。
 */
export const BACKGROUND_TASKS: BackgroundTask[] = [
  // ── dev-only 进程内 worker(prod 各自独立容器 `pnpm worker:*`)──
  {
    name: 'image_gen_worker',
    devOnly: true,
    register: async () => {
      const { worker } = await import('./workers/image-gen/worker');
      worker.on('error', (err) => logger.error({ err }, 'image_gen_worker.error'));
    },
  },
  {
    name: 'daily_task_worker',
    devOnly: true,
    register: async () => {
      const { dailyTaskWorker } = await import('./workers/daily-task/worker');
      dailyTaskWorker.on('error', (err) => logger.error({ err }, 'daily_task_worker.error'));
    },
  },
  {
    name: 'deep_learning_worker',
    devOnly: true,
    register: async () => {
      const { deepLearningWorker } = await import('./jobs/deep-learning.job');
      deepLearningWorker.on('error', (err) => logger.error({ err }, 'deep_learning_worker.error'));
    },
  },
  // ── 常驻 cron / scheduler(dev + prod)──
  {
    name: 'daily_task_cron',
    register: async () => {
      const { dailyTaskCron } = await import('./cron/daily-task-runner');
      dailyTaskCron.start();
    },
  },
  {
    name: 'kpi_snapshot_crons',
    register: async () => {
      const { scheduleDailySnapshot, scheduleWeeklySnapshot, scheduleMonthlySnapshot } =
        await import('./jobs/admin/kpi-snapshot.job');
      await scheduleDailySnapshot();
      await scheduleWeeklySnapshot();
      await scheduleMonthlySnapshot();
    },
  },
  {
    name: 'anomaly_detection_cron',
    register: async () => {
      const { scheduleAnomalyDetection } = await import('./jobs/admin/anomaly-detection.job');
      await scheduleAnomalyDetection();
    },
  },
  {
    name: 'cost_anomaly_cron',
    register: async () => {
      const { scheduleCostAnomalyDetection } = await import('./jobs/admin/cost-anomaly.job');
      await scheduleCostAnomalyDetection();
    },
  },
  {
    name: 'violation_detection_cron',
    register: async () => {
      const { scheduleViolationDetection } = await import('./jobs/admin/violation-detection.job');
      await scheduleViolationDetection();
    },
  },
  {
    name: 'emergency_post_review_cron',
    register: async () => {
      const { scheduleEmergencyPostReview } = await import('./jobs/admin/emergency-post-review.job');
      await scheduleEmergencyPostReview();
    },
  },
  {
    name: 'quota_cleanup_cron',
    register: async () => {
      const { scheduleQuotaCleanup } = await import('./jobs/admin/quota-expiry.job');
      await scheduleQuotaCleanup();
    },
  },
  {
    name: 'ab_stop_loss_cron',
    register: async () => {
      const { scheduleAbStopLoss } = await import('./jobs/admin/ab-stop-loss.job');
      await scheduleAbStopLoss();
    },
  },
  {
    name: 'canary_stop_loss_cron',
    register: async () => {
      const { scheduleCanaryStopLoss } = await import('./jobs/admin/canary-stop-loss.job');
      await scheduleCanaryStopLoss();
    },
  },
  {
    name: 'constant_embed_worker',
    register: async () => {
      const { constantEmbedWorker } = await import('./jobs/admin/constant-embed-rebuild.job');
      constantEmbedWorker.on('error', (err) => logger.error({ err }, 'constant_embed_worker.error'));
    },
  },
];

/** 按环境遍历启动所有后台任务(devOnly 的在非 dev 跳过)。 */
export async function registerBackgroundTasks(opts: { isDev: boolean }): Promise<void> {
  for (const task of BACKGROUND_TASKS) {
    if (task.devOnly && !opts.isDev) continue;
    await task.register();
    logger.info({ task: task.name }, 'background_task.registered');
  }
}
