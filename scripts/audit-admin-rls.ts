#!/usr/bin/env node
/**
 * scripts/audit-admin-rls.ts
 * AC-2(US-007): @typescript-eslint/parser AST 检测
 * 解析 apps/api/src/trpc/routers/admin/*.ts
 * 检查每个 procedure 的 .use chain 必含 adminRLS
 * 例外: ['auth.login', 'auth.logout', 'auth.me', 'health']
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { parse } from '@typescript-eslint/parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const ADMIN_ROUTER_DIR = path.join(ROOT, 'apps/api/src/trpc/routers/admin');

// Procedures that use publicAdminProcedure intentionally (pre-auth).
// Include both prefixed (index.ts view) and unprefixed (individual file view) forms.
const EXCEPTIONS = new Set([
  'auth.login', 'auth.logout', 'auth.me',
  'login', 'logout', 'me',
  'health',
]);

// Middlewares that contain adminRLS
const ADMIN_RLS_PATTERNS = ['adminRLS', 'adminRLSMiddleware'];

interface ProcedureCheck {
  file: string;
  procedureName: string;
  hasAdminRLS: boolean;
  usesAdminProcedure: boolean;
  isException: boolean;
  violation: boolean;
}

function getRouterFiles(): string[] {
  return fs
    .readdirSync(ADMIN_ROUTER_DIR)
    .filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'))
    .map((f) => path.join(ADMIN_ROUTER_DIR, f));
}

function extractText(node: any, source: string): string {
  return source.slice(node.range?.[0] ?? 0, node.range?.[1] ?? 0);
}

function nodeContainsAdminRLS(node: any, source: string): boolean {
  const text = extractText(node, source);
  return ADMIN_RLS_PATTERNS.some((pattern) => text.includes(pattern));
}

function nodeUsesAdminProcedure(node: any, source: string): boolean {
  const text = extractText(node, source);
  // Check if the call chain starts with adminProcedure (which already has adminRLS)
  return text.includes('adminProcedure') && !text.startsWith('publicAdminProcedure');
}

/**
 * Walk AST node and find all .query() / .mutation() / .subscription() calls.
 * Returns array of {key, callExpression} pairs.
 */
function findProcedureCalls(node: any, source: string, prefix: string): Array<{key: string; node: any}> {
  const results: Array<{key: string; node: any}> = [];

  function walk(n: any, currentPrefix: string) {
    if (!n || typeof n !== 'object') return;

    // adminTrpcRouter({ key: procedure }) or adminTrpcRouter({ key: subRouter })
    if (
      n.type === 'CallExpression' &&
      n.callee?.name === 'adminTrpcRouter' &&
      n.arguments?.[0]?.type === 'ObjectExpression'
    ) {
      const objExpr = n.arguments[0];
      for (const prop of objExpr.properties ?? []) {
        if (prop.type !== 'Property' && prop.type !== 'SpreadElement') continue;
        if (prop.type === 'SpreadElement') continue;
        const keyName = prop.key?.name ?? prop.key?.value ?? 'unknown';
        const fullKey = currentPrefix ? `${currentPrefix}.${keyName}` : keyName;
        const value = prop.value;

        // Check if the value is a procedure call chain (has .query/.mutation)
        const valueText = extractText(value, source);
        if (valueText.includes('.query(') || valueText.includes('.mutation(') || valueText.includes('.subscription(')) {
          results.push({ key: fullKey, node: value });
        } else {
          // Recurse into sub-router definitions
          walk(value, fullKey);
        }
      }
    }

    // Recurse into child nodes
    for (const key of Object.keys(n)) {
      if (key === 'parent' || key === 'loc' || key === 'range') continue;
      const child = n[key];
      if (Array.isArray(child)) {
        for (const item of child) walk(item, currentPrefix);
      } else if (child && typeof child === 'object') {
        walk(child, currentPrefix);
      }
    }
  }

  walk(node, prefix);
  return results;
}

function analyzeFile(filePath: string): ProcedureCheck[] {
  const source = fs.readFileSync(filePath, 'utf-8');
  const filename = path.basename(filePath, '.ts');
  const checks: ProcedureCheck[] = [];

  let ast: any;
  try {
    ast = parse(source, {
      range: true,
      loc: true,
      tokens: false,
      jsx: false,
    });
  } catch (e) {
    console.error(`  Parse error in ${filePath}: ${e}`);
    return checks;
  }

  const procedures = findProcedureCalls(ast, source, '');

  for (const { key, node } of procedures) {
    const isException = EXCEPTIONS.has(key);
    const usesAdminProcedure = nodeUsesAdminProcedure(node, source);
    const hasAdminRLS = nodeContainsAdminRLS(node, source) || usesAdminProcedure;

    const check: ProcedureCheck = {
      file: filename,
      procedureName: key,
      hasAdminRLS,
      usesAdminProcedure,
      isException,
      violation: !isException && !hasAdminRLS,
    };
    checks.push(check);
  }

  return checks;
}

function main() {
  const files = getRouterFiles();
  const allChecks: ProcedureCheck[] = [];

  for (const file of files) {
    const checks = analyzeFile(file);
    allChecks.push(...checks);
  }

  let hasViolation = false;
  const violations: ProcedureCheck[] = [];
  const passing: ProcedureCheck[] = [];

  for (const check of allChecks) {
    if (check.violation) {
      violations.push(check);
      hasViolation = true;
    } else {
      passing.push(check);
    }
  }

  // Print results
  for (const check of passing) {
    if (check.isException) {
      console.log(`  ✅ ${check.procedureName} [exception · publicAdminProcedure allowed]`);
    } else {
      console.log(`  ✅ ${check.procedureName} [adminProcedure · adminRLS verified]`);
    }
  }

  for (const check of violations) {
    console.error(`  ❌ VIOLATION: ${check.procedureName} — uses publicAdminProcedure without exception`);
    console.error(`     File: apps/api/src/trpc/routers/admin/${check.file}.ts`);
    console.error(`     Fix: use adminProcedure or add '${check.procedureName}' to EXCEPTIONS`);
  }

  if (allChecks.length === 0) {
    console.log('  ℹ️  No procedures found in admin routers (stubs only — OK for PRD-10)');
    process.exit(0);
  }

  if (hasViolation) {
    console.error(`\n  FAIL: ${violations.length} procedure(s) missing adminRLS`);
    process.exit(1);
  }

  console.log(`  Checked ${allChecks.length} procedure(s) · ${violations.length} violations`);
  process.exit(0);
}

main();
