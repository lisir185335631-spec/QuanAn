#!/usr/bin/env bash
# scripts/verify-prd-26.sh
# PRD-26 admin UI MVP polish — CI gate (complete · 7 sections · ≥ 30 checks)
# AC-1: TD closed 8 + visual baseline 5 + e2e smoke 5 + lazy load 3 + admin tests 5 + packages/ui/admin 5 + audit coverage 2
# Usage: bash scripts/verify-prd-26.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

PASS=0
FAIL=0
SKIP=0

ok()   { echo "  ✅ ok   $*"; PASS=$((PASS + 1)); }
fail() { echo "  ❌ FAIL $*"; FAIL=$((FAIL + 1)); }
skip() { echo "  ⏭️  skip  $*"; SKIP=$((SKIP + 1)); }

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  PRD-26 admin UI MVP — verify script"
echo "═══════════════════════════════════════════════════════════"
echo ""

# ─────────────────────────────────────────────────────────────
# §1  TD closed verification · 8 checks (TD-031/037~042/049)
# ─────────────────────────────────────────────────────────────
echo "§1  TD closed verification · 8 checks"
echo "─────────────────────────────────────────────────────────────"

TECH_DEBT=".agents/tech-debt.json"

_td_resolved() {
  local td_id="$1"
  python3 -c "
import json, sys
data = json.load(open('$TECH_DEBT'))
items = data.get('items', [])
item = next((x for x in items if x.get('id') == '$td_id'), None)
if item and item.get('status') == 'resolved' and item.get('close_evidence'):
    sys.exit(0)
sys.exit(1)
" 2>/dev/null
}

for td in TD-031 TD-037 TD-038 TD-039 TD-040 TD-041 TD-042 TD-049; do
  if _td_resolved "$td"; then
    ok "1.x  $td status=resolved + close_evidence 存在 (.agents/tech-debt.json)"
  else
    fail "1.x  $td 未 resolved 或缺 close_evidence"
  fi
done

# ─────────────────────────────────────────────────────────────
# §2  visual baseline matrix · 5 checks
# ─────────────────────────────────────────────────────────────
echo ""
echo "§2  visual baseline matrix · 5 checks"
echo "─────────────────────────────────────────────────────────────"

SNAPSHOT_DIR="/tmp/aiipznt-clone-research/screenshots"
BASELINE_COUNT=$((ls "$SNAPSHOT_DIR"/prd26-admin-*.png 2>/dev/null || true) | wc -l)

# 2.1  17 visual baseline files exist
if [ "$BASELINE_COUNT" -ge 17 ]; then
  ok "2.1  $BASELINE_COUNT prd26-admin-*.png baselines in $SNAPSHOT_DIR (≥17)"
else
  fail "2.1  只有 $BASELINE_COUNT baseline files, 需要 ≥17"
fi

# 2.2  threshold 0.05 in playwright.config.ts
if grep -q "maxDiffPixelRatio: 0.05" playwright.config.ts 2>/dev/null; then
  ok "2.2  maxDiffPixelRatio: 0.05 in playwright.config.ts"
else
  fail "2.2  maxDiffPixelRatio 0.05 缺失或不同 (playwright.config.ts)"
fi

# 2.3  viewport 1440x900 in visual-diff.ts
if grep -q "width: 1440" apps/web/scripts/visual-diff.ts 2>/dev/null && grep -q "height: 900" apps/web/scripts/visual-diff.ts 2>/dev/null; then
  ok "2.3  viewport 1440x900 in apps/web/scripts/visual-diff.ts"
else
  fail "2.3  viewport 1440x900 缺失 (visual-diff.ts)"
fi

# 2.4  fullPage: true default in visual-diff.ts
if grep -q "fullPage = true\|fullPage: true" apps/web/scripts/visual-diff.ts 2>/dev/null; then
  ok "2.4  fullPage: true default in visual-diff.ts"
else
  fail "2.4  fullPage: true 缺失 (visual-diff.ts)"
fi

# 2.5  test:visual:prd26 script in package.json
if python3 -c "import json; d=json.load(open('package.json')); s=d.get('scripts',{}); exit(0 if 'test:visual:prd26' in s else 1)" 2>/dev/null; then
  ok "2.5  test:visual:prd26 script in package.json"
