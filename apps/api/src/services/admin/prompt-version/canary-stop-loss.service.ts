// PRD-13 US-003 · canary-stop-loss.service.ts
// G12: canary 自动止损 — 错误率劣化检测 + 自动回滚到 stable
//
// AC-1: detectCanaryDegradation — 查所有 active canary(canaryPct>0)
// AC-2: 错误率 = count(success=false)/count(*) 最近窗口(env 可配)
// AC-3: 触发条件 dual-guard: errorRate > CANARY_ERROR_THRESHOLD AND sampleSize >= MIN_SAMPLES
// AC-4: 样本不足(<MIN_SAMPLES) → 不判定,返回健康
// AC-5: executeAutoRollback — 回退到 currentVersionId(stable) · 绕 dual approval
// AC-6: 写审计日志 eventType='canary_auto_rollback_stop_loss' eventCategory='security_alert'
// AC-7: dingtalk 告警(isMock=true by default)
// AC-8: dedupe per (specialistId,mode) per hour via adminAuditLog.findFirst
//
// SHIELD: 自动路径只 rollback 到 currentVersion(stable),绝不 promote nextVersion
// SHIELD: 样本守护 MIN_SAMPLES 防小样本误触
// SHIELD: actorAdminId=0 system actor,手工 dual approval 路径不动

import { createHash, randomBytes } from 'node:crypto';

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { DingtalkService } from '@/services/admin/notifications/dingtalk.service';
import { _publishPromptVersionInTx } from './prompt-version.service';

// ---------------------------------------------------------------------------
// 环境变量可配常量
// ---------------------------------------------------------------------------

/** 错误率阈值,超过则判定劣化。默认 0.15(15%) */
export const CANARY_ERROR_THRESHOLD =
  parseFloat(process.env.LLM_CANARY_ERROR_THRESHOLD ?? '0.15');

/** 最小样本数,低于此数不判定(防小样本误触)。默认 20 */
export const MIN_SAMPLES = parseInt(process.env.LLM_CANARY_MIN_SAMPLES ?? '20', 10);

/** 查询窗口分钟数。默认 60 分钟 */
export const CANARY_WINDOW_MINUTES = parseInt(process.env.LLM_CANARY_WINDOW_MINUTES ?? '60', 10);

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

export interface CanaryDegradation {
  specialistId: string;
  mode: string;
  errorRate: number;
  sampleSize: number;
  canaryPct: number;
  currentVersionId: number;
}

export interface DetectCanaryResult {
  degraded: CanaryDegradation[];
  healthy: number;
  skipped: number;
}

export interface CanaryStopLossResult {
  rolledBack: number;
  skipped: number;
}

// ---------------------------------------------------------------------------
// AC-1~4: detectCanaryDegradation
// ---------------------------------------------------------------------------

export async function detectCanaryDegradation(): Promise<DetectCanaryResult> {
  // AC-1: 查所有 active canary(canaryPct > 0)
  const activeCanaries = await prisma.promptCanaryConfig.findMany({
    where: { canaryPct: { gt: 0 } },
    select: {
      specialistId: true,
      mode: true,
      canaryPct: true,
      currentVersionId: true,
    },
  });

  const windowStart = new Date(Date.now() - CANARY_WINDOW_MINUTES * 60 * 1000);

  const degraded: CanaryDegradation[] = [];
  let healthy = 0;
  let skipped = 0;

  for (const canary of activeCanaries) {
    // AC-2: 按 agentId=specialistId + agentMode=mode 查 cost_log 错误率
    const [total, failures] = await Promise.all([
      prisma.costLog.count({
        where: {
          agentId: canary.specialistId,
          agentMode: canary.mode,
          createdAt: { gte: windowStart },
        },
      }),
      prisma.costLog.count({
        where: {
          agentId: canary.specialistId,
          agentMode: canary.mode,
          success: false,
          createdAt: { gte: windowStart },
        },
      }),
    ]);

    const sampleSize = total;

    // AC-4: 样本不足 → 不判定(skipped)
    if (sampleSize < MIN_SAMPLES) {
      skipped++;
      logger.debug(
        { specialistId: canary.specialistId, mode: canary.mode, sampleSize, MIN_SAMPLES },
        'canary_stop_loss.sample_too_small.skipped',
      );
      continue;
    }

    const errorRate = sampleSize > 0 ? failures / sampleSize : 0;

    // AC-3: dual-guard 触发条件
    if (errorRate > CANARY_ERROR_THRESHOLD) {
      degraded.push({
        specialistId: canary.specialistId,
        mode: canary.mode,
        errorRate,
        sampleSize,
        canaryPct: canary.canaryPct,
        currentVersionId: canary.currentVersionId,
      });
      logger.warn(
        { specialistId: canary.specialistId, mode: canary.mode, errorRate, sampleSize },
        'canary_stop_loss.degradation_detected',
      );
    } else {
      healthy++;
    }
  }

  return { degraded, healthy, skipped };
}

