// PRD-13 US-002 · approvalGateService — dual-approval workflow
// AC-3/4/5/6/7: requestApproval / approveRequest / emergencyApprove / postReviewApprove / _approveRequestInTx
// SHIELD: requireDualApproval @default(false) → backward compat with PRD-10/11/12 stub single-approval
// SHIELD: secondApproverAdminId !== firstApproverAdminId enforced in dual path
// SHIELD: emergencyMode requires super_admin + emergencyIncidentId (D-095)
// SHIELD: postReview reviewer !== firstApprover (D-095)
import { randomBytes } from 'node:crypto';

import { TRPCError } from '@trpc/server';

import { logAdminAction } from '@/services/admin/admin-audit-service';
import { prisma } from '@/lib/prisma';

import type { Prisma, ApprovalRequest } from '@prisma/client';

// D-094 dual-approval actionType清单
export type ApprovalActionType =
  // dual-approval required
  | 'force_rebuild_evolution'
  | 'publish_prompt'
  | 'rollback_prompt'
  | 'adjust_quota'
  | 'whitelist_user'
  | 'ban_uploader'
  | 'template_modify'
  | 'cross_account_batch'
  | 'start_ab_experiment'
  | 'promote_ab_experiment_winner'
  | 'publish_constant_version'
  | 'rollback_constant'
  | 'toggle_feature_flag'
  | 'update_system_config'
  // single-approval
  | 'evolution_anomaly_resolve'
  | 'quota_adjust_small'
  | 'prompt_canary_adjust';

const DUAL_APPROVAL_ACTION_TYPES = new Set<ApprovalActionType>([
  'force_rebuild_evolution',
  'publish_prompt',
  'rollback_prompt',
  'adjust_quota',
  'whitelist_user',
  'ban_uploader',
  'template_modify',
  'cross_account_batch',
  'start_ab_experiment',
  'promote_ab_experiment_winner',
  'publish_constant_version',
  'rollback_constant',
  'toggle_feature_flag',
  'update_system_config',
]);

export function requiresDualApproval(actionType: ApprovalActionType): boolean {
  return DUAL_APPROVAL_ACTION_TYPES.has(actionType);
}

// ---------------------------------------------------------------------------
// requestApproval — create a new approval request record
// ---------------------------------------------------------------------------

export interface RequestApprovalParams {
  actionType: ApprovalActionType;
  requesterAdminId: number;
  requesterRole: 'admin' | 'super_admin' | 'system';
  actionPayload: Prisma.InputJsonValue;
  riskLevel: 'low' | 'medium' | 'high';
  requireDualApproval?: boolean;
  emergencyMode?: boolean;
  emergencyIncidentId?: string;
  requesterReason?: string;
  expiresInMs?: number;
}

export async function requestApproval(params: RequestApprovalParams): Promise<ApprovalRequest> {
  const {
    actionType,
    requesterAdminId,
    requesterRole,
    actionPayload,
    riskLevel,
    emergencyMode = false,
    emergencyIncidentId,
    requesterReason = '',
    expiresInMs = 24 * 60 * 60 * 1000,
  } = params;

  // emergencyMode requires emergencyIncidentId (D-095)
  if (emergencyMode && !emergencyIncidentId) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'emergencyIncidentId is required when emergencyMode=true',
    });
  }

  // derive requireDualApproval from actionType if not explicit
  const isDual = params.requireDualApproval ?? requiresDualApproval(actionType);

  const expiresAt = new Date(Date.now() + expiresInMs);

  return prisma.approvalRequest.create({
    data: {
      requesterAdminId,
      requesterRole,
      actionType,
      actionPayload,
      riskLevel,
      requireDualApproval: isDual,
      emergencyMode,
      emergencyIncidentId: emergencyMode ? emergencyIncidentId : null,
      postReviewRequired: false,
      requesterReason,
      status: 'pending',
      expiresAt,
    },
  });
}

// ---------------------------------------------------------------------------
// _approveRequestInTx — single-point transactional approve helper (P-6 抽象)
// 7 call sites: approveRequest ×2 / emergencyApprove / postReviewApprove /
//               violation-detection (system auto) / 5-subdomain tRPC (US-004~011)
// ---------------------------------------------------------------------------

export async function _approveRequestInTx(
  tx: Prisma.TransactionClient,
  requestId: number,
  approverAdminId: number,
  isSecondApproval: boolean,
): Promise<ApprovalRequest> {
  const now = new Date();

  if (isSecondApproval) {
    return (tx as typeof prisma).approvalRequest.update({
      where: { id: requestId },
      data: {
        status: 'approved',
        secondApproverAdminId: approverAdminId,
        secondApprovedAt: now,
      },
    });
  }

  return (tx as typeof prisma).approvalRequest.update({
    where: { id: requestId },
    data: {
      status: 'approved',
      approverAdminId,
      decidedAt: now,
    },
  });
}

// ---------------------------------------------------------------------------
// approveRequest — handles single-person and dual-approval logic
// ---------------------------------------------------------------------------

