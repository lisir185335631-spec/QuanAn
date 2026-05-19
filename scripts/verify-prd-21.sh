#!/usr/bin/env bash
# scripts/verify-prd-21.sh
# PRD-21 Visual Alignment Foundation — CI gate (complete · 10 sections)
# Usage: bash scripts/verify-prd-21.sh

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
echo "  PRD-21 Visual Alignment Foundation — verify script"
echo "═══════════════════════════════════════════════════════════"
echo ""

# ─────────────────────────────────────────────────────────────
# §1  Visual diff infrastructure (US-001)
# ─────────────────────────────────────────────────────────────
echo "§1  Visual diff infrastructure (US-001)"
echo "─────────────────────────────────────────────────────────────"

# 1.1  visual-diff.ts exists
if [ -f "apps/web/scripts/visual-diff.ts" ]; then
  ok "1.1  apps/web/scripts/visual-diff.ts exists"
else
  fail "1.1  apps/web/scripts/visual-diff.ts missing"
fi

# 1.2  expectVisualMatch exported
if grep -q "export async function expectVisualMatch" "apps/web/scripts/visual-diff.ts" 2>/dev/null; then
  ok "1.2  expectVisualMatch exported from visual-diff.ts"
else
  fail "1.2  expectVisualMatch not exported in visual-diff.ts"
fi

# 1.3  spec exists
if [ -f "tests/e2e/prd21-visual-baseline.spec.ts" ]; then
  ok "1.3  tests/e2e/prd21-visual-baseline.spec.ts exists"
else
  fail "1.3  tests/e2e/prd21-visual-baseline.spec.ts missing"
fi

# 1.4  expectVisualMatch calls >= 4
CALL_COUNT=$(grep -c "expectVisualMatch(" "tests/e2e/prd21-visual-baseline.spec.ts" 2>/dev/null || echo "0")
if [ "$CALL_COUNT" -ge 4 ]; then
  ok "1.4  expectVisualMatch calls: $CALL_COUNT (>= 4)"
else
  fail "1.4  expectVisualMatch calls: $CALL_COUNT (need >= 4)"
fi

# 1.5  maxDiffPixelRatio 0.05 locked (D-206)
if grep -qE "maxDiffPixelRatio.*0\.05|0\.05.*maxDiffPixelRatio" "apps/web/scripts/visual-diff.ts" 2>/dev/null || \
   grep -qE "maxDiffPixelRatio.*0\.05|0\.05.*maxDiffPixelRatio" "playwright.config.ts" 2>/dev/null; then
  ok "1.5  maxDiffPixelRatio: 0.05 locked (D-206)"
else
  fail "1.5  maxDiffPixelRatio 0.05 not found in visual-diff.ts or playwright.config.ts"
fi

# 1.6  baseline directory exists
BASELINE_DIR="/tmp/aiipznt-clone-research/screenshots"
if [ -d "$BASELINE_DIR" ]; then
  ok "1.6  baseline dir exists: $BASELINE_DIR"
else
  fail "1.6  baseline dir missing: $BASELINE_DIR"
fi

