// PRD-14 US-001 · ab-experiment.service — A/B 实验 + 分组 + Dual Approval
// AC-3: _startAbExperimentInTx + _stopAbExperimentInTx 2 单点 + createAbExperiment + startAbExperiment + assignUserToVariant
// AC-4: _startAbExperimentInTx 接 tx · 不自起 $transaction
// AC-5: _stopAbExperimentInTx · status=stopped + stoppedAt + resultSummary + audit
// AC-6: assignUserToVariant deterministic md5 hash · upsert
// AC-7: startAbExperiment 强制 dual approval (start_ab_experiment)
// SHIELD: _startAbExperimentInTx 接 tx · 不自起 $transaction (ANTI-PATTERN)
// SHIELD: deterministic hash · 同 user × experiment 多次调返一致 variant (ANTI-PATTERN)
// SHIELD: assignUserToVariant upsert WHERE experimentId+userId (ANTI-PATTERN)
import { createHash, randomBytes } from 'node:crypto';

import { TRPCError } from '@trpc/server';

import { prisma } from '@/lib/prisma';
import { logAdminAction } from '@/services/admin/admin-audit-service';
import { requestApproval } from '@/services/admin/approval/approvalGateService';

import type { Prisma, AbExperiment, AbAssignment } from '@prisma/client';


// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AbExperimentStatus = 'draft' | 'running' | 'stopped' | 'completed';
export type AbVariant = 'control' | 'variant_a' | 'variant_b';

export interface TrafficAllocation {
  control: number;
  variant_a: number;
  variant_b: number;
}

export interface StartAbExperimentTxParams {
  experimentId: number;
  adminId: number;
  approvalRequestId: number;
}

export interface StopAbExperimentTxParams {
  experimentId: number;
  adminId: number;
  stopReason: string;
  resultSummary?: Record<string, unknown>;
}

export interface CreateAbExperimentParams {
  experimentKey: string;
  name: string;
  description?: string;
  variantConfig: Record<string, unknown>;
  trafficAllocation: TrafficAllocation;
  createdByAdminId: number;
}

export interface StartAbExperimentParams {
  experimentId: number;
  requesterAdminId: number;
  requesterRole: 'admin' | 'super_admin';
  requesterReason?: string;
}

export interface StartAbExperimentResult {
  approvalRequestId: number;
  needsApproval: true;
}

// ---------------------------------------------------------------------------
// _startAbExperimentInTx — single-point start (accepts tx · never self-starts)
// ---------------------------------------------------------------------------

export async function _startAbExperimentInTx(
  tx: Prisma.TransactionClient,
  params: StartAbExperimentTxParams,
): Promise<AbExperiment> {
  const { experimentId, adminId, approvalRequestId } = params;

  const experiment = await (tx as typeof prisma).abExperiment.findUnique({
    where: { id: experimentId },
  });

  if (!experiment) {
    throw new TRPCError({ code: 'NOT_FOUND', message: `ab_experiment id=${experimentId} not found` });
  }

  if (experiment.status !== 'draft') {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `ab_experiment id=${experimentId} status='${experiment.status}', expected 'draft'`,
    });
  }

  const now = new Date();

  const updated = await (tx as typeof prisma).abExperiment.update({
    where: { id: experimentId },
    data: { status: 'running', startedAt: now },
  });

  const traceId = randomBytes(8).toString('hex');
  await logAdminAction({
    actorAdminId: adminId,
    actorRole: 'admin',
    eventCategory: 'high_risk_action',
    eventType: 'ab_experiment_start',
    payload: { experimentId, experimentKey: experiment.experimentKey, approvalRequestId },
    traceId,
    ip: 'system',
    userAgent: 'ab-experiment-service',
    sessionId: 'system',
    success: true,
    approvalRequestId,
  });

  return updated;
}

// ---------------------------------------------------------------------------
// _stopAbExperimentInTx — single-point stop (accepts tx · never self-starts)
// ---------------------------------------------------------------------------

