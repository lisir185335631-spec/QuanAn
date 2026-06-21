#!/usr/bin/env tsx
/**
 * schema-diff.ts
 *
 * 检测 Prisma schema 与 migrations 之间的漂移。
 * - Step 1: prisma validate (schema 语法校验)
 * - Step 2: prisma migrate diff —— 比对 migrations 历史与当前 schema.prisma
 *           有漂移则非 0 退出 + 清晰报错
 *
 * 调用方式: pnpm schema:diff  (via tsx scripts/schema-diff.ts)
 */

import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function run(cmd: string, label: string): void {
  console.log(`\n── ${label} ─────────────────────────────────────`);
  console.log(`$ ${cmd}`);
  try {
    const output = execSync(cmd, { cwd: root, encoding: 'utf8', stdio: 'pipe' });
    if (output.trim()) console.log(output.trim());
    console.log(`✅ ${label} 通过`);
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; status?: number };
    if (e.stdout?.trim()) console.error(e.stdout.trim());
    if (e.stderr?.trim()) console.error(e.stderr.trim());
    console.error(`\n❌ ${label} 失败 (exit ${e.status ?? 1})`);
    process.exit(e.status ?? 1);
  }
}

// Step 1: validate schema syntax
run('npx prisma validate', 'Prisma Schema 语法校验');

// Step 2: diff migrations → schema (detect drift)
// --exit-code: exits 2 if drift detected (changes needed), 0 if in sync
run(
  'npx prisma migrate diff' +
    ' --from-migrations ./prisma/migrations' +
    ' --to-schema-datamodel ./prisma/schema.prisma' +
    ' --shadow-database-url postgresql://return@localhost:5432/quanqn_test' +
    ' --exit-code',
  'Schema 漂移检测 (migrations ↔ schema.prisma)',
);

console.log('\n✅ schema:diff 全部通过 — 无漂移');