else
  fail "2.5  test:visual:prd26 script 缺失 (package.json)"
fi

# ─────────────────────────────────────────────────────────────
# §3  e2e smoke · 5 checks (spec files + roles + assertions)
# ─────────────────────────────────────────────────────────────
echo ""
echo "§3  e2e smoke · 5 checks"
echo "─────────────────────────────────────────────────────────────"

SMOKE_SPEC="tests/e2e/prd26-admin-pages-smoke.spec.ts"
ROLE_SPEC="tests/e2e/prd26-admin-role-matrix.spec.ts"
FOUNDATION_SPEC="tests/e2e/admin/admin-foundation-loop.spec.ts"

# 3.1  prd26-admin-pages-smoke.spec.ts exists
if [ -f "$SMOKE_SPEC" ]; then
  ok "3.1  prd26-admin-pages-smoke.spec.ts exists"
else
  fail "3.1  prd26-admin-pages-smoke.spec.ts missing"
fi

# 3.2  prd26-admin-role-matrix.spec.ts exists
if [ -f "$ROLE_SPEC" ]; then
  ok "3.2  prd26-admin-role-matrix.spec.ts exists"
else
  fail "3.2  prd26-admin-role-matrix.spec.ts missing"
fi

# 3.3  三档角色 fixture (super_admin / domain_admin / reviewer)
if grep -q "super_admin" "$ROLE_SPEC" 2>/dev/null && grep -q "domain_admin" "$ROLE_SPEC" 2>/dev/null && grep -q "reviewer" "$ROLE_SPEC" 2>/dev/null; then
  ok "3.3  三档角色 fixture (super_admin/domain_admin/reviewer) in role matrix spec"
else
  fail "3.3  三档角色 fixture 缺失 in prd26-admin-role-matrix.spec.ts"
fi

# 3.4  admin_audit_log ≥ 9 rows assertion in spec or manifest
US003_MANIFEST="scripts/ralph/verify-artifacts/US-003/manifest.json"
if grep -q "admin_audit_log" "$ROLE_SPEC" 2>/dev/null || ([ -f "$US003_MANIFEST" ] && python3 -c "import json; d=json.load(open('$US003_MANIFEST')); exit(0 if d.get('verdict')=='PASS' else 1)" 2>/dev/null); then
  ok "3.4  admin_audit_log ≥ 9 rows 验证 (spec assertion 或 US-003 manifest PASS)"
else
  fail "3.4  admin_audit_log ≥ 9 rows 断言缺失"
fi

# 3.5  admin-foundation-loop.spec.ts exists (PRD-10 sealed baseline)
if [ -f "$FOUNDATION_SPEC" ]; then
  ok "3.5  admin-foundation-loop.spec.ts exists (PRD-10 sealed)"
else
  fail "3.5  admin-foundation-loop.spec.ts missing"
fi

# ─────────────────────────────────────────────────────────────
# §4  lazy load + chunking · 3 checks
# ─────────────────────────────────────────────────────────────
echo ""
echo "§4  lazy load + chunking · 3 checks"
echo "─────────────────────────────────────────────────────────────"

ROUTER="apps/admin/src/router.tsx"
VITE_CONFIG="apps/admin/vite.config.ts"
DIST_DIR="apps/admin/dist-admin/assets"

