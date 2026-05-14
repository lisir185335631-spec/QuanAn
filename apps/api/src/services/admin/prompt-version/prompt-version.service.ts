// PRD-13 US-003 · prompt-version.service.ts
// AC-4/5/6/7/8/11: _publishPromptVersionInTx single-point + publish/rollback/canary/getActive
// SHIELD: _publishPromptVersionInTx must receive tx · never create its own $transaction
// SHIELD: canary hash must be deterministic (userId:specialistId md5) · never random()
// SHIELD: ContextAssembler fallback to templates/*.ts when getActivePromptVersion returns null
import { createHash } from 'node:crypto';

import { TRPCError } from '@trpc/server';

import { prisma } from '@/lib/prisma';
import { requestApproval } from '@/services/admin/approval/approvalGateService';

import type { Prisma, PromptVersion } from '@prisma/client';

// D-091: minimum judgeScore for publish
const MIN_JUDGE_SCORE = 4.0;

// D-090: valid canary percentages
const VALID_CANARY_PCT = new Set([0, 1, 10, 50, 100]);

// ---------------------------------------------------------------------------
// AC-4: _publishPromptVersionInTx — single-point function · publish/rollback/canary
// LD-A-6: the ONLY place that sets prompt_versions.status='active'
// ---------------------------------------------------------------------------

export async function _publishPromptVersionInTx(
  tx: Prisma.TransactionClient,
  params: { versionId: number; adminId: number; approvalRequestId: number },
): Promise<void> {
  const { versionId, adminId } = params;

  const version = await (tx as typeof prisma).promptVersion.findUniqueOrThrow({
    where: { id: versionId },
  });

  // Archive all currently active versions for this specialist+mode
  await (tx as typeof prisma).promptVersion.updateMany({
    where: {
      specialistId: version.specialistId,
      mode: version.mode,
      status: 'active',
      id: { not: versionId },
    },
    data: { status: 'archived' },
  });

  // Set this version as active (LD-A-6: only place)
  await (tx as typeof prisma).promptVersion.update({
    where: { id: versionId },
    data: {
      status: 'active',
      approvedByAdminId: adminId,
      approvedAt: new Date(),
    },
  });

  // Upsert canary config: reset to 100% current, clear canary
  const existing = await (tx as typeof prisma).promptCanaryConfig.findUnique({
    where: {
      specialistId_mode: { specialistId: version.specialistId, mode: version.mode },
    },
  });

  if (existing) {
    await (tx as typeof prisma).promptCanaryConfig.update({
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
    await (tx as typeof prisma).promptCanaryConfig.create({
      data: {
        specialistId: version.specialistId,
        mode: version.mode,
        currentVersionId: versionId,
        canaryPct: 0,
        strategy: 'user_id_hash',
        updatedByAdminId: adminId,
      },
    });
  }
}

// ---------------------------------------------------------------------------
// AC-5: publishPromptVersion — validate + request dual approval
// ---------------------------------------------------------------------------

export async function publishPromptVersion(
  versionId: number,
  adminId: number,
): Promise<number> {
  const version = await prisma.promptVersion.findUniqueOrThrow({ where: { id: versionId } });

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

  // AC-11: must go through requestApproval with requireDualApproval=true · no bypass
  const approval = await requestApproval({
    actionType: 'publish_prompt',
    requesterAdminId: adminId,
    requesterRole: 'admin',
    actionPayload: {
      versionId,
      specialistId: version.specialistId,
      mode: version.mode,
      version: version.version,
    },
    riskLevel: 'high',
    requireDualApproval: true,
  });

  return approval.id;
}

// ---------------------------------------------------------------------------
// AC-6: rollbackPrompt — request dual approval; execute after approval
// ---------------------------------------------------------------------------

export async function rollbackPrompt(
  specialistId: string,
  mode: string,
  adminId: number,
): Promise<number> {
  // AC-11: must go through requestApproval with requireDualApproval=true
  const approval = await requestApproval({
    actionType: 'rollback_prompt',
    requesterAdminId: adminId,
    requesterRole: 'admin',
    actionPayload: { specialistId, mode },
    riskLevel: 'high',
    requireDualApproval: true,
  });

  return approval.id;
}

export async function executeRollback(
  specialistId: string,
  mode: string,
  adminId: number,
  approvalRequestId: number,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const current = await (tx as typeof prisma).promptVersion.findFirst({
      where: { specialistId, mode, status: 'active' },
    });

    if (!current) {
      throw new TRPCError({ code: 'NOT_FOUND', message: `No active version for ${specialistId}:${mode}` });
    }

    // Archive current
    await (tx as typeof prisma).promptVersion.update({
      where: { id: current.id },
      data: { status: 'archived' },
    });

    // Find previous archived version (按 version DESC 第一个)
    const prev = await (tx as typeof prisma).promptVersion.findFirst({
      where: { specialistId, mode, status: 'archived', id: { not: current.id } },
      orderBy: { version: 'desc' },
    });

    if (!prev) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `No previous archived version for ${specialistId}:${mode} to restore`,
      });
    }

    await _publishPromptVersionInTx(tx, { versionId: prev.id, adminId, approvalRequestId });
  });
}

// ---------------------------------------------------------------------------
// AC-7: updateCanaryConfig — validate pct enum; canaryPct=100 triggers publish
// ---------------------------------------------------------------------------

export async function updateCanaryConfig(
  specialistId: string,
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

  const nextVersion = await prisma.promptVersion.findUniqueOrThrow({ where: { id: nextVersionId } });

  // canaryPct=100 triggers full publish via approval flow
  if (canaryPct === 100) {
    await publishPromptVersion(nextVersionId, adminId);
    return;
  }

  // Upsert canary config
  const existing = await prisma.promptCanaryConfig.findUnique({
    where: { specialistId_mode: { specialistId, mode: nextVersion.mode } },
  });

  if (existing) {
    await prisma.promptCanaryConfig.update({
      where: { id: existing.id },
      data: { nextVersionId, canaryPct, updatedByAdminId: adminId, updatedAt: new Date() },
    });
  } else {
    const active = await prisma.promptVersion.findFirst({
      where: { specialistId, mode: nextVersion.mode, status: 'active' },
    });
    if (!active) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `No active version found for ${specialistId}:${nextVersion.mode}`,
      });
    }
    await prisma.promptCanaryConfig.create({
      data: {
        specialistId,
        mode: nextVersion.mode,
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
// AC-8: getActivePromptVersion — deterministic hash routing
// SHIELD: use parseInt(hashBucket, 16) % 100 · never Math.random()
// ---------------------------------------------------------------------------

export async function getActivePromptVersion(
  specialistId: string,
  userId: number,
  mode: string = 'default',
): Promise<Pick<PromptVersion, 'id' | 'content' | 'specialistId' | 'mode'> | null> {
  const config = await prisma.promptCanaryConfig.findUnique({
    where: { specialistId_mode: { specialistId, mode } },
    include: { currentVersion: true, nextVersion: true },
  });

  if (!config) return null;

  if (config.canaryPct > 0 && config.nextVersion !== null) {
    // D-090: deterministic hash — same userId × specialistId always routes the same way
    const hashBucket = createHash('md5')
      .update(`${userId}:${specialistId}`)
      .digest('hex')
      .slice(0, 8);
    const bucketPct = parseInt(hashBucket, 16) % 100;
    if (bucketPct < config.canaryPct) {
      return config.nextVersion;
    }
  }

  return config.currentVersion;
}
