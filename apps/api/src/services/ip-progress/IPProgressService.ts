/**
 * IPProgressService — 9 步 IP 起号进度计算
 * US-013: 替换 PRD-3 占位 · 真实查 stepData 表 status='completed'
 *
 * step2 永远不计入(spec §ⅩⅦ: 原版 404)
 * 索引: @@index([accountId, status]) 确保单查询 < 50ms
 */

import type { PrismaClient } from '@prisma/client';

export const STEP_KEYS_9 = [
  'step1',
  'step3',
  'step3b',
  'step4',
  'step4b',
  'step5',
  'step6',
  'step7',
  'step8',
] as const;

export type StepKey9 = (typeof STEP_KEYS_9)[number];

export interface IpProgressResult {
  completed: number;
  total: 9;
  completedSteps: StepKey9[];
}

/**
 * 计算单账号 9 步完成进度
 * 仅 status='completed' 行计入 · 忽略 in_progress/failed/fallback
 * 走 protectedProcedure 时 prisma 已是事务客户端(RLS 已激活) · 此处再加 accountId 做双保险
 */
export async function getProgress(
  prisma: PrismaClient,
  accountId: number,
): Promise<IpProgressResult> {
  const rows = await prisma.stepData.findMany({
    where: {
      accountId,
      stepKey: { in: [...STEP_KEYS_9] },
      status: 'completed',
    },
    select: { stepKey: true },
  });

  const completedSteps = rows.map((r) => r.stepKey as StepKey9);
  return { completed: completedSteps.length, total: 9, completedSteps };
}