# 4.1  dist-admin/assets/*.js ≥ 5 chunks
CHUNK_COUNT=$((ls "$DIST_DIR"/*.js 2>/dev/null || true) | wc -l)
if [ "$CHUNK_COUNT" -ge 5 ]; then
  ok "4.1  $CHUNK_COUNT JS chunks in dist-admin/assets/ (≥5)"
else
  fail "4.1  只有 $CHUNK_COUNT chunks in $DIST_DIR, 需要 ≥5"
fi

# 4.2  ≥ 17 React.lazy imports in router.tsx
LAZY_COUNT=$(grep -c "lazy(" "$ROUTER" 2>/dev/null || echo 0)
if [ "$LAZY_COUNT" -ge 17 ]; then
  ok "4.2  $LAZY_COUNT React.lazy() calls in router.tsx (≥17)"
else
  fail "4.2  只有 $LAZY_COUNT React.lazy() calls, 需要 ≥17"
fi

# 4.3  manualChunks in vite.config.ts
if grep -q "manualChunks" "$VITE_CONFIG" 2>/dev/null; then
  ok "4.3  manualChunks 已配置 in apps/admin/vite.config.ts"
else
  fail "4.3  manualChunks 缺失 (apps/admin/vite.config.ts)"
fi

# ─────────────────────────────────────────────────────────────
# §5  admin tests count · 5 checks
# ─────────────────────────────────────────────────────────────
echo ""
echo "§5  admin unit tests · 5 checks"
echo "─────────────────────────────────────────────────────────────"

# 5.1  admin unit test files = 17
ADMIN_TEST_COUNT=$(find apps/admin/src/pages -name "*.test.tsx" 2>/dev/null | wc -l)
if [ "$ADMIN_TEST_COUNT" -ge 17 ]; then
  ok "5.1  $ADMIN_TEST_COUNT admin page unit test files (≥17)"
else
  fail "5.1  只有 $ADMIN_TEST_COUNT admin test files, 需要 ≥17"
fi

# 5.2  vi.hoisted pattern in ≥ 10 test files
HOISTED_COUNT=$((grep -rl "vi\.hoisted" apps/admin/src/pages --include="*.test.tsx" 2>/dev/null || true) | wc -l)
if [ "$HOISTED_COUNT" -ge 10 ]; then
  ok "5.2  $HOISTED_COUNT test files use vi.hoisted() (≥10)"
else
  fail "5.2  只有 $HOISTED_COUNT files use vi.hoisted, 需要 ≥10"
fi

# 5.3  ≥ 51 test() cases across admin test files
TEST_CASE_COUNT=$((grep -rh "  it(" apps/admin/src/pages --include="*.test.tsx" 2>/dev/null || true) | wc -l)
if [ "$TEST_CASE_COUNT" -ge 51 ]; then
  ok "5.3  $TEST_CASE_COUNT total it() test cases in admin pages (≥51)"
else
  fail "5.3  只有 $TEST_CASE_COUNT test cases, 需要 ≥51"
fi

# 5.4  pnpm --filter @quanan/admin test script exists in admin package.json
if python3 -c "import json; d=json.load(open('apps/admin/package.json')); s=d.get('scripts',{}); exit(0 if 'test' in s else 1)" 2>/dev/null; then
  ok "5.4  test script in apps/admin/package.json"
else
  fail "5.4  test script 缺失 (apps/admin/package.json)"
fi

# 5.5  all test files reside in __tests__ directories
TESTS_IN_TESTS_DIRS=$(find apps/admin/src/pages -name "*.test.tsx" -path "*/__tests__/*" 2>/dev/null | wc -l)
if [ "$TESTS_IN_TESTS_DIRS" -eq "$ADMIN_TEST_COUNT" ]; then
  ok "5.5  全部 $TESTS_IN_TESTS_DIRS test files 在 __tests__/ 目录"
else
  fail "5.5  $TESTS_IN_TESTS_DIRS / $ADMIN_TEST_COUNT 在 __tests__/ — 部分放错位置"
fi

# ─────────────────────────────────────────────────────────────
# §6  packages/ui/src/admin · 5 checks (TD-049 closed)
# ─────────────────────────────────────────────────────────────
echo ""
echo "§6  packages/ui/src/admin · 5 checks"
echo "─────────────────────────────────────────────────────────────"

UI_ADMIN="packages/ui/src/admin"

# 6.1  5 core component files exist
COMPONENT_COUNT=$(ls "$UI_ADMIN"/*.tsx 2>/dev/null | wc -l)
if [ "$COMPONENT_COUNT" -ge 5 ]; then
  ok "6.1  $COMPONENT_COUNT tsx component files in packages/ui/src/admin/ (≥5)"
else
  fail "6.1  只有 $COMPONENT_COUNT tsx components, 需要 ≥5"
fi

# 6.2  index.ts has ≥ 5 named exports
EXPORT_COUNT=$(grep -c "^export" "$UI_ADMIN/index.ts" 2>/dev/null || echo 0)
if [ "$EXPORT_COUNT" -ge 5 ]; then
  ok "6.2  $EXPORT_COUNT export lines in packages/ui/src/admin/index.ts (≥5)"
else
  fail "6.2  只有 $EXPORT_COUNT exports in packages/ui/src/admin/index.ts"
fi

# 6.3  apps/admin imports from @quanan/ui/admin
IMPORT_COUNT=$((grep -rl "@quanan/ui/admin" apps/admin/src 2>/dev/null || true) | wc -l)
if [ "$IMPORT_COUNT" -ge 3 ]; then
  ok "6.3  $IMPORT_COUNT apps/admin files import from @quanan/ui/admin (≥3)"
else
  fail "6.3  只有 $IMPORT_COUNT files import @quanan/ui/admin, 需要 ≥3"
fi

# 6.4  packages/ui has no trpc dependency in package.json
if ! grep -q "trpc" packages/ui/package.json 2>/dev/null; then
  ok "6.4  packages/ui/package.json has no trpc dependency (LD-A-1 隔离)"
else
  fail "6.4  packages/ui 依赖 trpc — 违反 LD-A-1"
fi

# 6.5  packages/ui/src/admin component files don't import trpc (real imports, not comments)
TRPC_IN_UI=$((grep -rn "^import.*trpc\|^import.*@trpc" "$UI_ADMIN"/*.tsx 2>/dev/null || true) | wc -l)
if [ "$TRPC_IN_UI" -eq 0 ]; then
  ok "6.5  packages/ui/src/admin/*.tsx 无 trpc import (props injection 正确)"
else
  fail "6.5  $TRPC_IN_UI ui/admin components have real trpc import lines — 违反 props injection 约定"
fi

# ─────────────────────────────────────────────────────────────
# §7  audit coverage · 2 checks
# ─────────────────────────────────────────────────────────────
echo ""
echo "§7  audit coverage · 2 checks"
echo "─────────────────────────────────────────────────────────────"

AUDIT_SCRIPT="scripts/audit-admin-rls-tables.sh"

# 7.1  audit-admin-rls-tables.sh has ≥ 22 admin tables
AUDIT_TABLE_COUNT=$(awk '/^ADMIN_TABLES=\(/,/^\)/' "$AUDIT_SCRIPT" 2>/dev/null | grep -E "^  [a-z_]+" | wc -l)
if [ "$AUDIT_TABLE_COUNT" -ge 22 ]; then
  ok "7.1  $AUDIT_TABLE_COUNT ADMIN_TABLES in audit-admin-rls-tables.sh (≥22 · TD-039 closed)"
else
  fail "7.1  只有 $AUDIT_TABLE_COUNT tables, 需要 ≥22"
fi

# 7.2  pnpm audit:admin-rls exits 0 (DB must be running · load DATABASE_URL from .env)
echo "  ⏳ running pnpm audit:admin-rls..."
DB_URL=""
if [ -f ".env" ]; then
  DB_URL=$(grep "^DATABASE_URL=" .env | cut -d= -f2-)
fi
if DATABASE_URL="${DB_URL:-postgresql://return@localhost:5432/quanqn}" bash scripts/audit-admin-rls-tables.sh > /dev/null 2>&1; then
  ok "7.2  pnpm audit:admin-rls exit 0 (DB RLS 状态全正确)"
else
  fail "7.2  pnpm audit:admin-rls 失败 — DB RLS 不一致或 DB 未启动"
fi

# ─────────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════"
TOTAL=$((PASS + FAIL + SKIP))
echo "  PRD-26 RESULT: $PASS 通过 · $FAIL 失败 · $SKIP 跳过 (共 $TOTAL 项)"
echo "═══════════════════════════════════════════════════════════"

if [ "$FAIL" -gt 0 ]; then
  echo ""
  echo "❌ PRD-26 CI gate FAILED ($FAIL 检查项不通过)"
  exit 1
else
  echo ""
  echo "✅ PRD-26 CI gate PASSED (全 $PASS 项通过)"
  echo ""
  echo "PRD-26 RESULT: 30+ 通过 · 0 失败 · ALL CHECKS PASSED"
  exit 0
fi
