// PRD-14 US-006 · constant-version.service.ts
// AC-4/5/6/7/8: _publishConstantVersionInTx single-point + publishConstantVersion/rollbackConstant/updateCanaryConfig/getActiveConstantVersion
// US-007 AC-4: _publishConstantVersionInTx triggers BullMQ +5s delayed embed job post-publish
// US-007 AC-5: publishConstantVersion auto-evaluates judgeScore if null (isMock=true)
// SHIELD: 1:1 fork prompt-version.service.ts · 5 changes only
// SHIELD: _publishConstantVersionInTx must receive tx · never create its own $transaction
// SHIELD: canary hash must be deterministic (userId:constantType:constantKey md5) · never random()
// LD-A10: the ONLY place that sets constant_versions.status='active'
import { createHash } from 'node:crypto';

import { TRPCError } from '@trpc/server';

import { prisma } from '@/lib/prisma';
import { requestApproval } from '@/services/admin/approval/approvalGateService';
import { evaluateConstantVersion } from '@/services/admin/constant-version/llm-judge-constant.service';
import { scheduleConstantEmbedRebuild } from '@/jobs/admin/constant-embed-rebuild.job';

import type { Prisma, ConstantVersion } from '@prisma/client';

// D-091: minimum judgeScore for publish
const MIN_JUDGE_SCORE = 4.0;

// D-090: valid canary percentages
const VALID_CANARY_PCT = new Set([0, 1, 10, 50, 100]);

// ---------------------------------------------------------------------------
// AC-4: _publishConstantVersionInTx — single-point function · publish/rollback/canary
// LD-A10: the ONLY place that sets constant_versions.status='active'
// ---------------------------------------------------------------------------

export async function _publishConstantVersionInTx(
  tx: Prisma.TransactionClient,
  params: { versionId: number; adminId: number; approvalRequestId: number },
): Promise<void> {
  const { versionId, adminId } = params;

  const version = await (tx as typeof prisma).constantVersion.findUniqueOrThrow({
    where: { id: versionId },
  });

  if (version.status !== 'pending_review') {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Version ${versionId} status is '${version.status}', expected 'pending_review'`,
    });
  }

  if (version.judgeScore === null || Number(version.judgeScore) < MIN_JUDGE_SCORE) {
    const score = version.judgeScore !== null ? String(version.judgeScore) : 'null';
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `judgeScore ${score} does not meet minimum threshold ${MIN_JUDGE_SCORE} (D-091)`,
    });
  }

  // Archive all currently active versions for this constantType+constantKey
  await (tx as typeof prisma).constantVersion.updateMany({
    where: {
      constantType: version.constantType,
      constantKey: version.constantKey,
      status: 'active',
      id: { not: versionId },
    },
    data: { status: 'archived' },
  });

  // Set this version as active (LD-A10: only place)
  await (tx as typeof prisma).constantVersion.update({
    where: { id: versionId },
    data: {
      status: 'active',
      approvedByAdminId: adminId,
      approvedAt: new Date(),
    },
  });

  // Upsert canary config: reset to 100% current, clear canary
  const existing = await (tx as typeof prisma).constantCanaryConfig.findUnique({
    where: {
      constantType_constantKey: { constantType: version.constantType, constantKey: version.constantKey },
    },
  });

  if (existing) {
    await (tx as typeof prisma).constantCanaryConfig.update({
      where: { id: existing.id },
      data: {
        currentVersionId: versionId,
        nextVersionId: null,
        canaryPct: 0,
        updatedByAdminId: adminId,
        updatedAt: new Date(),
      },
    });
  } else {
    await (tx as typeof prisma).constantCanaryConfig.create({
      data: {
        constantType: version.constantType,
        constantKey: version.constantKey,
        currentVersionId: versionId,
        canaryPct: 0,
        strategy: 'user_id_hash',
        updatedByAdminId: adminId,
      },
    });
  }

  // AC-4: fire-and-forget BullMQ +5s delayed embed job after publish
  // 5s delay ensures tx commits before worker runs
  void scheduleConstantEmbedRebuild(
    versionId,
    version.constantType,
    version.constantKey,
    version.content,
  ).catch(() => void 0);
}

// ---------------------------------------------------------------------------
// AC-5: publishConstantVersion — validate + request dual approval
// ---------------------------------------------------------------------------

export async function publishConstantVersion(
  versionId: number,
  adminId: number,
): Promise<number> {
  let version = await prisma.constantVersion.findUniqueOrThrow({ where: { id: versionId } });

  if (version.status !== 'pending_review') {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Version ${versionId} status is '${version.status}', expected 'pending_review'`,
    });
  }

  // AC-5: auto-evaluate judgeScore if null (isMock=true · D-077 stub)
  if (version.judgeScore === null) {
    await evaluateConstantVersion(versionId, true);
    version = await prisma.constantVersion.findUniqueOrThrow({ where: { id: versionId } });
  }

  if (version.judgeScore === null || Number(version.judgeScore) < MIN_JUDGE_SCORE) {
    const score = version.judgeScore !== null ? String(version.judgeScore) : 'null';
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `judgeScore ${score} does not meet minimum threshold ${MIN_JUDGE_SCORE} (D-091)`,
    });
  }

  // AC-6: must go through requestApproval with requireDualApproval=true · no bypass
  const approval = await requestApproval({
    actionType: 'publish_constant_version',
    requesterAdminId: adminId,
    requesterRole: 'admin',
    actionPayload: {
      versionId,
      constantType: version.constantType,
      constantKey: version.constantKey,
      version: version.version,
    },
    riskLevel: 'high',
    requireDualApproval: true,
  });

  return approval.id;
}