export async function approveRequest(
  approverAdminId: number,
  requestId: number,
  traceId?: string,
): Promise<ApprovalRequest> {
  const trace = traceId ?? randomBytes(8).toString('hex');

  const req = await prisma.approvalRequest.findUniqueOrThrow({ where: { id: requestId } });

  if (req.status !== 'pending') {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `approval_request ${requestId} status is '${req.status}', expected 'pending'`,
    });
  }

  // Single-approval path
  if (!req.requireDualApproval) {
    return prisma.$transaction(async (tx) => {
      return _approveRequestInTx(tx, requestId, approverAdminId, false);
    });
  }

  // Dual-approval path — first approval: approverAdminId not yet set
  if (req.approverAdminId === null) {
    return prisma.approvalRequest.update({
      where: { id: requestId },
      data: {
        approverAdminId,
        decidedAt: new Date(),
        // status stays 'pending' awaiting second approver
      },
    });
  }

  // Dual-approval path — second approval
  if (approverAdminId === req.approverAdminId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'FORBIDDEN_SAME_APPROVER: second approver must differ from first approver',
    });
  }

  const result = await prisma.$transaction(async (tx) => {
    return _approveRequestInTx(tx, requestId, approverAdminId, true);
  });

  await logAdminAction({
    actorAdminId: approverAdminId,
    actorRole: 'admin',
    eventCategory: 'approval',
    eventType: 'dual_approval_completed',
    payload: {
      requestId,
      actionType: req.actionType,
      firstApproverAdminId: req.approverAdminId,
      secondApproverAdminId: approverAdminId,
    },
    traceId: trace,
    ip: '0.0.0.0',
    userAgent: 'approval-service',
    sessionId: 'system',
    success: true,
  }).catch(() => {
    // audit log failure never blocks main flow
  });

  return result;
}

// ---------------------------------------------------------------------------
// emergencyApprove — super_admin only · immediate approve + postReviewRequired=true
// ---------------------------------------------------------------------------

export async function emergencyApprove(
  requestId: number,
  superAdminId: number,
  incidentId: string,
  superAdminRole: string = 'super_admin',
  traceId?: string,
): Promise<ApprovalRequest> {
  const trace = traceId ?? randomBytes(8).toString('hex');

  if (superAdminRole !== 'super_admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'FORBIDDEN_EMERGENCY_NOT_SUPER_ADMIN',
    });
  }

  const req = await prisma.approvalRequest.findUniqueOrThrow({ where: { id: requestId } });

  if (req.status !== 'pending') {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `approval_request ${requestId} status is '${req.status}', expected 'pending'`,
    });
  }

  const now = new Date();

  const updated = await prisma.$transaction(async (tx) => {
    await (tx as typeof prisma).approvalRequest.update({
      where: { id: requestId },
      data: {
        emergencyMode: true,
        emergencyIncidentId: incidentId,
        postReviewRequired: true,
        approverAdminId: superAdminId,
        decidedAt: now,
      },
    });
    return _approveRequestInTx(tx, requestId, superAdminId, false);
  });

  // AC-5: write emergency_approval audit log with incident_id (security_alert category)
  await logAdminAction({
    actorAdminId: superAdminId,
    actorRole: 'super_admin',
    eventCategory: 'security_alert',
    eventType: 'emergency_approval',
    payload: {
      requestId,
      actionType: req.actionType,
      incident_id: incidentId,
      postReviewRequired: true,
    },
    traceId: trace,
    ip: '0.0.0.0',
    userAgent: 'approval-service',
    sessionId: 'system',
    success: true,
  }).catch(() => {});

  return updated;
}

// ---------------------------------------------------------------------------
// postReviewApprove — 24h post-review for emergency approvals
// ---------------------------------------------------------------------------

export async function postReviewApprove(
  requestId: number,
  reviewerAdminId: number,
  result: 'confirmed' | 'overturned' | 'partial',
  traceId?: string,
): Promise<ApprovalRequest> {
  const trace = traceId ?? randomBytes(8).toString('hex');

  const req = await prisma.approvalRequest.findUniqueOrThrow({ where: { id: requestId } });

  if (!req.postReviewRequired) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `approval_request ${requestId} does not require post-review`,
    });
  }

  if (req.postReviewedAt !== null) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `approval_request ${requestId} has already been post-reviewed`,
    });
  }

  // post-reviewer must differ from first approver (D-095)
  if (reviewerAdminId === req.approverAdminId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'FORBIDDEN_SAME_APPROVER: post-reviewer must differ from the original approver',
    });
  }

  const now = new Date();

  const updated = await prisma.approvalRequest.update({
    where: { id: requestId },
    data: {
      postReviewerAdminId: reviewerAdminId,
      postReviewResult: result,
      postReviewedAt: now,
    },
  });

  await logAdminAction({
    actorAdminId: reviewerAdminId,
    actorRole: 'admin',
    eventCategory: 'approval',
    eventType: 'post_review_completed',
    payload: {
      requestId,
      result,
      actionType: req.actionType,
    },
    traceId: trace,
    ip: '0.0.0.0',
    userAgent: 'approval-service',
    sessionId: 'system',
    success: true,
  }).catch(() => {});

  return updated;
}
