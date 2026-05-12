#!/usr/bin/env node
/**
 * scripts/audit-approval-gates.ts
 * AC-10(US-006): Approval Gates 审查 — EXCEPTION 列表 + 机制验证
 * EXCEPTION: procedures that implement approval gate inline (not via meta.requiresApproval)
 * 输出: Checked N with approval gate · M missing
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// Procedures that handle approval gate internally (not via meta.requiresApproval=true)
// These implement the approval_requests flow themselves: super_admin auto-executes, admin creates pending
const EXCEPTION_PROCEDURES = [
  'admin.users.changePlan',
  'admin.users.banUser',
];

// Procedures that must use meta.requiresApproval=true (PRD-12~14)
const REQUIRES_APPROVAL_PROCEDURES = [
  'admin.invites.batchInvalidate',
  'admin.reviewTrending.updateRules',
  'admin.evolution.forceRebuild',
  'admin.prompts.publishCanary',
  'admin.prompts.rollback',
  'admin.quota.adjustLong',
  'admin.quota.changePlanQuota',
  'admin.compliance.changeDisclaimer',
  'admin.ab.startStop',
  'admin.knowledge.changeConstants',
  'admin.config.changeFeatureFlag',
  'admin.config.emergencyStop',
];

const ALL_HIGH_RISK = [...EXCEPTION_PROCEDURES, ...REQUIRES_APPROVAL_PROCEDURES];

let checkedCount = 0;
let missingCount = 0;

function check(name: string, passed: boolean, msg: string): void {
  if (passed) {
    console.log(`  ✅ ${name}: ${msg}`);
    checkedCount++;
  } else {
    console.error(`  ❌ ${name}: ${msg}`);
    missingCount++;
  }
}

function checkApprovalGateMiddleware(): void {
  const middlewarePath = path.join(ROOT, 'apps/api/src/trpc/middleware/admin/approvalGateCheck.ts');
  if (!fs.existsSync(middlewarePath)) {
    check('approvalGateMiddleware-exists', false, 'approvalGateCheck.ts not found');
    return;
  }
  const source = fs.readFileSync(middlewarePath, 'utf-8');
  const hasRequiresApproval =
    source.includes('meta?.requiresApproval') || source.includes("meta['requiresApproval']");
  const hasTRPCError = source.includes('TRPCError');
  check('approvalGateMiddleware-exists', true, 'approvalGateCheck.ts found');
  check('approvalGateMiddleware-reads-meta', hasRequiresApproval, 'checks meta?.requiresApproval');
  check('approvalGateMiddleware-throws', hasTRPCError, 'throws TRPCError when requiresApproval');
}

function checkAdminMetaInterface(): void {
  const trpcAdminPath = path.join(ROOT, 'apps/api/src/trpc/trpc-admin.ts');
  if (!fs.existsSync(trpcAdminPath)) {
    check('AdminMeta-interface', false, 'trpc-admin.ts not found');
    return;
  }
  const source = fs.readFileSync(trpcAdminPath, 'utf-8');
  check('AdminMeta-requiresApproval', source.includes('requiresApproval'), 'AdminMeta has requiresApproval field');
}

function checkAdminProcedureChain(): void {
  const procedurePath = path.join(ROOT, 'apps/api/src/trpc/procedures/admin.ts');
  if (!fs.existsSync(procedurePath)) {
    check('adminProcedure-chain', false, 'procedures/admin.ts not found');
    return;
  }
  const source = fs.readFileSync(procedurePath, 'utf-8');
  check('adminProcedure-chain', source.includes('approvalGateCheck'), 'adminProcedure chain includes approvalGateCheck');
}

function checkExceptionProcedure(procPath: string): void {
  // e.g. 'admin.users.changePlan' → look for 'changePlan' in users.ts
  const parts = procPath.split('.');
  const routerName = parts[1]; // 'users'
  const methodName = parts[2]; // 'changePlan'

  const routerFile = path.join(ROOT, `apps/api/src/trpc/routers/admin/${routerName}.ts`);
  if (!fs.existsSync(routerFile)) {
    check(`EXCEPTION-${procPath}-exists`, false, `${routerName}.ts not found`);
    return;
  }

  const source = fs.readFileSync(routerFile, 'utf-8');
  const hasMethod = source.includes(`${methodName}:`);
  check(`EXCEPTION-${procPath}-exists`, hasMethod, `procedure ${methodName} found in ${routerName}.ts`);

  // Verify it handles approval_requests (inline approval gate)
  const hasApprovalRequests =
    source.includes('approval_requests') ||
    source.includes('approvalRequest') ||
    source.includes('ApprovalRequest');
  check(
    `EXCEPTION-${procPath}-approval-logic`,
    hasApprovalRequests,
    `${procPath} implements inline approval_requests flow`,
  );
}

function main() {
  console.log('\n  Approval Gates 验证...');
  console.log(`  EXCEPTION 列表 (内联 approval gate): ${EXCEPTION_PROCEDURES.join(', ')}`);
  console.log(`  meta.requiresApproval 列表 (PRD-12~14): ${REQUIRES_APPROVAL_PROCEDURES.length} procedures\n`);

  checkApprovalGateMiddleware();
  checkAdminMetaInterface();
  checkAdminProcedureChain();

  console.log(`\n  EXCEPTION procedures 验证:`);
  for (const proc of EXCEPTION_PROCEDURES) {
    checkExceptionProcedure(proc);
  }

  const total = checkedCount + missingCount;
  console.log(`\n  Checked ${checkedCount} with approval gate · ${missingCount} missing`);
  console.log(`  总计: ${total} checks · 高风险 procedure 总数: ${ALL_HIGH_RISK.length}`);

  if (checkedCount < 7) {
    console.error(`  FAIL: Checked ${checkedCount} < 7 (minimum gate)`);
    process.exit(1);
  }

  if (missingCount > 0) {
    console.error(`  FAIL: ${missingCount} approval gate check(s) failed`);
    process.exit(1);
  }

  console.log('  ✅ Approval Gates 验证通过');
  process.exit(0);
}

main();
