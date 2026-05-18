#!/usr/bin/env bash
# verify-prd-19.sh — PRD-19 frontend-backend bridge 交付验证
# 35+ checks across 10 sections · 任一失败 exit non-zero
# Usage: bash scripts/verify-prd-19.sh
# Expected runtime: < 60s (typecheck ~20s + vitest ~30s + greps < 5s)

set -euo pipefail

PASS=0
FAIL=0
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
RESET='\033[0m'

ok()   { echo -e "  ${GREEN}✓${RESET} $1"; PASS=$((PASS+1)); }
fail() { echo -e "  ${RED}✗${RESET} $1"; FAIL=$((FAIL+1)); }
warn() { echo -e "  ${YELLOW}!${RESET} $1"; }
sep()  { echo; echo "─── $1 ───────────────────────────────────"; }

# ─────────────────────────────────────────────────────────────────────────────
sep "§1  LD-009 严守 · 0 hardcoded acc_step localStorage keys"
# ─────────────────────────────────────────────────────────────────────────────

# 1.1 No localStorage.setItem.*acc_step in step pages (exact pattern from LD-009)
HIT=$(grep -rE "localStorage\.setItem.*acc_step" apps/web/src/pages/step/ 2>/dev/null | grep -c "." || true)
[ "$HIT" = "0" ] && ok "1.1 localStorage.setItem.*acc_step hits=0 in step pages" \
                 || fail "1.1 localStorage.setItem.*acc_step hits=$HIT VIOLATION"

# 1.2 No old acc_step[0-9] bare key pattern (catches acc_step1, acc_step2...)
HIT=$(grep -rE "'acc_step[0-9]|\"acc_step[0-9]" apps/web/src/pages/step/ 2>/dev/null | grep -c "." || true)
[ "$HIT" = "0" ] && ok "1.2 bare acc_step[N] string literal hits=0" \
                 || fail "1.2 bare acc_step[N] found $HIT hits VIOLATION"

# 1.3 All step pages that write LS use stepLsKey helper (not manual string concat)
HIT=$(grep -rE "localStorage\.setItem\(" apps/web/src/pages/step/ 2>/dev/null | grep -v "stepLsKey\|getToolLsKey\|getLsKey" | grep -c "." || true)
[ "$HIT" = "0" ] && ok "1.3 all LS setItem in step pages go through namespace helpers" \
                 || fail "1.3 raw localStorage.setItem bypassing helpers found $HIT VIOLATION"

# ─────────────────────────────────────────────────────────────────────────────
sep "§2  useStepData hook · ≥9 imports in step pages"
# ─────────────────────────────────────────────────────────────────────────────

# 2.1 useStepData( or from '@/hooks/useStepData' in step pages ≥9 hits
HIT=$(grep -rE "from '@/hooks/useStepData'|useStepData\(" apps/web/src/pages/step/ 2>/dev/null | grep -c "." || true)
[ "$HIT" -ge 9 ] && ok "2.1 useStepData usage in pages hits=$HIT (≥9 required)" \
                 || fail "2.1 useStepData usage hits=$HIT (<9 VIOLATION)"

# 2.2 useStepData.ts hook file exists
[ -f "apps/web/src/hooks/useStepData.ts" ] \
  && ok "2.2 apps/web/src/hooks/useStepData.ts exists" \
  || fail "2.2 useStepData.ts missing"

# 2.3 useStepData exports save function
HIT=$(grep -E "return.*\bsave\b|save," apps/web/src/hooks/useStepData.ts 2>/dev/null | grep -c "." || true)
[ "$HIT" -ge 1 ] && ok "2.3 useStepData.ts exports save function" \
                 || fail "2.3 useStepData.ts does not export save"

# ─────────────────────────────────────────────────────────────────────────────
sep "§3  trpc.stepData.save 真接 · ≥9 hits"
# ─────────────────────────────────────────────────────────────────────────────

# 3.1 { save, destructuring from useStepData across pages + step8 components (≥8)
HIT=$(grep -rE "\{ save," \
    apps/web/src/pages/step/ \
    apps/web/src/components/step8/ 2>/dev/null | grep -c "." || true)
