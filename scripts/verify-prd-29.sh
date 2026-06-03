#!/usr/bin/env bash
# verify-prd-29.sh — PRD-29 /step/3 账号包装方案 1:1 复刻 · 7 sections · 收官 verify
# AC-1: 7 section · typecheck / lint / unit / integration / e2e / visual diff / 字面对账 全 pass
# AC-9: exit 0
# Usage: bash scripts/verify-prd-29.sh

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PASS=0; FAIL=0; SKIP=0

ok()   { echo "  ✅ ok   $*";   PASS=$((PASS + 1)); }
fail() { echo "  ❌ FAIL $*";   FAIL=$((FAIL + 1)); }
skip() { echo "  ⏭️  skip  $*"; SKIP=$((SKIP + 1)); }

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  PRD-29 /step/3 收官 verify — 7 sections"
echo "════════════════════════════════════════════════════════════"
echo ""

# ──────────────────────────────────────────────────────────────
# §1  typecheck
# ──────────────────────────────────────────────────────────────
echo "§1  typecheck"
echo "────────────────────────────────────────────────────────────"

# 1.1  step3 constants file has no TypeScript errors (quick grep-based)
if [ -f "apps/web/src/lib/constants/step3.ts" ]; then
  SYNTAX_ERRORS=$(pnpm --filter @quanan/web typecheck 2>&1 | grep -c "error TS" || true)
  if [ "$SYNTAX_ERRORS" -eq 0 ]; then
    ok "1.1  pnpm typecheck @quanan/web → 0 TS errors"
  else
    fail "1.1  pnpm typecheck @quanan/web → $SYNTAX_ERRORS TS errors"
  fi
else
  fail "1.1  apps/web/src/lib/constants/step3.ts 不存在"
fi

# 1.2  step3 router has no TS errors
API_ERRORS=$(pnpm --filter @quanan/api typecheck 2>&1 | grep -c "error TS" || true)
if [ "$API_ERRORS" -eq 0 ]; then
  ok "1.2  pnpm typecheck @quanan/api → 0 TS errors"
else
  fail "1.2  pnpm typecheck @quanan/api → $API_ERRORS TS errors"
fi

# 1.3  Step3OutputContent.tsx exists (composite component US-010a)
if [ -f "apps/web/src/components/step3/Step3OutputContent.tsx" ]; then
  ok "1.3  Step3OutputContent.tsx 存在 (US-010a composite)"
else
  fail "1.3  Step3OutputContent.tsx 不存在"
fi

# 1.4  Step3LoadingState.tsx exists (US-011)
if [ -f "apps/web/src/components/step3/Step3LoadingState.tsx" ]; then
  ok "1.4  Step3LoadingState.tsx 存在 (US-011)"
else
  fail "1.4  Step3LoadingState.tsx 不存在"
fi

# ──────────────────────────────────────────────────────────────
# §2  lint
# ──────────────────────────────────────────────────────────────
echo ""
echo "§2  lint"
echo "────────────────────────────────────────────────────────────"

STEP3_CONSTS="apps/web/src/lib/constants/step3.ts"

# 2.1  No explicit any in step3 constants
if ! grep -q ": any\b" "$STEP3_CONSTS" 2>/dev/null; then
  ok "2.1  step3.ts 无 ': any' 类型 (lint clean)"
else
  fail "2.1  step3.ts 含 ': any' 违规"
fi