# 1.7  baseline PNG >= 32
PNG_COUNT=0
if [ -d "$BASELINE_DIR" ]; then
  PNG_COUNT=$(ls "$BASELINE_DIR"/*.png 2>/dev/null | wc -l | tr -d ' ')
fi
if [ "$PNG_COUNT" -ge 32 ]; then
  ok "1.7  baseline PNG count: $PNG_COUNT (>= 32)"
else
  fail "1.7  baseline PNG count: $PNG_COUNT (need >= 32)"
fi

# 1.8  animations:disabled in playwright.config.ts
if grep -qE "animations.*disabled|animations: 'disabled'" "playwright.config.ts" 2>/dev/null || \
   grep -qE "animations.*disabled|animations: 'disabled'" "apps/web/playwright.config.ts" 2>/dev/null; then
  ok "1.8  animations:disabled configured"
else
  fail "1.8  animations:disabled not found in playwright.config.ts"
fi

echo ""
echo "─────────────────────────────────────────────────────────────"
echo "§2  Header 视觉精修 (US-002)"
echo "─────────────────────────────────────────────────────────────"

HEADER_FILE="apps/web/src/components/Header.tsx"

# 2.1  h-16 class present
if grep -q "h-16" "$HEADER_FILE" 2>/dev/null; then
  ok "2.1  Header: h-16 container height"
else
  fail "2.1  Header: h-16 not found in $HEADER_FILE"
fi

# 2.2  backdrop-blur-2xl
if grep -q "backdrop-blur-2xl" "$HEADER_FILE" 2>/dev/null; then
  ok "2.2  Header: backdrop-blur-2xl"
else
  fail "2.2  Header: backdrop-blur-2xl not found in $HEADER_FILE"
fi

# 2.3  双行 logo stack (two span elements for QUAN + QN branding)
SPAN_COUNT=$(grep -c "font-display" "$HEADER_FILE" 2>/dev/null || echo "0")
if [ "$SPAN_COUNT" -ge 2 ]; then
  ok "2.3  Header: 双行 logo stack (font-display spans: $SPAN_COUNT)"
else
  fail "2.3  Header: 双行 logo stack not found (font-display spans: $SPAN_COUNT, need >= 2)"
fi

# 2.4  ChevronDown rotate-180 (dropdown indicator)
if grep -q "rotate-180" "$HEADER_FILE" 2>/dev/null; then
  ok "2.4  Header: ChevronDown rotate-180 (dropdown animate)"
else
  fail "2.4  Header: rotate-180 not found in $HEADER_FILE"
fi

echo ""
echo "─────────────────────────────────────────────────────────────"
echo "§3  Mobile nav 重写 (US-003)"
echo "─────────────────────────────────────────────────────────────"

MOBILE_PANEL="apps/web/src/components/header/MobileNavPanel.tsx"

# 3.1  MobileNavPanel component exists
if [ -f "$MOBILE_PANEL" ]; then
  ok "3.1  MobileNavPanel component exists"
else
  fail "3.1  MobileNavPanel.tsx missing: $MOBILE_PANEL"
fi

# 3.2  MobileNavPanel exported
if grep -q "export function MobileNavPanel" "$MOBILE_PANEL" 2>/dev/null; then
  ok "3.2  MobileNavPanel: exported"
else
  fail "3.2  MobileNavPanel: export not found"
fi

# 3.3  Sheet drawer removed from Header.tsx
if ! grep -q "SheetContent\|SheetTrigger\|SheetRoot\|from.*radix.*sheet\|from.*ui/sheet" "$HEADER_FILE" 2>/dev/null; then
  ok "3.3  Header: Sheet drawer removed"
else
  fail "3.3  Header: Sheet drawer still present (Sheet imports found)"
fi

# 3.4  MobileNavPanel imported in Header.tsx
if grep -q "MobileNavPanel" "$HEADER_FILE" 2>/dev/null; then
  ok "3.4  Header: MobileNavPanel imported and used"
else
  fail "3.4  Header: MobileNavPanel not referenced in $HEADER_FILE"
fi

# 3.5  prd21-mobile-nav.spec.ts exists
if [ -f "tests/e2e/prd21-mobile-nav.spec.ts" ]; then
  ok "3.5  tests/e2e/prd21-mobile-nav.spec.ts exists"
else
  fail "3.5  tests/e2e/prd21-mobile-nav.spec.ts missing"
fi

echo ""
echo "─────────────────────────────────────────────────────────────"
echo "§4  共享 utility 全局补齐 (US-004)"
echo "─────────────────────────────────────────────────────────────"

GLOBALS_CSS="apps/web/src/styles/globals.css"
FADE_WRAPPER="apps/web/src/components/FadeInWrapper.tsx"
ROOT_LAYOUT="apps/web/src/layouts/RootLayout.tsx"

# 4.1  data-grid-bg utility class defined
if grep -q "\.data-grid-bg" "$GLOBALS_CSS" 2>/dev/null; then
  ok "4.1  data-grid-bg utility defined in globals.css"
else
  fail "4.1  data-grid-bg utility not found in $GLOBALS_CSS"
fi

# 4.2  animate-ping-primary defined
if grep -q "\.animate-ping-primary\|animate-ping-primary" "$GLOBALS_CSS" 2>/dev/null; then
  ok "4.2  animate-ping-primary defined in globals.css"
else
  fail "4.2  animate-ping-primary not found in $GLOBALS_CSS"
fi

# 4.3  Toaster bottom-right in RootLayout
if grep -q "bottom-right" "$ROOT_LAYOUT" 2>/dev/null; then
  ok "4.3  Toaster: position=bottom-right in RootLayout"
else
  fail "4.3  Toaster: bottom-right not found in $ROOT_LAYOUT"
fi

# 4.4  FadeInWrapper component exists
if [ -f "$FADE_WRAPPER" ]; then
  ok "4.4  FadeInWrapper.tsx exists"
else
  fail "4.4  FadeInWrapper.tsx missing: $FADE_WRAPPER"
fi

# 4.5  FadeInWrapper exported
if grep -q "export function FadeInWrapper" "$FADE_WRAPPER" 2>/dev/null; then
  ok "4.5  FadeInWrapper: exported"
else
  fail "4.5  FadeInWrapper: export not found"
fi

echo ""
echo "─────────────────────────────────────────────────────────────"
echo "§5  Home 视觉精修 (US-005)"
echo "─────────────────────────────────────────────────────────────"

HOME_FILE="apps/web/src/pages/Home.tsx"

# 5.1  Hero: text-8xl md:text-9xl
if grep -q "text-8xl" "$HOME_FILE" 2>/dev/null && grep -q "text-9xl" "$HOME_FILE" 2>/dev/null; then
  ok "5.1  Home Hero: text-8xl md:text-9xl"
else
  fail "5.1  Home Hero: text-8xl / text-9xl not found in $HOME_FILE"
fi

# 5.2  FadeInWrapper used in Home.tsx
FW_COUNT=$(grep -c "FadeInWrapper" "$HOME_FILE" 2>/dev/null || echo "0")
if [ "$FW_COUNT" -ge 2 ]; then
  ok "5.2  Home: FadeInWrapper used ($FW_COUNT occurrences)"
else
  fail "5.2  Home: FadeInWrapper not used (count: $FW_COUNT, need >= 2)"
fi

# 5.3  data-grid-bg on main element
if grep -q "data-grid-bg" "$HOME_FILE" 2>/dev/null; then
  ok "5.3  Home: data-grid-bg applied"
else
  fail "5.3  Home: data-grid-bg not found in $HOME_FILE"
fi

echo ""
echo "─────────────────────────────────────────────────────────────"
echo "§6  /guide 视觉精修 (US-006)"
echo "─────────────────────────────────────────────────────────────"

GUIDE_FILE="apps/web/src/pages/Guide.tsx"
GUIDE_FAQ_FILE="apps/web/src/lib/constants/guide-faq.ts"

# 6.1  RECOMMENDED_FLOW constant in Guide.tsx
if grep -q "RECOMMENDED_FLOW" "$GUIDE_FILE" 2>/dev/null; then
  ok "6.1  Guide: RECOMMENDED_FLOW constant defined"
else
  fail "6.1  Guide: RECOMMENDED_FLOW not found in $GUIDE_FILE"
fi

# 6.2  SYSTEM_OVERVIEW constant in Guide.tsx
if grep -q "SYSTEM_OVERVIEW" "$GUIDE_FILE" 2>/dev/null; then
  ok "6.2  Guide: SYSTEM_OVERVIEW constant defined"
else
  fail "6.2  Guide: SYSTEM_OVERVIEW not found in $GUIDE_FILE"
fi

# 6.3  GUIDE_FAQ_5 exported from constants
if [ -f "$GUIDE_FAQ_FILE" ] && grep -q "export const GUIDE_FAQ_5" "$GUIDE_FAQ_FILE" 2>/dev/null; then
  ok "6.3  Guide: GUIDE_FAQ_5 exported from guide-faq.ts"
else
  fail "6.3  Guide: GUIDE_FAQ_5 not found in $GUIDE_FAQ_FILE"
fi

# 6.4  GUIDE_FAQ_5 used in Guide.tsx
if grep -q "GUIDE_FAQ_5" "$GUIDE_FILE" 2>/dev/null; then
  ok "6.4  Guide: GUIDE_FAQ_5 imported and used"
else
  fail "6.4  Guide: GUIDE_FAQ_5 not referenced in $GUIDE_FILE"
fi

echo ""
echo "─────────────────────────────────────────────────────────────"
echo "§7  /ip-plan 视觉精修 (US-007)"
echo "─────────────────────────────────────────────────────────────"

IP_PLAN_GRID="apps/web/src/components/ip-plan/IpPlanStepGrid.tsx"

# 7.1  IpPlanStepGrid component exists
if [ -f "$IP_PLAN_GRID" ]; then
  ok "7.1  IpPlanStepGrid component exists"
else
  fail "7.1  IpPlanStepGrid.tsx missing: $IP_PLAN_GRID"
fi

# 7.2  IP_PLAN_STEPS constant defined (9 steps)
if grep -q "IP_PLAN_STEPS" "$IP_PLAN_GRID" 2>/dev/null; then
  ok "7.2  IpPlanStepGrid: IP_PLAN_STEPS constant defined"
else
  fail "7.2  IpPlanStepGrid: IP_PLAN_STEPS not found"
fi

# 7.3  glass-card used on step cards
if grep -q "glass-card" "$IP_PLAN_GRID" 2>/dev/null; then
  ok "7.3  IpPlanStepGrid: glass-card styling applied"
else
  fail "7.3  IpPlanStepGrid: glass-card not found"
fi

# 7.4  FadeInWrapper used for stagger animation
if grep -q "FadeInWrapper" "$IP_PLAN_GRID" 2>/dev/null; then
  ok "7.4  IpPlanStepGrid: FadeInWrapper stagger animation used"
else
  fail "7.4  IpPlanStepGrid: FadeInWrapper not used"
fi

echo ""
echo "─────────────────────────────────────────────────────────────"
echo "§8  跨 PRD 一致性 (PRD-15/16 fixture integrity)"
echo "─────────────────────────────────────────────────────────────"

# 8.1  prd16 e2e fixtures intact
PRD16_COUNT=$(ls tests/e2e/prd16-*.spec.ts 2>/dev/null | wc -l | tr -d ' ')
if [ "$PRD16_COUNT" -ge 4 ]; then
  ok "8.1  PRD-16 e2e fixtures: $PRD16_COUNT files (>= 4)"
else
  fail "8.1  PRD-16 e2e fixtures: $PRD16_COUNT (need >= 4)"
fi

# 8.2  prd15 test files intact
PRD15_COUNT=$(ls tests/e2e/prd15-*.test.ts 2>/dev/null | wc -l | tr -d ' ')
if [ "$PRD15_COUNT" -ge 2 ]; then
  ok "8.2  PRD-15 e2e test files: $PRD15_COUNT files (>= 2)"
else
  fail "8.2  PRD-15 e2e test files: $PRD15_COUNT (need >= 2)"
fi

# 8.3  header.spec.ts still present
if [ -f "tests/e2e/header.spec.ts" ]; then
  ok "8.3  tests/e2e/header.spec.ts exists (cross-PRD header guard)"
else
  fail "8.3  tests/e2e/header.spec.ts missing"
fi

# 8.4  routes-34.spec.ts still present (PRD-16 route coverage)
if [ -f "tests/e2e/routes-34.spec.ts" ]; then
  ok "8.4  tests/e2e/routes-34.spec.ts exists (route coverage guard)"
else
  fail "8.4  tests/e2e/routes-34.spec.ts missing"
fi

# 8.5  No Sheet import in Header.tsx (ensures US-003 didn't break prior route paths)
if ! grep -qE "from.*ui/sheet|@radix-ui.*sheet" "$HEADER_FILE" 2>/dev/null; then
  ok "8.5  Header: no Sheet import (cross-PRD mobile nav integrity)"
else
  fail "8.5  Header: Sheet import still present — may conflict with prd21-mobile-nav"
fi

echo ""
echo "─────────────────────────────────────────────────────────────"
echo "§9  TypeScript + vitest test count"
echo "─────────────────────────────────────────────────────────────"

# 9.1  TypeScript compiles (0 errors)
echo "  → running pnpm typecheck ..."
if (cd apps/web && pnpm typecheck 2>&1 | grep -qE "^Found [0-9]+ error" && false) || \
   (cd apps/web && pnpm typecheck 2>&1; [ $? -eq 0 ]); then
  ok "9.1  TypeScript: 0 errors"
else
  fail "9.1  TypeScript: typecheck failed"
fi

# 9.2  vitest test count >= 123
echo "  → running pnpm vitest run (count check) ..."
VITEST_OUTPUT=$(pnpm test 2>&1)
TEST_COUNT=$(echo "$VITEST_OUTPUT" | grep -oE "Tests +[0-9]+" | grep -oE "[0-9]+" | head -1 || echo "0")
if [ -z "$TEST_COUNT" ]; then
  TEST_COUNT=0
fi
if [ "$TEST_COUNT" -ge 123 ]; then
  ok "9.2  vitest tests: $TEST_COUNT (>= 123)"
else
  fail "9.2  vitest tests: $TEST_COUNT (need >= 123)"
fi

# 9.3  vitest all pass (0 failures)
if echo "$VITEST_OUTPUT" | grep -qE "Tests +[0-9]+ passed"; then
  FAIL_COUNT=$(echo "$VITEST_OUTPUT" | grep -oE "[0-9]+ failed" | grep -oE "[0-9]+" | head -1 || echo "0")
  if [ -z "$FAIL_COUNT" ] || [ "$FAIL_COUNT" -eq 0 ]; then
    ok "9.3  vitest: all tests pass (0 failures)"
  else
    fail "9.3  vitest: $FAIL_COUNT test(s) failed"
  fi
else
  fail "9.3  vitest: run failed or no tests found"
fi

echo ""
echo "─────────────────────────────────────────────────────────────"
echo "§10  Git branch / commit / progress.txt"
echo "─────────────────────────────────────────────────────────────"

# 10.1  correct branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
EXPECTED_BRANCH="ralph/prd-21-visual-alignment-foundation"
if [ "$CURRENT_BRANCH" = "$EXPECTED_BRANCH" ]; then
  ok "10.1  git branch: $CURRENT_BRANCH"
else
  fail "10.1  git branch: $CURRENT_BRANCH (expected $EXPECTED_BRANCH)"
fi

# 10.2  at least 7 PRD-21 commits
PRD21_COMMITS=$(git log --oneline | grep -c "US-00[1-9]\|US-0[1-9][0-9]" || echo "0")
if [ "$PRD21_COMMITS" -ge 7 ]; then
  ok "10.2  PRD-21 commits: $PRD21_COMMITS (>= 7)"
else
  fail "10.2  PRD-21 commits: $PRD21_COMMITS (need >= 7 for US-001 to US-007)"
fi

# 10.3  progress.txt exists and has content
if [ -f "scripts/ralph/progress.txt" ] && [ -s "scripts/ralph/progress.txt" ]; then
  LINE_COUNT=$(wc -l < "scripts/ralph/progress.txt" | tr -d ' ')
  ok "10.3  progress.txt: exists ($LINE_COUNT lines)"
else
  fail "10.3  progress.txt: missing or empty"
fi

# 10.4  progress.txt contains PRD-21 entries
if grep -q "PRD-21\|US-001\|US-002\|US-003\|US-004\|US-005\|US-006\|US-007" "scripts/ralph/progress.txt" 2>/dev/null; then
  ok "10.4  progress.txt: PRD-21 story entries present"
else
  fail "10.4  progress.txt: no PRD-21 story entries found"
fi

# ─────────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════"
TOTAL=$((PASS + FAIL + SKIP))
echo "  PRD-21 RESULT: $PASS 通过 · $FAIL 失败 · $SKIP 跳过 (共 $TOTAL 项)"
echo "═══════════════════════════════════════════════════════════"

if [ "$FAIL" -gt 0 ]; then
  echo ""
  echo "❌ PRD-21 CI gate FAILED ($FAIL 检查项不通过)"
  exit 1
else
  echo ""
  echo "✅ PRD-21 CI gate PASSED (全 $PASS 项通过)"
  exit 0
fi