[ "$HIT" -ge 8 ] && ok "3.1 { save, } destructured from useStepData hits=$HIT (≥8)" \
                 || fail "3.1 save destructuring hits=$HIT (<8 VIOLATION)"

# 3.2 trpc.stepData.save.useMutation present in hook
HIT=$(grep -E "trpc\.stepData\.save\.useMutation" apps/web/src/hooks/useStepData.ts 2>/dev/null | grep -c "." || true)
[ "$HIT" -ge 1 ] && ok "3.2 trpc.stepData.save.useMutation in useStepData.ts" \
                 || fail "3.2 trpc.stepData.save.useMutation missing from hook"

# 3.3 StepForm also uses trpc.stepData.save.useMutation
HIT=$(grep -rE "trpc\.stepData\.save\.useMutation" apps/web/src/components/StepForm/ 2>/dev/null | grep -c "." || true)
[ "$HIT" -ge 1 ] && ok "3.3 StepForm uses trpc.stepData.save.useMutation" \
                 || fail "3.3 StepForm missing trpc.stepData.save.useMutation"

# 3.4 Combined: trpc.stepData.save.useMutation OR { save, via useStepData ≥9 total
HIT=$(grep -rE "trpc\.stepData\.save\.useMutation|\{ save," \
    apps/web/src/pages/step/ \
    apps/web/src/components/step8/ \
    apps/web/src/hooks/useStepData.ts \
    apps/web/src/components/StepForm/ 2>/dev/null | grep -c "." || true)
[ "$HIT" -ge 9 ] && ok "3.4 combined save wiring hits=$HIT (≥9 required)" \
                 || fail "3.4 combined save wiring hits=$HIT (<9 VIOLATION)"

# ─────────────────────────────────────────────────────────────────────────────
sep "§4  aiip_memory_acc_ naming convention · ≥5 hits"
# ─────────────────────────────────────────────────────────────────────────────

# 4.1 aiip_memory_acc_ appears in ls-namespace.ts ≥3 hits
HIT=$(grep -E "aiip_memory_acc_" apps/web/src/lib/ls-namespace.ts 2>/dev/null | grep -c "." || true)
[ "$HIT" -ge 3 ] && ok "4.1 aiip_memory_acc_ in ls-namespace.ts hits=$HIT (≥3)" \
                 || fail "4.1 aiip_memory_acc_ in ls-namespace.ts hits=$HIT (<3)"

# 4.2 LS_PREFIX = 'aiip_memory_acc' exact match
HIT=$(grep -E "LS_PREFIX\s*=\s*'aiip_memory_acc'" apps/web/src/lib/ls-namespace.ts 2>/dev/null | grep -c "." || true)
[ "$HIT" -ge 1 ] && ok "4.2 LS_PREFIX='aiip_memory_acc' exact constant defined" \
                 || fail "4.2 LS_PREFIX missing or wrong value"

# 4.3 aiip_memory_acc_ in useStepData.ts (comment or usage)
HIT=$(grep -E "aiip_memory_acc_" apps/web/src/hooks/useStepData.ts 2>/dev/null | grep -c "." || true)
[ "$HIT" -ge 1 ] && ok "4.3 aiip_memory_acc_ reference in useStepData.ts hits=$HIT" \
                 || fail "4.3 aiip_memory_acc_ missing from useStepData.ts"

# 4.4 Total aiip_memory_acc_ mentions across both files ≥5
HIT=$(grep -E "aiip_memory_acc_" \
    apps/web/src/lib/ls-namespace.ts \
    apps/web/src/hooks/useStepData.ts 2>/dev/null | grep -c "." || true)
[ "$HIT" -ge 5 ] && ok "4.4 total aiip_memory_acc_ hits=$HIT (≥5 required)" \
                 || fail "4.4 total aiip_memory_acc_ hits=$HIT (<5 VIOLATION)"

# ─────────────────────────────────────────────────────────────────────────────
sep "§5  D4=B 颜色严锁 · 0 violet/amber/gold/purple"
# ─────────────────────────────────────────────────────────────────────────────

