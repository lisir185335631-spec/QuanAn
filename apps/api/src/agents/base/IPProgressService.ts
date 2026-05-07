/**
 * QuanQn · IPProgressService · 软 Supervisor(确定性服务 · 无 LLM)
 * 派生自 ARCHITECTURE.md §4.6 + ADR-004
 *
 * 跟踪 9 步进度 · 服务 /ip-plan · /daily-tasks · /evolution
 */

import { STEPS, type Step } from '@/lib/constants/steps';

export interface IPProgress {
  completed: number;
  total: 9;
  percentage: number;
  nextStep: Step | null;
  completedSteps: readonly string[];
  pendingSteps: readonly string[];
}

class IPProgressService {
  /** 计算单账号 9 步进度 */
  async progress(_accountId: number): Promise<IPProgress> {
    // TODO P1 · prisma.stepData.findMany({ where: { accountId: _accountId, status: 'completed' } })
    const completedKeys: string[] = [];

    const completed = STEPS.filter((s) => completedKeys.includes(s.key));
    const pending = STEPS.filter((s) => !completedKeys.includes(s.key));
    const nextStep = pending[0] ?? null;

    return {
      completed: completed.length,
      total: 9,
      percentage: Math.round((completed.length / 9) * 100),
      nextStep,
      completedSteps: completed.map((s) => s.key),
      pendingSteps: pending.map((s) => s.key),
    };
  }
}

export const ipProgressService = new IPProgressService();
