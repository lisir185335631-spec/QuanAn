/**
 * QuanAn · IPProgressService · 软 Supervisor(确定性服务 · 无 LLM)
 * 派生自 ARCHITECTURE.md §4.6 + ADR-004
 *
 * 跟踪 9 步进度 · 服务 /ip-plan · /daily-tasks · /evolution
 */

import { STEPS, type Step } from '@/lib/constants/steps';
import { prisma } from '@/lib/prisma';

export interface IPProgress {
  completed: number;
  total: 9;
  percentage: number;
  nextStep: Step | null;
  completedSteps: readonly string[];
  pendingSteps: readonly string[];
}

class IPProgressService {
  /** 计算单账号 9 步进度 · 读 stepData 表; P1 将加权计算部分完成状态 */
  async progress(accountId: number): Promise<IPProgress> {
    const rows = await prisma.stepData.findMany({
      where: { accountId },
      select: { stepKey: true },
    });

    const completedSet = new Set(rows.map((r) => r.stepKey));
    const completed = STEPS.filter((s) => completedSet.has(s.key));
    const pending = STEPS.filter((s) => !completedSet.has(s.key));
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