# 5.1 No from-violet in step pages
HIT=$(grep -rE "from-violet" apps/web/src/pages/step/ 2>/dev/null | grep -c "." || true)
[ "$HIT" = "0" ] && ok "5.1 from-violet hits=0 in step pages" \
                 || fail "5.1 from-violet found $HIT hits D4=B VIOLATION"

# 5.2 No from-amber in step pages
HIT=$(grep -rE "from-amber" apps/web/src/pages/step/ 2>/dev/null | grep -c "." || true)
[ "$HIT" = "0" ] && ok "5.2 from-amber hits=0 in step pages" \
                 || fail "5.2 from-amber found $HIT hits D4=B VIOLATION"

# 5.3 No from-gold/from-purple in step pages and step components
HIT=$(grep -rE "from-(gold|purple)" \
    apps/web/src/pages/step/ \
    apps/web/src/components/step4b/ \
    apps/web/src/components/step5/ \
    apps/web/src/components/step6/ \
    apps/web/src/components/step7/ \
    apps/web/src/components/step8/ 2>/dev/null | grep -c "." || true)
[ "$HIT" = "0" ] && ok "5.3 from-gold/from-purple hits=0 in step components" \
                 || fail "5.3 from-gold/from-purple found $HIT hits D4=B VIOLATION"

# ─────────────────────────────────────────────────────────────────────────────
sep "§6  D3=A boundary · packages/clients/ 仅 router 类型更新 · 无跨应用直连"
# ─────────────────────────────────────────────────────────────────────────────

# 6.1 packages/clients/ changes ≤5 files (expected: router-types.ts, admin-router-types.ts, package.json)
CLIENTS_CHANGES=$(git diff main..HEAD --name-only 2>/dev/null | grep -c "^packages/clients/" || true)
[ "$CLIENTS_CHANGES" -le 5 ] \
  && ok "6.1 packages/clients/ changed files=$CLIENTS_CHANGES (≤5 expected for type regen)" \
  || fail "6.1 packages/clients/ changed files=$CLIENTS_CHANGES (>5 unexpected VIOLATION)"

# 6.2 packages/clients/ only contains router-type and package.json changes (no arbitrary source)
UNEXPECTED=$(git diff main..HEAD --name-only 2>/dev/null | grep "^packages/clients/" | \
    grep -vE "router-types\.ts$|package\.json$" | grep -c "." || true)
[ "$UNEXPECTED" = "0" ] \
  && ok "6.2 packages/clients/ only router-type/package.json changes (0 unexpected)" \
  || fail "6.2 packages/clients/ has $UNEXPECTED unexpected file changes"

# 6.3 No direct cross-app imports: apps/web must not import from apps/api/ (checks actual import/from statements)
HIT=$(grep -rE "^[[:space:]]*(import|from)[^/]*apps/api" apps/web/src/ 2>/dev/null | grep -c "." || true)
[ "$HIT" = "0" ] \
  && ok "6.3 no direct apps/web → apps/api cross-imports (tRPC client enforced)" \
  || fail "6.3 found $HIT direct apps/web→apps/api imports D3=A VIOLATION"

# ─────────────────────────────────────────────────────────────────────────────
sep "§7  TD-76 fix · STEP7_LABEL_SCRIPT_TYPE 常量化"
# ─────────────────────────────────────────────────────────────────────────────

# 7.1 STEP7_LABEL_SCRIPT_TYPE exported from step7.ts
HIT=$(grep -E "export const STEP7_LABEL_SCRIPT_TYPE" apps/web/src/lib/constants/step7.ts 2>/dev/null | grep -c "." || true)
[ "$HIT" = "1" ] && ok "7.1 export const STEP7_LABEL_SCRIPT_TYPE in step7.ts (TD-76)" \
                 || fail "7.1 STEP7_LABEL_SCRIPT_TYPE missing from step7.ts (TD-76 OPEN)"

# 7.2 Step7.tsx imports and uses STEP7_LABEL_SCRIPT_TYPE
HIT=$(grep -E "STEP7_LABEL_SCRIPT_TYPE" apps/web/src/pages/step/Step7.tsx 2>/dev/null | grep -c "." || true)
[ "$HIT" -ge 2 ] && ok "7.2 Step7.tsx imports+uses STEP7_LABEL_SCRIPT_TYPE (hits=$HIT)" \
                 || fail "7.2 Step7.tsx missing STEP7_LABEL_SCRIPT_TYPE usage (TD-76 OPEN)"