export async function _stopAbExperimentInTx(
  tx: Prisma.TransactionClient,
  params: StopAbExperimentTxParams,
): Promise<AbExperiment> {
  const { experimentId, adminId, stopReason, resultSummary } = params;

  const experiment = await (tx as typeof prisma).abExperiment.findUnique({
    where: { id: experimentId },
  });

  if (!experiment) {
    throw new TRPCError({ code: 'NOT_FOUND', message: `ab_experiment id=${experimentId} not found` });
  }

  if (experiment.status !== 'running') {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `ab_experiment id=${experimentId} status='${experiment.status}', expected 'running'`,
    });
  }

  const now = new Date();

  const updated = await (tx as typeof prisma).abExperiment.update({
    where: { id: experimentId },
    data: {
      status: 'stopped',
      stoppedAt: now,
      resultSummary: (resultSummary ?? {}) as Prisma.InputJsonValue,
    },
  });

  const traceId = randomBytes(8).toString('hex');
  await logAdminAction({
    actorAdminId: adminId,
    actorRole: 'admin',
    eventCategory: 'high_risk_action',
    eventType: 'ab_experiment_stop',
    payload: {
      experimentId,
      experimentKey: experiment.experimentKey,
      stopReason,
      resultSummary: resultSummary ?? {},
    },
    traceId,
    ip: 'system',
    userAgent: 'ab-experiment-service',
    sessionId: 'system',
    success: true,
  });

  return updated;
}

// ---------------------------------------------------------------------------
// createAbExperiment — create new draft experiment
// ---------------------------------------------------------------------------

export async function createAbExperiment(params: CreateAbExperimentParams): Promise<AbExperiment> {
  const { experimentKey, name, description, variantConfig, trafficAllocation, createdByAdminId } =
    params;

  const total = trafficAllocation.control + trafficAllocation.variant_a + trafficAllocation.variant_b;
  if (total !== 100) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `trafficAllocation must sum to 100, got ${total}`,
    });
  }

  return prisma.abExperiment.create({
    data: {
      experimentKey,
      name,
      description,
      variantConfig: variantConfig as Prisma.InputJsonValue,
      trafficAllocation: trafficAllocation as unknown as Prisma.InputJsonValue,
      status: 'draft',
      createdByAdminId,
    },
  });
}

// ---------------------------------------------------------------------------
// startAbExperiment — always routes through dual approval
// ---------------------------------------------------------------------------

export async function startAbExperiment(
  params: StartAbExperimentParams,
): Promise<StartAbExperimentResult> {
  const { experimentId, requesterAdminId, requesterRole, requesterReason = '' } = params;

  // Verify experiment exists before creating approval request
  const experiment = await prisma.abExperiment.findUnique({ where: { id: experimentId } });
  if (!experiment) {
    throw new TRPCError({ code: 'NOT_FOUND', message: `ab_experiment id=${experimentId} not found` });
  }

  // AC-7: always dual approval — never bypass
  const approval = await requestApproval({
    actionType: 'start_ab_experiment',
    requesterAdminId,
    requesterRole,
    actionPayload: {
      experimentId,
      experimentKey: experiment.experimentKey,
    } as Prisma.InputJsonValue,
    riskLevel: 'high',
    requireDualApproval: true,
    requesterReason,
  });

  return { approvalRequestId: approval.id, needsApproval: true };
}

// ---------------------------------------------------------------------------
// assignUserToVariant — deterministic hash · upsert
// AC-6: md5(userId:experimentKey).slice(0,8) % 100 → variant by trafficAllocation
// ---------------------------------------------------------------------------

export async function assignUserToVariant(
  experimentId: number,
  userId: number,
): Promise<AbAssignment> {
  const experiment = await prisma.abExperiment.findUnique({ where: { id: experimentId } });
  if (!experiment) {
    throw new TRPCError({ code: 'NOT_FOUND', message: `ab_experiment id=${experimentId} not found` });
  }

  if (experiment.status !== 'running') {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `ab_experiment id=${experimentId} is not running (status='${experiment.status}')`,
    });
  }

  const alloc = experiment.trafficAllocation as unknown as TrafficAllocation;

  // Deterministic hash: md5(userId:experimentKey).slice(0,8) % 100
  const hashHex = createHash('md5')
    .update(`${userId}:${experiment.experimentKey}`)
    .digest('hex')
    .slice(0, 8);
  const bucket = parseInt(hashHex, 16) % 100;

  // Accumulate thresholds from trafficAllocation
  const controlMax = alloc.control; // 0..control
  const variantAMax = alloc.control + alloc.variant_a; // control..control+variant_a

  let variant: AbVariant;
  if (bucket < controlMax) {
    variant = 'control';
  } else if (bucket < variantAMax) {
    variant = 'variant_a';
  } else {
    variant = 'variant_b';
  }

  // Upsert: same user × experiment → always returns same variant
  return prisma.abAssignment.upsert({
    where: { experimentId_userId: { experimentId, userId } },
    create: { experimentId, userId, variant },
    update: {}, // never overwrite existing assignment
  });
}