// ---------------------------------------------------------------------------
// AC-5~8: executeAutoRollback — 自动回滚到 stable(currentVersionId)
// SHIELD: 只回退到 stable,不 promote nextVersion
// SHIELD: 绕 dual approval 仅限此安全回退路径
// ---------------------------------------------------------------------------

export async function executeAutoRollback(
  degradation: CanaryDegradation,
  dingtalk: DingtalkService = new DingtalkService(),
): Promise<void> {
  const { specialistId, mode, errorRate, sampleSize, currentVersionId } = degradation;

  // AC-8: dedupe per (specialistId,mode) per hour
  // fix: 同时过滤 specialistId + mode，防止同 specialist 不同 mode 互相误 dedupe
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const existing = await prisma.adminAuditLog.findFirst({
    where: {
      eventType: 'canary_auto_rollback_stop_loss',
      createdAt: { gte: oneHourAgo },
      AND: [
        { payload: { path: ['specialistId'], equals: specialistId } },
        { payload: { path: ['mode'], equals: mode } },
      ],
    },
    select: { id: true },
  });

  if (existing) {
    logger.debug({ specialistId, mode }, 'canary_stop_loss.rollback_deduped');
    return;
  }

  // AC-5: 自动回滚到 currentVersionId(stable) 内部事务
  // SHIELD: 使用 _publishPromptVersionInTx 单入口,确保回退到 stable,非 promote
  await prisma.$transaction(async (tx) => {
    // 清除 canary:把 canaryPct 归零 + nextVersionId 清空
    await (tx as typeof prisma).promptCanaryConfig.update({
      where: { specialistId_mode: { specialistId, mode } },
      data: {
        canaryPct: 0,
        nextVersionId: null,
        updatedByAdminId: 0,
        updatedAt: new Date(),
      },
    });

    // SHIELD: 重新激活 currentVersionId(stable) — 安全方向,只回退
    await _publishPromptVersionInTx(tx, {
      versionId: currentVersionId,
      adminId: 0,
      approvalRequestId: 0, // system auto path — 0 占位,不走 approval 表
    });
  });

  // AC-6: 写审计日志
  const traceId = randomBytes(8).toString('hex');
  const reasoning = {
    specialistId,
    mode,
    errorRate,
    sampleSize,
    currentVersionId,
    windowMinutes: CANARY_WINDOW_MINUTES,
    threshold: CANARY_ERROR_THRESHOLD,
    minSamples: MIN_SAMPLES,
    actionType: 'auto_rollback_stoploss',
  };
  const payloadHash = createHash('sha256').update(JSON.stringify(reasoning)).digest('hex');

  await prisma.adminAuditLog.create({
    data: {
      actorAdminId: 0,
      actorRole: 'system',
      eventCategory: 'security_alert',
      eventType: 'canary_auto_rollback_stop_loss',
      payload: reasoning as unknown as import('@prisma/client').Prisma.InputJsonValue,
      payloadHash,
      traceId,
      ip: '127.0.0.1',
      userAgent: 'canary-stop-loss-worker',
      sessionId: 'system',
      success: true,
    },
  });

  // AC-7: dingtalk 告警
  await dingtalk.send(
    `[Canary 自动止损] ${specialistId}/${mode} 错误率 ${(errorRate * 100).toFixed(1)}% ` +
    `(样本=${sampleSize},阈值=${(CANARY_ERROR_THRESHOLD * 100).toFixed(0)}%) ` +
    `已自动回滚至 stable 版本(versionId=${currentVersionId})。`,
  );

  logger.warn(
    { specialistId, mode, errorRate, sampleSize, currentVersionId },
    'canary_stop_loss.auto_rollback_executed',
  );
}

// ---------------------------------------------------------------------------
// 主入口:detectCanaryDegradation → executeAutoRollback(for each degraded)
// ---------------------------------------------------------------------------

export async function runCanaryStopLoss(
  dingtalk: DingtalkService = new DingtalkService(),
): Promise<CanaryStopLossResult> {
  const { degraded, healthy, skipped } = await detectCanaryDegradation();

  logger.info(
    { degradedCount: degraded.length, healthy, skipped },
    'canary_stop_loss.scan_complete',
  );

  let rolledBack = 0;

  for (const d of degraded) {
    await executeAutoRollback(d, dingtalk);
    rolledBack++;
  }

  return { rolledBack, skipped };
}
