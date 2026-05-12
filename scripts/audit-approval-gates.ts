#!/usr/bin/env node
/**
 * scripts/audit-approval-gates.ts
 * AC-3(US-007): AST stub 验证 · 14 类高风险 procedure 检查 meta.requiresApproval=true
 * PRD-10 阶段: stub 验证机制就位 · 验证 approvalGateCheckMiddleware 存在且正确接受 meta
 * 真实 14 高风险 procedure 在 PRD-11~14 实现
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// 14 高风险 procedure 清单(§10.3 · PRD-11~14 实现时应存在)
const HIGH_RISK_PROCEDURES = [
  'admin.users.changePlan',
  'admin.users.banUser',
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

function checkApprovalGateMiddleware(): boolean {
  const middlewarePath = path.join(
    ROOT,
    'apps/api/src/trpc/middleware/admin/approvalGateCheck.ts',
  );

  if (!fs.existsSync(middlewarePath)) {
    console.error('  ❌ approvalGateCheck.ts middleware not found');
    return false;
  }

  const source = fs.readFileSync(middlewarePath, 'utf-8');

  // Check that the middleware reads meta.requiresApproval
  if (!source.includes('meta?.requiresApproval') && !source.includes("meta['requiresApproval']")) {
    console.error('  ❌ approvalGateCheck middleware does not check meta?.requiresApproval');
    return false;
  }

  // Check that it throws TRPCError when requiresApproval is true
  if (!source.includes('TRPCError')) {
    console.error('  ❌ approvalGateCheck middleware does not throw TRPCError');
    return false;
  }

  console.log('  ✅ approvalGateCheckMiddleware exists and checks meta.requiresApproval');
  return true;
}

function checkAdminMetaInterface(): boolean {
  const trpcAdminPath = path.join(ROOT, 'apps/api/src/trpc/trpc-admin.ts');

  if (!fs.existsSync(trpcAdminPath)) {
    console.error('  ❌ trpc-admin.ts not found');
    return false;
  }

  const source = fs.readFileSync(trpcAdminPath, 'utf-8');

  // Check that AdminMeta interface has requiresApproval
  if (!source.includes('requiresApproval')) {
    console.error('  ❌ AdminMeta interface missing requiresApproval field');
    return false;
  }

  console.log('  ✅ AdminMeta interface has requiresApproval field');
  return true;
}

function checkAdminProcedureChain(): boolean {
  const procedurePath = path.join(ROOT, 'apps/api/src/trpc/procedures/admin.ts');

  if (!fs.existsSync(procedurePath)) {
    console.error('  ❌ procedures/admin.ts not found');
    return false;
  }

  const source = fs.readFileSync(procedurePath, 'utf-8');

  // Check that adminProcedure includes approvalGateCheck
  if (!source.includes('approvalGateCheck')) {
    console.error('  ❌ adminProcedure chain missing approvalGateCheck');
    return false;
  }

  console.log('  ✅ adminProcedure chain includes approvalGateCheck');
  return true;
}

function reportHighRiskInventory(): void {
  console.log(`\n  📋 14 高风险 procedure 清单(PRD-11~14 实现时验证 meta.requiresApproval=true):`);
  for (const proc of HIGH_RISK_PROCEDURES) {
    console.log(`     - ${proc}`);
  }
  console.log(`\n  ℹ️  PRD-10 stub 验证: mechanism in place · 真实 procedure 由 PRD-11~14 填充`);
}

function main() {
  console.log('  Approval Gates AST stub 验证...');
  console.log();

  const checks = [
    checkApprovalGateMiddleware(),
    checkAdminMetaInterface(),
    checkAdminProcedureChain(),
  ];

  reportHighRiskInventory();

  const passed = checks.filter(Boolean).length;
  const failed = checks.length - passed;

  console.log(`\n  结果: ${passed}/${checks.length} checks passed`);

  if (failed > 0) {
    console.error(`  FAIL: ${failed} Approval Gates mechanism check(s) failed`);
    process.exit(1);
  }

  console.log('  Approval Gates 机制验证通过 · PRD-13 将补全真实工作流');
  process.exit(0);
}

main();