# 7.3 No hardcoded '选择脚本类型' as JSX text in Step7.tsx (comments allowed, JSX comments excluded)
HIT=$(grep -E "\{.*选择脚本类型.*\}|>选择脚本类型<" apps/web/src/pages/step/Step7.tsx 2>/dev/null | grep -v "{\s*/\*" | grep -c "." || true)
[ "$HIT" = "0" ] && ok "7.3 no hardcoded '选择脚本类型' as JSX text in Step7.tsx" \
                 || fail "7.3 hardcoded '选择脚本类型' JSX found $HIT hits (TD-76 not fixed)"

# 7.4 tech-debt.json TD-76 status=resolved
STATUS=$(python3 -c "
import json, sys
with open('.agents/tech-debt.json') as f:
    data = json.load(f)
items = data.get('items', [])
td = next((x for x in items if x.get('id') == 'TD-76'), None)
print(td['status'] if td else 'NOT_FOUND')
" 2>/dev/null || echo "ERROR")
[ "$STATUS" = "resolved" ] && ok "7.4 tech-debt.json TD-76 status=resolved" \
                             || fail "7.4 TD-76 status=$STATUS (expected resolved)"

# ─────────────────────────────────────────────────────────────────────────────
sep "§8  TD-77 fix · STEP8_OPTIMIZE_OUTPUT_LABELS_2 常量化"
# ─────────────────────────────────────────────────────────────────────────────

# 8.1 STEP8_OPTIMIZE_OUTPUT_LABELS_2 exported from step8.ts
HIT=$(grep -E "export const STEP8_OPTIMIZE_OUTPUT_LABELS_2" apps/web/src/lib/constants/step8.ts 2>/dev/null | grep -c "." || true)
[ "$HIT" = "1" ] && ok "8.1 export const STEP8_OPTIMIZE_OUTPUT_LABELS_2 in step8.ts (TD-77)" \
                 || fail "8.1 STEP8_OPTIMIZE_OUTPUT_LABELS_2 missing from step8.ts (TD-77 OPEN)"

# 8.2 Step8OptimizeScript.tsx uses STEP8_OPTIMIZE_OUTPUT_LABELS_2
HIT=$(grep -E "STEP8_OPTIMIZE_OUTPUT_LABELS_2" apps/web/src/components/step8/Step8OptimizeScript.tsx 2>/dev/null | grep -c "." || true)
[ "$HIT" -ge 1 ] && ok "8.2 Step8OptimizeScript.tsx uses STEP8_OPTIMIZE_OUTPUT_LABELS_2 (hits=$HIT)" \
                 || fail "8.2 Step8OptimizeScript.tsx missing STEP8_OPTIMIZE_OUTPUT_LABELS_2 (TD-77 OPEN)"

# 8.3 No hardcoded '优化后文案' or '优化说明' as JSX props in Step8OptimizeScript.tsx
HIT=$(grep -E 'label="优化后文案"|label="优化说明"' apps/web/src/components/step8/Step8OptimizeScript.tsx 2>/dev/null | grep -c "." || true)
[ "$HIT" = "0" ] && ok "8.3 no hardcoded label='优化后文案/优化说明' in Step8OptimizeScript.tsx" \
                 || fail "8.3 hardcoded labels found $HIT hits (TD-77 not fixed)"

# 8.4 tech-debt.json TD-77 status=resolved
STATUS=$(python3 -c "
import json, sys
with open('.agents/tech-debt.json') as f:
    data = json.load(f)
items = data.get('items', [])
td = next((x for x in items if x.get('id') == 'TD-77'), None)
print(td['status'] if td else 'NOT_FOUND')
" 2>/dev/null || echo "ERROR")
[ "$STATUS" = "resolved" ] && ok "8.4 tech-debt.json TD-77 status=resolved" \
                             || fail "8.4 TD-77 status=$STATUS (expected resolved)"

# ─────────────────────────────────────────────────────────────────────────────
sep "§9  Zero-regression · typecheck + vitest"
# ─────────────────────────────────────────────────────────────────────────────

# 9.1 TypeScript typecheck passes
echo "  [running] pnpm --filter @quanqn/web typecheck ..."
if (cd "$ROOT/apps/web" && pnpm typecheck) 2>&1; then
  ok "9.1 pnpm typecheck passed (exit 0)"
else
  fail "9.1 pnpm typecheck FAILED (exit non-zero)"
fi

# 9.2 Vitest run passes
echo "  [running] pnpm --filter @quanqn/web vitest run ..."
VITEST_OUT=$((cd "$ROOT/apps/web" && pnpm vitest run) 2>&1 || true)
if echo "$VITEST_OUT" | grep -qE "passed"; then
  ok "9.2 pnpm vitest run passed"
  VITEST_FAILED=$(echo "$VITEST_OUT" | grep -oE "[0-9]+ failed" | head -1 | grep -oE "[0-9]+" || echo 0)
  [ "${VITEST_FAILED:-0}" = "0" ] || fail "9.2 vitest has $VITEST_FAILED failed tests"
elif echo "$VITEST_OUT" | grep -qE " failed"; then
  fail "9.2 pnpm vitest run FAILED — $(echo "$VITEST_OUT" | grep -E 'failed' | tail -3)"
else
  fail "9.2 pnpm vitest run FAILED (no passed/failed line found)"
fi

# 9.3 Test count ≥119 (parse "Tests  N passed" line)
TEST_COUNT=$(echo "$VITEST_OUT" | grep -E "^\s+Tests\s+[0-9]+ passed" | grep -oE "[0-9]+" | head -1 || echo 0)
[ "${TEST_COUNT:-0}" -ge 119 ] 2>/dev/null \
  && ok "9.3 vitest test count=$TEST_COUNT (≥119 required)" \
  || fail "9.3 vitest test count=$TEST_COUNT (<119 VIOLATION)"

# ─────────────────────────────────────────────────────────────────────────────
sep "§10  Migration helper · legacy-ls.ts"
# ─────────────────────────────────────────────────────────────────────────────

# 10.1 Migration file exists
[ -f "apps/web/src/lib/migration/legacy-ls.ts" ] \
  && ok "10.1 apps/web/src/lib/migration/legacy-ls.ts exists" \
  || fail "10.1 legacy-ls.ts missing"

# 10.2 MIGRATION_FLAG_KEY defined
HIT=$(grep -E "MIGRATION_FLAG_KEY" apps/web/src/lib/migration/legacy-ls.ts 2>/dev/null | grep -c "." || true)
[ "$HIT" -ge 1 ] && ok "10.2 MIGRATION_FLAG_KEY defined in legacy-ls.ts (hits=$HIT)" \
                 || fail "10.2 MIGRATION_FLAG_KEY missing"

# 10.3 migrateLegacyLs function exported
HIT=$(grep -E "export function migrateLegacyLs|export const migrateLegacyLs" \
    apps/web/src/lib/migration/legacy-ls.ts 2>/dev/null | grep -c "." || true)
[ "$HIT" -ge 1 ] && ok "10.3 migrateLegacyLs exported from legacy-ls.ts" \
                 || fail "10.3 migrateLegacyLs not exported"

# 10.4 App.tsx calls migrateLegacyLs (one-time mount guard)
HIT=$(grep -E "migrateLegacyLs" apps/web/src/App.tsx 2>/dev/null | grep -c "." || true)
[ "$HIT" -ge 1 ] && ok "10.4 App.tsx calls migrateLegacyLs (hits=$HIT)" \
                 || fail "10.4 App.tsx does not call migrateLegacyLs"

# ─────────────────────────────────────────────────────────────────────────────
echo
echo "══════════════════════════════════════════════════════"
echo "  PRD-19 Verify Summary: ${GREEN}${PASS} passed${RESET}  ${RED}${FAIL} failed${RESET}"
echo "══════════════════════════════════════════════════════"

[ "$FAIL" = "0" ] && echo -e "  ${GREEN}ALL CHECKS PASSED ✓${RESET}" || echo -e "  ${RED}SOME CHECKS FAILED ✗${RESET}"

exit "$FAIL"
