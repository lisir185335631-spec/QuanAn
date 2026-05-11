/** Minimal ambient types for node-cron v3 (no @types/node-cron installed) */
declare module 'node-cron' {
  export interface ScheduledTask {
    start(): void;
    stop(): void;
    destroy(): void;
  }

  export interface ScheduleOptions {
    scheduled?: boolean;
    timezone?: string;
    recoverMissedExecutions?: boolean;
    runOnInit?: boolean;
    name?: string;
  }

  export function schedule(
    expression: string,
    func: () => void | Promise<void>,
    options?: ScheduleOptions,
  ): ScheduledTask;

  export function validate(expression: string): boolean;
}