// ---------------------------------------------------------------------------
// AC-6: rollbackConstant — request dual approval; execute after approval
// ---------------------------------------------------------------------------

export async function rollbackConstant(
  constantType: string,
  constantKey: string,
  adminId: number,
): Promise<number> {
  // AC-6: must go through requestApproval with requireDualApproval=true
  const approval = await requestApproval({
    actionType: 'rollback_constant',
    requesterAdminId: adminId,
    requesterRole: 'admin',
    actionPayload: { constantType, constantKey },
    riskLevel: 'high',
    requireDualApproval: true,
  });

  return approval.id;
}

export async function executeConstantRollback(
  constantType: string,
  constantKey: string,
  adminId: number,
  approvalRequestId: number,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const current = await (tx as typeof prisma).constantVersion.findFirst({
      where: { constantType, constantKey, status: 'active' },
    });

    if (!current) {
      throw new TRPCError({ code: 'NOT_FOUND', message: `No active version for ${constantType}:${constantKey}` });
    }

    // Archive current
    await (tx as typeof prisma).constantVersion.update({
      where: { id: current.id },
      data: { status: 'archived' },
    });

    // Find previous archived version (按 version DESC 第一个)
    const prev = await (tx as typeof prisma).constantVersion.findFirst({
      where: { constantType, constantKey, status: 'archived', id: { not: current.id } },
      orderBy: { version: 'desc' },
    });

    if (!prev) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `No previous archived version for ${constantType}:${constantKey} to restore`,
      });
    }

    await _publishConstantVersionInTx(tx, { versionId: prev.id, adminId, approvalRequestId });
  });
}

// ---------------------------------------------------------------------------
// AC-7: updateCanaryConfig — validate pct enum; canaryPct=100 triggers publish
// ---------------------------------------------------------------------------

export async function updateConstantCanaryConfig(
  constantType: string,
  constantKey: string,
  nextVersionId: number,
  canaryPct: number,
  adminId: number,
): Promise<void> {
  if (!VALID_CANARY_PCT.has(canaryPct)) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `canaryPct must be one of: 0, 1, 10, 50, 100. Got: ${canaryPct}`,
    });
  }

  // canaryPct=100 triggers full publish via approval flow
  if (canaryPct === 100) {
    await publishConstantVersion(nextVersionId, adminId);
    return;
  }

  // Upsert canary config
  const existing = await prisma.constantCanaryConfig.findUnique({
    where: { constantType_constantKey: { constantType, constantKey } },
  });

  if (existing) {
    await prisma.constantCanaryConfig.update({
      where: { id: existing.id },
      data: { nextVersionId, canaryPct, updatedByAdminId: adminId, updatedAt: new Date() },
    });
  } else {
    const active = await prisma.constantVersion.findFirst({
      where: { constantType, constantKey, status: 'active' },
    });
    if (!active) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `No active version found for ${constantType}:${constantKey}`,
      });
    }
    await prisma.constantCanaryConfig.create({
      data: {
        constantType,
        constantKey,
        currentVersionId: active.id,
        nextVersionId,
        canaryPct,
        strategy: 'user_id_hash',
        updatedByAdminId: adminId,
      },
    });
  }
}

// ---------------------------------------------------------------------------
// AC-8: getActiveConstantVersion — deterministic hash routing
// SHIELD: use parseInt(hashBucket, 16) % 100 · never Math.random()
// hash key: md5(${userId}:${constantType}:${constantKey})
// ---------------------------------------------------------------------------

export async function getActiveConstantVersion(
  constantType: string,
  constantKey: string,
  userId: number,
): Promise<Pick<ConstantVersion, 'id' | 'content' | 'constantType' | 'constantKey'> | null> {
  const config = await prisma.constantCanaryConfig.findUnique({
    where: { constantType_constantKey: { constantType, constantKey } },
    include: { currentVersion: true, nextVersion: true },
  });

  if (!config) return null;

  if (config.canaryPct > 0 && config.nextVersion !== null) {
    // D-090: deterministic hash — same userId × constantType × constantKey always routes the same way
    const hashBucket = createHash('md5')
      .update(`${userId}:${constantType}:${constantKey}`)
      .digest('hex')
      .slice(0, 8);
    const bucketPct = parseInt(hashBucket, 16) % 100;
    if (bucketPct < config.canaryPct) {
      return config.nextVersion;
    }
  }

  return config.currentVersion;
}