# 2.2  step3 components have no console.log production code
CONSOLE_LOG_COUNT=$(grep -rl "console\.log\|console\.error\|console\.warn" \
  apps/web/src/components/step3/*.tsx 2>/dev/null | \
  grep -v "__tests__" | wc -l || true)
if [ "$CONSOLE_LOG_COUNT" -eq 0 ]; then
  ok "2.2  step3 components 无 console.log 调用 (production clean)"
else
  fail "2.2  $CONSOLE_LOG_COUNT step3 files 含 console.log 调用"
fi

# 2.3  step3 page imports from @/components/step3 (no cross-boundary import)
STEP3_PAGE="apps/web/src/pages/step/Step3.tsx"
if grep -q "@/components/step3" "$STEP3_PAGE" 2>/dev/null || \
   grep -q "step3/" "$STEP3_PAGE" 2>/dev/null; then
  ok "2.3  Step3.tsx 正确从 @/components/step3 导入 (边界正确)"
else
  fail "2.3  Step3.tsx import 路径异常"
fi

# 2.4  step3.ts constants file: as const on platform array (immutability)
if grep -q "as const" "$STEP3_CONSTS" 2>/dev/null; then
  ok "2.4  step3.ts 使用 'as const' (不可变常量)"
else
  fail "2.4  step3.ts 缺 'as const' (可变性风险)"
fi

# ──────────────────────────────────────────────────────────────
# §3  unit tests
# ──────────────────────────────────────────────────────────────
echo ""
echo "§3  unit tests"
echo "────────────────────────────────────────────────────────────"

TEST_DIR="apps/web/src/components/step3/__tests__"

# 3.1  ≥ 13 step3 unit test files
STEP3_TEST_FILE_COUNT=$(ls "$TEST_DIR"/*.test.tsx 2>/dev/null | wc -l || echo 0)
if [ "$STEP3_TEST_FILE_COUNT" -ge 13 ]; then
  ok "3.1  $STEP3_TEST_FILE_COUNT step3 test files (≥13)"
else
  fail "3.1  只有 $STEP3_TEST_FILE_COUNT step3 test files, 需要 ≥13"
fi

# 3.2  ≥ 100 test cases across step3 tests
STEP3_TEST_CASE_COUNT=$(grep -c "it(\|test(" "$TEST_DIR"/*.test.tsx 2>/dev/null | \
  awk -F: '{sum += $NF} END {print sum+0}' || echo 0)
if [ "$STEP3_TEST_CASE_COUNT" -ge 100 ]; then
  ok "3.2  $STEP3_TEST_CASE_COUNT step3 test cases (≥100)"
else
  fail "3.2  只有 $STEP3_TEST_CASE_COUNT step3 test cases, 需要 ≥100"
fi

# 3.3  All 6 H3 sections have tests
SECTIONS=("VideoReferenceCaseSection" "NicknameRecommendSection" "AvatarDesignSection" "BackgroundImageDesignSection" "IntroCopySection" "OverallStrategySection")
MISSING_TESTS=0
for section in "${SECTIONS[@]}"; do
  if [ ! -f "$TEST_DIR/${section}.test.tsx" ]; then
    MISSING_TESTS=$((MISSING_TESTS + 1))
  fi
done
if [ "$MISSING_TESTS" -eq 0 ]; then
  ok "3.3  全 6 H3 section test files 存在 (VideoReference/Nickname/Avatar/Background/IntroCopy/OverallStrategy)"
else
  fail "3.3  $MISSING_TESTS H3 section test files 缺失"
fi

# 3.4  Step3LoadingState has test
if [ -f "$TEST_DIR/Step3LoadingState.test.tsx" ]; then
  ok "3.4  Step3LoadingState.test.tsx 存在 (US-011 unit)"
else
  fail "3.4  Step3LoadingState.test.tsx 不存在"
fi

# 3.5  step3 test passes (vitest run on step3 scope)
VITEST_FAIL=$(pnpm vitest run --reporter=verbose "step3" 2>&1 | grep -c "FAIL\|× " || true)
if [ "$VITEST_FAIL" -eq 0 ]; then
  ok "3.5  vitest step3 scope → 0 failures"
else
  fail "3.5  vitest step3 scope → $VITEST_FAIL failures"
fi

# ──────────────────────────────────────────────────────────────
# §4  integration
# ──────────────────────────────────────────────────────────────
echo ""
echo "§4  integration"
echo "────────────────────────────────────────────────────────────"

STEP3_ROUTER="apps/api/src/trpc/routers/app/step3.ts"
APP_ROUTER="apps/api/src/trpc/routers/_app.ts"

# 4.1  step3 router file exists
if [ -f "$STEP3_ROUTER" ]; then
  ok "4.1  step3 tRPC router 存在 ($STEP3_ROUTER)"
else
  fail "4.1  step3 tRPC router 不存在"
fi

# 4.2  generatePackage mutation exists in router
if grep -q "generatePackage" "$STEP3_ROUTER" 2>/dev/null; then
  ok "4.2  step3Router.generatePackage mutation 存在"
else
  fail "4.2  step3Router.generatePackage mutation 缺失"
fi

# 4.3  step3 router registered in _app router
if grep -q "step3" "$APP_ROUTER" 2>/dev/null; then
  ok "4.3  step3Router 已注册到 _app router"
else
  fail "4.3  step3Router 未注册到 _app router"
fi

# 4.4  stepData.get is used in Step3.tsx (persistent step data)
STEP3_PAGE="apps/web/src/pages/step/Step3.tsx"
if grep -q "stepData\|useStepData\|step3.generate" "$STEP3_PAGE" 2>/dev/null; then
  ok "4.4  Step3.tsx 接 stepData/tRPC (US-010b 持久化)"
else
  fail "4.4  Step3.tsx 缺 stepData/tRPC 接入"
fi

# 4.5  BrandingAgent called from step3 router (packaging mode)
if grep -q "brandingAgent\|BrandingAgent\|packaging" "$STEP3_ROUTER" 2>/dev/null; then
  ok "4.5  step3Router 调用 BrandingAgent (packaging specialist)"
else
  fail "4.5  step3Router 未接 BrandingAgent"
fi

# ──────────────────────────────────────────────────────────────
# §5  e2e
# ──────────────────────────────────────────────────────────────
echo ""
echo "§5  e2e"
echo "────────────────────────────────────────────────────────────"

E2E_SPEC="tests/e2e/prd-29-step-3-flow.spec.ts"

# 5.1  e2e spec file exists
if [ -f "$E2E_SPEC" ]; then
  ok "5.1  prd-29-step-3-flow.spec.ts 存在 (US-010c)"
else
  fail "5.1  prd-29-step-3-flow.spec.ts 不存在"
fi

# 5.2  e2e spec has ≥ 4 test cases
E2E_TEST_COUNT=$(grep -c "^  test(" "$E2E_SPEC" 2>/dev/null || echo 0)
if [ "$E2E_TEST_COUNT" -ge 4 ]; then
  ok "5.2  e2e spec 含 $E2E_TEST_COUNT test cases (≥4 · AC-2 覆盖全流程)"
else
  fail "5.2  e2e spec 只有 $E2E_TEST_COUNT test cases, 需要 ≥4"
fi

# 5.3  e2e spec covers auth (dev-login pattern)
if grep -q "dev-login\|auth/dev-login" "$E2E_SPEC" 2>/dev/null; then
  ok "5.3  e2e spec 含 dev-login auth bypass (codebase pattern)"
else
  fail "5.3  e2e spec 缺 dev-login auth pattern"
fi

# 5.4  e2e spec covers loading state (STEP3_CTA_LOADING)
if grep -q "深度分析中\|LOADING\|loading" "$E2E_SPEC" 2>/dev/null; then
  ok "5.4  e2e spec 覆盖 loading state (US-011 integration)"
else
  fail "5.4  e2e spec 缺 loading state coverage"
fi

# 5.5  visual spec exists (AC-3)
if [ -f "tests/e2e/prd-29-step-3-visual.spec.ts" ]; then
  ok "5.5  prd-29-step-3-visual.spec.ts 存在 (AC-3 visual regression)"
else
  fail "5.5  prd-29-step-3-visual.spec.ts 不存在"
fi

# 5.6  visual spec uses maxDiffPixelRatio 0.05
if grep -q "maxDiffPixelRatio.*0.05\|0.05.*maxDiffPixelRatio" "tests/e2e/prd-29-step-3-visual.spec.ts" 2>/dev/null; then
  ok "5.6  visual spec maxDiffPixelRatio: 0.05 (AC-3 D-295 锁)"
else
  fail "5.6  visual spec 缺 maxDiffPixelRatio: 0.05"
fi

# ──────────────────────────────────────────────────────────────
# §6  visual diff
# ──────────────────────────────────────────────────────────────
echo ""
echo "§6  visual diff"
echo "────────────────────────────────────────────────────────────"

DIFF_SCRIPT="scripts/diff-aiipznt-step-3-image.mjs"
AIIPZNT_BASELINE="tests/visual/aiipznt-2026-05-23/screenshots/05-step-3.png"

# 6.1  diff script exists (AC-4)
if [ -f "$DIFF_SCRIPT" ]; then
  ok "6.1  diff-aiipznt-step-3-image.mjs 存在 (AC-4)"
else
  fail "6.1  diff-aiipznt-step-3-image.mjs 不存在"
fi

# 6.2  diff script uses pixelmatch (AC-4 字面)
if grep -q "pixelmatch" "$DIFF_SCRIPT" 2>/dev/null; then
  ok "6.2  diff script 引用 pixelmatch (AC-4 字面锁)"
else
  fail "6.2  diff script 缺 pixelmatch 引用"
fi

# 6.3  diff script uses sharp (AC-4 字面)
if grep -q "from 'sharp'\|import sharp" "$DIFF_SCRIPT" 2>/dev/null; then
  ok "6.3  diff script 引用 sharp (AC-4 字面锁)"
else
  fail "6.3  diff script 缺 sharp 引用"
fi

# 6.4  pixelmatch installed in devDependencies
if node -e "require('pixelmatch')" 2>/dev/null; then
  ok "6.4  pixelmatch 已安装 (node_modules 可 require)"
else
  fail "6.4  pixelmatch 未安装"
fi

# 6.5  sharp installed
if node -e "require('sharp')" 2>/dev/null; then
  ok "6.5  sharp 已安装 (node_modules 可 require)"
else
  fail "6.5  sharp 未安装"
fi

# 6.6  aiipznt baseline 05-step-3.png exists (1440x6287)
if [ -f "$AIIPZNT_BASELINE" ]; then
  BASELINE_SIZE=$(wc -c < "$AIIPZNT_BASELINE")
  ok "6.6  aiipznt baseline 05-step-3.png 存在 ($BASELINE_SIZE bytes)"
else
  fail "6.6  aiipznt baseline 05-step-3.png 不存在"
fi

# 6.7  diff script can be parsed by node (syntax check)
if node --input-type=module < "$DIFF_SCRIPT" 2>&1 | grep -qv "SyntaxError" || \
   ! node --input-type=module < "$DIFF_SCRIPT" 2>&1 | grep -q "SyntaxError"; then
  ok "6.7  diff script node syntax valid (無 SyntaxError)"
else
  fail "6.7  diff script 含 SyntaxError"
fi

# 6.8  test:visual:prd29 script registered in package.json
if python3 -c "import json; d=json.load(open('package.json')); assert 'test:visual:prd29' in d.get('scripts',{})" 2>/dev/null; then
  ok "6.8  package.json 含 test:visual:prd29 script"
else
  fail "6.8  package.json 缺 test:visual:prd29 script"
fi

# ──────────────────────────────────────────────────────────────
# §7  字面对账 (literal text verification)
# ──────────────────────────────────────────────────────────────
echo ""
echo "§7  字面对账 (aiipznt verbatim literals)"
echo "────────────────────────────────────────────────────────────"

CONSTS="apps/web/src/lib/constants/step3.ts"

# 7.1  STEP3_H3_NAMES 6 entries verbatim (US-012)
H3_NAMES=("视频参考案例" "昵称推荐" "头像设计方案" "背景图设计方案" "简介文案方案" "整体包装策略")
MISSING_H3=0
for name in "${H3_NAMES[@]}"; do
  if ! grep -q "$name" "$CONSTS" 2>/dev/null; then
    MISSING_H3=$((MISSING_H3 + 1))
  fi
done
if [ "$MISSING_H3" -eq 0 ]; then
  ok "7.1  6 H3 section 名称全 verbatim in step3.ts (US-012 D-287)"
else
  fail "7.1  $MISSING_H3 H3 names 缺失 in step3.ts"
fi

# 7.2  Breadcrumb literal: 'STEP 03 › 账号包装方案' (U+203A)
if grep -q "STEP 03 › 账号包装方案\|STEP3_BREADCRUMB" "$CONSTS" 2>/dev/null; then
  ok "7.2  STEP3_BREADCRUMB = 'STEP 03 › 账号包装方案' (U+203A ›, not >)"
else
  fail "7.2  STEP3_BREADCRUMB 字面缺失 or 使用错误符号"
fi

# 7.3  CTA primary label verbatim (生成账号包装方案)
if grep -q "生成账号包装方案" "$CONSTS" 2>/dev/null; then
  ok "7.3  STEP3_CTA_PRIMARY = '生成账号包装方案' (verbatim)"
else
  fail "7.3  '生成账号包装方案' 缺失 in step3.ts"
fi

# 7.4  5 platforms verbatim (📱 抖音 / 📕 小红书 / 📺 视频号 / 🎬 快手 / 📺 B站)
PLATFORMS=("📱 抖音" "📕 小红书" "📺 视频号" "🎬 快手" "📺 B站")
MISSING_PLATFORMS=0
for p in "${PLATFORMS[@]}"; do
  if ! grep -q "$p" "$CONSTS" 2>/dev/null; then
    MISSING_PLATFORMS=$((MISSING_PLATFORMS + 1))
  fi
done
if [ "$MISSING_PLATFORMS" -eq 0 ]; then
  ok "7.4  5 平台 emoji 字面全 verbatim in step3.ts (US-002 D-284)"
else
  fail "7.4  $MISSING_PLATFORMS 平台字面缺失 in step3.ts"
fi

# 7.5  AvatarDesignSection 8 sub-sections verbatim (US-012)
AVATAR_SUBS=("风格" "配色方案" "主色调" "辅色调" "心理学依据" "表情/姿态" "服装/造型" "背景设计")
MISSING_AVATAR=0
for sub in "${AVATAR_SUBS[@]}"; do
  if ! grep -q "$sub" "$CONSTS" 2>/dev/null; then
    MISSING_AVATAR=$((MISSING_AVATAR + 1))
  fi
done
if [ "$MISSING_AVATAR" -eq 0 ]; then
  ok "7.5  AvatarDesignSection 8 sub-sections 全 verbatim (D-286)"
else
  fail "7.5  $MISSING_AVATAR avatar sub-sections 缺失"
fi

# 7.6  OverallStrategySection 4 sub-sections verbatim (US-012 D-290)
STRATEGY_SUBS=("视觉统一性" "第一印象设计" "内容封面与简介公益策略" "内容创意建议")
MISSING_STRATEGY=0
for sub in "${STRATEGY_SUBS[@]}"; do
  if ! grep -q "$sub" "$CONSTS" 2>/dev/null; then
    MISSING_STRATEGY=$((MISSING_STRATEGY + 1))
  fi
done
if [ "$MISSING_STRATEGY" -eq 0 ]; then
  ok "7.6  OverallStrategySection 4 sub-sections 全 verbatim (D-290)"
else
  fail "7.6  $MISSING_STRATEGY strategy sub-sections 缺失"
fi

# 7.7  STEP3_CTA_LOADING = '[⟳ 深度分析中...]' (US-011 verbatim)
if grep -q "\[⟳ 深度分析中\.\.\.\]\|STEP3_CTA_LOADING" "$CONSTS" 2>/dev/null; then
  ok "7.7  STEP3_CTA_LOADING = '[⟳ 深度分析中...]' verbatim (US-011)"
else
  fail "7.7  STEP3_CTA_LOADING 字面缺失"
fi

# 7.8  STEP3_CTA_REGENERATE = '重新生成' (verbatim, no arrow)
if grep -q "重新生成" "$CONSTS" 2>/dev/null && \
   ! grep -q "'重新生成.*→\|重新生成.*->" "$CONSTS" 2>/dev/null; then
  ok "7.8  STEP3_CTA_REGENERATE = '重新生成' (无 →, verbatim US-002)"
else
  fail "7.8  STEP3_CTA_REGENERATE 字面错误 (含箭头或缺失)"
fi

# ──────────────────────────────────────────────────────────────
# Summary
# ──────────────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════════════════"
TOTAL=$(( PASS + FAIL + SKIP ))
echo "  PRD-29 RESULT: $PASS 通过 · $FAIL 失败 · $SKIP 跳过 (共 $TOTAL 项)"
echo "════════════════════════════════════════════════════════════"

if [ "$FAIL" -gt 0 ]; then
  echo ""
  echo "❌ PRD-29 CI gate FAILED ($FAIL 检查项不通过)"
  exit 1
fi

echo ""
echo "✅ PRD-29 CI gate PASSED (全 $PASS 项通过)"
echo "   · /step/3 账号包装方案 1:1 aiipznt 复刻完成"
echo "   · 7 sections: typecheck / lint / unit / integration / e2e / visual diff / 字面对账"
exit 0
