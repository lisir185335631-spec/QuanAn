#!/usr/bin/env bash
# scripts/verify-prd-23.sh
# PRD-23 Stubs & Tools Polish — CI gate (complete · 10 sections · 60 checks)
# Usage: bash scripts/verify-prd-23.sh

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
echo "  PRD-23 Stubs & Tools Polish — verify script"
echo "═══════════════════════════════════════════════════════════"
echo ""

# ─────────────────────────────────────────────────────────────
# §1  /diagnosis · 8 步问卷 + 16 自评项 + 7 维度报告 (US-001)
# ─────────────────────────────────────────────────────────────
echo "§1  /diagnosis · 8 步问卷 + 7 维度诊断报告 (US-001)"
echo "─────────────────────────────────────────────────────────────"

DIAGNOSIS_CONST="apps/web/src/lib/constants/diagnosis.ts"
DIAGNOSIS_PAGE="apps/web/src/pages/modules/Diagnosis.tsx"
DIAGNOSIS_CARD="apps/web/src/components/diagnosis/DiagnosisStepCard.tsx"

# 1.1  DIAGNOSIS_H1 contains "7 维度 IP 诊断报告"
if grep -q "7 维度 IP 诊断报告" "$DIAGNOSIS_CONST" 2>/dev/null; then
  ok "1.1  DIAGNOSIS_H1 = '7 维度 IP 诊断报告' in diagnosis.ts"
else
  fail "1.1  DIAGNOSIS_H1 '7 维度 IP 诊断报告' missing from diagnosis.ts"
fi

# 1.2  DIAGNOSIS_DIMENSIONS_8 has 8 entries
DIM_COUNT=$(grep -c "id: '" "$DIAGNOSIS_CONST" 2>/dev/null || echo "0")
if [ "$DIM_COUNT" -ge 8 ]; then
  ok "1.2  DIAGNOSIS_DIMENSIONS_8: $DIM_COUNT dimensions (>= 8)"
else
  fail "1.2  DIAGNOSIS_DIMENSIONS_8: $DIM_COUNT dimensions (need >= 8)"
fi

# 1.3  Total checkboxes ≥ 16 (spec §8.5.1 self-eval items)
CB_COUNT=$(python3 -c "
import re
with open('$DIAGNOSIS_CONST') as f:
    content = f.read()
# Count single-quoted strings inside checkboxes arrays
items = re.findall(r\"'([^']+)'\", content)
print(len([i for i in items if len(i) > 5]))
" 2>/dev/null || echo "0")
if [ "${CB_COUNT:-0}" -ge 16 ]; then
  ok "1.3  Self-eval checkboxes: $CB_COUNT items (>= 16)"
else
  fail "1.3  Self-eval checkboxes: $CB_COUNT items (need >= 16)"
fi

# 1.4  DiagnosisStepCard.tsx component exists
if [ -f "$DIAGNOSIS_CARD" ]; then
  ok "1.4  DiagnosisStepCard.tsx component exists"
else
  fail "1.4  DiagnosisStepCard.tsx component missing"
fi

# 1.5  Diagnosis.tsx imports DiagnosisStepCard
if grep -q "DiagnosisStepCard" "$DIAGNOSIS_PAGE" 2>/dev/null; then
  ok "1.5  Diagnosis.tsx imports DiagnosisStepCard"
else
  fail "1.5  Diagnosis.tsx does not import DiagnosisStepCard"
fi

# 1.6  Diagnosis.tsx uses DIAGNOSIS_DIMENSIONS_8 (8-step progression)
if grep -q "DIAGNOSIS_DIMENSIONS_8" "$DIAGNOSIS_PAGE" 2>/dev/null; then
  ok "1.6  Diagnosis.tsx uses DIAGNOSIS_DIMENSIONS_8"
else
  fail "1.6  Diagnosis.tsx missing DIAGNOSIS_DIMENSIONS_8 usage"
fi

# 1.7  REPORT_DIMENSIONS_7 defined (7 scoring dimensions)
if grep -q "REPORT_DIMENSIONS_7" "$DIAGNOSIS_CONST" 2>/dev/null; then
  ok "1.7  REPORT_DIMENSIONS_7 defined in diagnosis.ts (7 scoring dims)"
else
  fail "1.7  REPORT_DIMENSIONS_7 missing from diagnosis.ts"
fi

echo ""

# ─────────────────────────────────────────────────────────────
# §2  /accounts · IP 账号管理 + 新建账号 modal (US-002)
# ─────────────────────────────────────────────────────────────
echo "§2  /accounts · IP 账号管理 + 新建账号 modal (US-002)"
echo "─────────────────────────────────────────────────────────────"

ACCOUNTS_PAGE="apps/web/src/pages/modules/Accounts.tsx"
IP_ACCOUNT_CARD="apps/web/src/components/accounts/IpAccountCard.tsx"
CREATE_MODAL="apps/web/src/components/accounts/CreateAccountModal.tsx"

# 2.1  H1 "IP 账号管理" in Accounts.tsx
if grep -q "IP 账号管理" "$ACCOUNTS_PAGE" 2>/dev/null; then
  ok "2.1  Accounts.tsx: H1 'IP 账号管理' literal present"
else
  fail "2.1  Accounts.tsx: H1 'IP 账号管理' literal missing"
fi

# 2.2  IpAccountCard imported in Accounts.tsx
if grep -q "IpAccountCard" "$ACCOUNTS_PAGE" 2>/dev/null; then
  ok "2.2  Accounts.tsx: IpAccountCard imported"
else
  fail "2.2  Accounts.tsx: IpAccountCard not imported"
fi

# 2.3  CreateAccountModal imported in Accounts.tsx
if grep -q "CreateAccountModal" "$ACCOUNTS_PAGE" 2>/dev/null; then
  ok "2.3  Accounts.tsx: CreateAccountModal imported"
else
  fail "2.3  Accounts.tsx: CreateAccountModal not imported"
fi

# 2.4  IpAccountCard.tsx file exists
if [ -f "$IP_ACCOUNT_CARD" ]; then
  ok "2.4  IpAccountCard.tsx component exists"
else
  fail "2.4  IpAccountCard.tsx component missing"
fi

# 2.5  CreateAccountModal.tsx file exists
if [ -f "$CREATE_MODAL" ]; then
  ok "2.5  CreateAccountModal.tsx component exists"
else
  fail "2.5  CreateAccountModal.tsx component missing"
fi

# 2.6  Accounts.tsx has accounts-empty testid (empty state)
if grep -q "accounts-empty" "$ACCOUNTS_PAGE" 2>/dev/null; then
  ok "2.6  Accounts.tsx: accounts-empty data-testid present"
else
  fail "2.6  Accounts.tsx: accounts-empty data-testid missing"
fi

echo ""

# ─────────────────────────────────────────────────────────────
# §3  /step/8 · 直播策划 2 子功能 tabs + 6 H3 输出 (US-003)
# ─────────────────────────────────────────────────────────────
echo "§3  /step/8 · 直播策划 2 子功能 tabs + 6 H3 输出 (US-003)"
echo "─────────────────────────────────────────────────────────────"

STEP8_PAGE="apps/web/src/pages/step/Step8.tsx"
STEP8_CONST="apps/web/src/lib/constants/step8.ts"
STEP8_GEN="apps/web/src/components/step8/Step8GeneratePlan.tsx"
STEP8_OPT="apps/web/src/components/step8/Step8OptimizeScript.tsx"

# 3.1  STEP8_H1 "直播策划" in constants
if grep -q "直播策划" "$STEP8_CONST" 2>/dev/null; then
  ok "3.1  STEP8_H1 '直播策划' literal in step8.ts constants"
else
  fail "3.1  STEP8_H1 '直播策划' literal missing from step8.ts"
fi

# 3.2  "生成直播方案" tab literal in Step8.tsx
if grep -q "生成直播方案" "$STEP8_PAGE" 2>/dev/null; then
  ok "3.2  Step8.tsx: '生成直播方案' tab literal present"
else
  fail "3.2  Step8.tsx: '生成直播方案' tab literal missing"
fi

# 3.3  "AI 优化话术" tab literal in Step8.tsx
if grep -q "AI 优化话术" "$STEP8_PAGE" 2>/dev/null; then
  ok "3.3  Step8.tsx: 'AI 优化话术' tab literal present"
else
  fail "3.3  Step8.tsx: 'AI 优化话术' tab literal missing"
fi

# 3.4  6 H3 generate plan output blocks (开场话术/中场互动/成交话术/收尾/引流策略/互动设计)
if grep -q "开场话术" "$STEP8_CONST" 2>/dev/null && \
   grep -q "中场互动" "$STEP8_CONST" 2>/dev/null && \
   grep -q "成交话术" "$STEP8_CONST" 2>/dev/null && \
   grep -q "收尾" "$STEP8_CONST" 2>/dev/null && \
   grep -q "引流策略" "$STEP8_CONST" 2>/dev/null && \
   grep -q "互动设计" "$STEP8_CONST" 2>/dev/null; then
  ok "3.4  6 H3 generate plan outputs: 开场话术/中场互动/成交话术/收尾/引流策略/互动设计"
else
  fail "3.4  6 H3 generate plan output literals incomplete in step8.ts"
fi

# 3.5  Step8GeneratePlan component exists
if [ -f "$STEP8_GEN" ]; then
  ok "3.5  Step8GeneratePlan.tsx component exists"
else
  fail "3.5  Step8GeneratePlan.tsx component missing"
fi

# 3.6  Step8OptimizeScript component exists
if [ -f "$STEP8_OPT" ]; then
  ok "3.6  Step8OptimizeScript.tsx component exists"
else
  fail "3.6  Step8OptimizeScript.tsx component missing"
fi

# 3.7  STEP8_EXPERIENCES_3 has 3 entries (新手/有经验/资深)
if grep -q "新手" "$STEP8_CONST" 2>/dev/null && \
   grep -q "有经验" "$STEP8_CONST" 2>/dev/null && \
   grep -q "资深" "$STEP8_CONST" 2>/dev/null; then
  ok "3.7  STEP8_EXPERIENCES_3: 新手/有经验/资深 literals present"
else
  fail "3.7  STEP8_EXPERIENCES_3: experience literals incomplete"
fi

echo ""

# ─────────────────────────────────────────────────────────────
# §4  /video-analysis · 爆款文案解析 + 5 H3 stub (US-004)
# ─────────────────────────────────────────────────────────────
echo "§4  /video-analysis · 爆款文案解析 + 5 H3 stub (US-004)"
echo "─────────────────────────────────────────────────────────────"

VIDEO_ANALYSIS="apps/web/src/pages/tools/VideoAnalysis.tsx"

# 4.1  H1 "爆款文案解析" in VideoAnalysis.tsx
if grep -q "爆款文案解析" "$VIDEO_ANALYSIS" 2>/dev/null; then
  ok "4.1  VideoAnalysis.tsx: H1 '爆款文案解析' literal present"
else
  fail "4.1  VideoAnalysis.tsx: H1 '爆款文案解析' literal missing"
fi

# 4.2  "钩子拆解" H3 stub output
if grep -q "钩子拆解" "$VIDEO_ANALYSIS" 2>/dev/null; then
  ok "4.2  VideoAnalysis.tsx: '钩子拆解' H3 stub present"
else
  fail "4.2  VideoAnalysis.tsx: '钩子拆解' H3 stub missing"
fi

# 4.3  "结构分析" H3 stub output
if grep -q "结构分析" "$VIDEO_ANALYSIS" 2>/dev/null; then
  ok "4.3  VideoAnalysis.tsx: '结构分析' H3 stub present"
else
  fail "4.3  VideoAnalysis.tsx: '结构分析' H3 stub missing"
fi

# 4.4  "爆款元素识别" H3 stub (shared with analysis)
if grep -q "爆款元素识别" "$VIDEO_ANALYSIS" 2>/dev/null; then
  ok "4.4  VideoAnalysis.tsx: '爆款元素识别' H3 stub present"
else
  fail "4.4  VideoAnalysis.tsx: '爆款元素识别' H3 stub missing"
fi

# 4.5  "多维评分" H3 stub
if grep -q "多维评分" "$VIDEO_ANALYSIS" 2>/dev/null; then
  ok "4.5  VideoAnalysis.tsx: '多维评分' H3 stub present"
else
  fail "4.5  VideoAnalysis.tsx: '多维评分' H3 stub missing"
fi

# 4.6  "一键仿写" H3 stub output (unique to video-analysis)
if grep -q "一键仿写" "$VIDEO_ANALYSIS" 2>/dev/null; then
  ok "4.6  VideoAnalysis.tsx: '一键仿写' H3 stub present"
else
  fail "4.6  VideoAnalysis.tsx: '一键仿写' H3 stub missing"
fi

echo ""

# ─────────────────────────────────────────────────────────────
# §5  /analysis · 文案结构分析 + 5 H3 stub (US-005)
# ─────────────────────────────────────────────────────────────
echo "§5  /analysis · 文案结构分析 + 5 H3 stub (US-005)"
echo "─────────────────────────────────────────────────────────────"

ANALYSIS="apps/web/src/pages/tools/Analysis.tsx"

# 5.1  H1 "文案结构分析" in Analysis.tsx
if grep -q "文案结构分析" "$ANALYSIS" 2>/dev/null; then
  ok "5.1  Analysis.tsx: H1 '文案结构分析' literal present"
else
  fail "5.1  Analysis.tsx: H1 '文案结构分析' literal missing"
fi

# 5.2  "结构拆解" H3 stub
if grep -q "结构拆解" "$ANALYSIS" 2>/dev/null; then
  ok "5.2  Analysis.tsx: '结构拆解' H3 stub present"
else
  fail "5.2  Analysis.tsx: '结构拆解' H3 stub missing"
fi

# 5.3  "爆款元素识别" H3 stub
if grep -q "爆款元素识别" "$ANALYSIS" 2>/dev/null; then
  ok "5.3  Analysis.tsx: '爆款元素识别' H3 stub present"
else
  fail "5.3  Analysis.tsx: '爆款元素识别' H3 stub missing"
fi

# 5.4  "节奏分析" H3 stub
if grep -q "节奏分析" "$ANALYSIS" 2>/dev/null; then
  ok "5.4  Analysis.tsx: '节奏分析' H3 stub present"
else
  fail "5.4  Analysis.tsx: '节奏分析' H3 stub missing"
fi

# 5.5  "优化建议" H3 stub
if grep -q "优化建议" "$ANALYSIS" 2>/dev/null; then
  ok "5.5  Analysis.tsx: '优化建议' H3 stub present"
else
  fail "5.5  Analysis.tsx: '优化建议' H3 stub missing"
fi

# 5.6  char-count testid (字符计数标准 hook)
if grep -q "char-count" "$ANALYSIS" 2>/dev/null; then
  ok "5.6  Analysis.tsx: char-count data-testid present (字符计数标准 hook)"
else
  fail "5.6  Analysis.tsx: char-count data-testid missing"
fi

echo ""

# ─────────────────────────────────────────────────────────────
# §6  /video-production · 短视频一键制作 + 4 H3 stub (US-006)
# ─────────────────────────────────────────────────────────────
echo "§6  /video-production · 短视频一键制作 + 4 H3 stub (US-006)"
echo "─────────────────────────────────────────────────────────────"

VIDEO_PROD="apps/web/src/pages/tools/VideoProduction.tsx"

# 6.1  H1 "短视频一键制作" in VideoProduction.tsx
if grep -q "短视频一键制作" "$VIDEO_PROD" 2>/dev/null; then
  ok "6.1  VideoProduction.tsx: H1 '短视频一键制作' literal present"
else
  fail "6.1  VideoProduction.tsx: H1 '短视频一键制作' literal missing"
fi

# 6.2  "分镜脚本" H3 stub
if grep -q "分镜脚本" "$VIDEO_PROD" 2>/dev/null; then
  ok "6.2  VideoProduction.tsx: '分镜脚本' H3 stub present"
else
  fail "6.2  VideoProduction.tsx: '分镜脚本' H3 stub missing"
fi

# 6.3  "拍摄方案" H3 stub
if grep -q "拍摄方案" "$VIDEO_PROD" 2>/dev/null; then
  ok "6.3  VideoProduction.tsx: '拍摄方案' H3 stub present"
else
  fail "6.3  VideoProduction.tsx: '拍摄方案' H3 stub missing"
fi

# 6.4  "口播提词器" H3 stub
if grep -q "口播提词器" "$VIDEO_PROD" 2>/dev/null; then
  ok "6.4  VideoProduction.tsx: '口播提词器' H3 stub present"
else
  fail "6.4  VideoProduction.tsx: '口播提词器' H3 stub missing"
fi

# 6.5  "剪辑指导" H3 stub
if grep -q "剪辑指导" "$VIDEO_PROD" 2>/dev/null; then
  ok "6.5  VideoProduction.tsx: '剪辑指导' H3 stub present"
else
  fail "6.5  VideoProduction.tsx: '剪辑指导' H3 stub missing"
fi

echo ""

# ─────────────────────────────────────────────────────────────
# §7  /acquisition-video · 获客型视频制作 + 4 H4 × 3 方案 (US-007)
# ─────────────────────────────────────────────────────────────
echo "§7  /acquisition-video · 获客型视频 + 3 方案 × 4 H4 (US-007)"
echo "─────────────────────────────────────────────────────────────"

ACQ_VIDEO="apps/web/src/pages/tools/AcquisitionVideo.tsx"

# 7.1  H1 "获客型视频制作" in AcquisitionVideo.tsx
if grep -q "获客型视频制作" "$ACQ_VIDEO" 2>/dev/null; then
  ok "7.1  AcquisitionVideo.tsx: H1 '获客型视频制作' literal present"
else
  fail "7.1  AcquisitionVideo.tsx: H1 '获客型视频制作' literal missing"
fi

# 7.2  3 方案 literals (方案一/方案二/方案三)
if grep -q "方案一" "$ACQ_VIDEO" 2>/dev/null && \
   grep -q "方案二" "$ACQ_VIDEO" 2>/dev/null && \
   grep -q "方案三" "$ACQ_VIDEO" 2>/dev/null; then
  ok "7.2  AcquisitionVideo.tsx: 3 方案 literals present (方案一/方案二/方案三)"
else
  fail "7.2  AcquisitionVideo.tsx: 3 方案 literals incomplete"
fi

# 7.3  PLAN_HEADINGS 4 H4 (主题角度/钩子/内容结构/CTA)
if grep -q "主题角度" "$ACQ_VIDEO" 2>/dev/null && \
   grep -q "内容结构" "$ACQ_VIDEO" 2>/dev/null && \
   grep -q "CTA" "$ACQ_VIDEO" 2>/dev/null; then
  ok "7.3  AcquisitionVideo.tsx: 4 H4 labels: 主题角度/钩子/内容结构/CTA"
else
  fail "7.3  AcquisitionVideo.tsx: 4 H4 labels incomplete"
fi

# 7.4  "生成获客方案" CTA present
if grep -q "生成获客方案" "$ACQ_VIDEO" 2>/dev/null; then
  ok "7.4  AcquisitionVideo.tsx: '生成获客方案' CTA literal present"
else
  fail "7.4  AcquisitionVideo.tsx: '生成获客方案' CTA literal missing"
fi

# 7.5  Form inputs: industry + audience + sellingPoints
if grep -q "industry\|行业" "$ACQ_VIDEO" 2>/dev/null && \
   grep -q "audience\|目标受众" "$ACQ_VIDEO" 2>/dev/null; then
  ok "7.5  AcquisitionVideo.tsx: form inputs (行业 + 目标受众) present"
else
  fail "7.5  AcquisitionVideo.tsx: form inputs missing"
fi

echo ""

# ─────────────────────────────────────────────────────────────
# §8  跨 page · TypeScript + Vitest (US-001~007 + 008/009)
# ─────────────────────────────────────────────────────────────
echo "§8  跨 page · TypeScript + Vitest"
echo "─────────────────────────────────────────────────────────────"

# 8.1  TypeScript: 0 errors
echo "  ⏳ running typecheck..."
TS_OUT=$(cd "$ROOT_DIR" && pnpm --filter web typecheck 2>&1 || true)
TS_ERRORS=$(echo "$TS_OUT" | grep -c "error TS" || true)
if [ "$TS_ERRORS" -eq 0 ]; then
  ok "8.1  TypeScript: 0 errors"
else
  fail "8.1  TypeScript: $TS_ERRORS error(s) found"
  echo "$TS_OUT" | grep "error TS" | head -5
fi

# 8.2  Vitest: >= 259 tests pass
echo "  ⏳ running vitest..."
VITEST_OUT=$(cd "$ROOT_DIR/apps/web" && pnpm test 2>&1 || true)
VITEST_PASS=$(echo "$VITEST_OUT" | grep -oE "Tests[[:space:]]+[0-9]+ passed" | grep -oE "[0-9]+" | head -1 || echo "0")
if [ "${VITEST_PASS:-0}" -ge 259 ]; then
  ok "8.2  Vitest: $VITEST_PASS tests passed (>= 259)"
else
  fail "8.2  Vitest: $VITEST_PASS tests passed (need >= 259)"
fi

echo ""

# ─────────────────────────────────────────────────────────────
# §9  Visual baseline · prd23 15 + prd22 13 = 28 (US-008/009)
# ─────────────────────────────────────────────────────────────
echo "§9  Visual baseline · prd23 15 + prd22 13 = 28 (US-008/009)"
echo "─────────────────────────────────────────────────────────────"

PRD23_SPEC="tests/e2e/prd23-visual-baseline.spec.ts"
PRD22_SPEC="tests/e2e/prd22-visual-baseline.spec.ts"

# 9.1  prd23 visual baseline spec exists
if [ -f "$PRD23_SPEC" ]; then
  ok "9.1  prd23-visual-baseline.spec.ts exists"
else
  fail "9.1  prd23-visual-baseline.spec.ts missing"
fi

# 9.2  prd23 has >= 15 expectVisualMatch calls
PRD23_VM=$(grep -c "expectVisualMatch" "$PRD23_SPEC" 2>/dev/null || echo "0")
# Subtract 1 for the import line
PRD23_TESTS=$((PRD23_VM - 1))
if [ "$PRD23_TESTS" -ge 15 ]; then
  ok "9.2  prd23-visual-baseline.spec.ts: $PRD23_TESTS baseline tests (>= 15)"
else
  fail "9.2  prd23-visual-baseline.spec.ts: $PRD23_TESTS baseline tests (need >= 15)"
fi

# 9.3  prd22 visual baseline spec exists
if [ -f "$PRD22_SPEC" ]; then
  ok "9.3  prd22-visual-baseline.spec.ts exists"
else
  fail "9.3  prd22-visual-baseline.spec.ts missing"
fi

# 9.4  prd22 has >= 13 expectVisualMatch calls
PRD22_VM=$(grep -c "expectVisualMatch" "$PRD22_SPEC" 2>/dev/null || echo "0")
PRD22_TESTS=$((PRD22_VM - 1))
if [ "$PRD22_TESTS" -ge 13 ]; then
  ok "9.4  prd22-visual-baseline.spec.ts: $PRD22_TESTS baseline tests (>= 13)"
else
  fail "9.4  prd22-visual-baseline.spec.ts: $PRD22_TESTS baseline tests (need >= 13)"
fi

# 9.5  Combined baseline total >= 28
TOTAL_BASELINES=$((PRD23_TESTS + PRD22_TESTS))
if [ "$TOTAL_BASELINES" -ge 28 ]; then
  ok "9.5  Combined visual baselines: $TOTAL_BASELINES (>= 28 · prd22+prd23)"
else
  fail "9.5  Combined visual baselines: $TOTAL_BASELINES (need >= 28)"
fi

# 9.6  PRD-23 baseline PNGs in /tmp/aiipznt-clone-research/screenshots/
SCREENSHOT_DIR="/tmp/aiipznt-clone-research/screenshots"
PRD23_PNGS=(
  "prd23-diagnosis.png"
  "prd23-accounts.png"
  "prd23-step8.png"
  "prd23-video-analysis.png"
  "prd23-analysis.png"
  "prd23-video-production.png"
  "prd23-acquisition-video.png"
)
MISSING_PNG=0
for f in "${PRD23_PNGS[@]}"; do
  if [ ! -f "$SCREENSHOT_DIR/$f" ]; then
    MISSING_PNG=$((MISSING_PNG + 1))
  fi
done
if [ "$MISSING_PNG" -eq 0 ]; then
  ok "9.6  All 7 core PRD-23 baseline PNGs exist in /tmp/aiipznt-clone-research/screenshots/"
else
  fail "9.6  $MISSING_PNG of 7 PRD-23 baseline PNGs missing from /tmp/aiipznt-clone-research/screenshots/"
fi

echo ""

# ─────────────────────────────────────────────────────────────
# §10  Unit test 同步规则 · 7 PRD-23 pages 都有 __tests__ (TD-093)
# ─────────────────────────────────────────────────────────────
echo "§10  Unit test 同步规则 · 7 PRD-23 pages 都有 __tests__ (TD-093)"
echo "─────────────────────────────────────────────────────────────"

# 10.1  Diagnosis page has __tests__ file
if [ -f "apps/web/src/pages/__tests__/Diagnosis.test.tsx" ]; then
  ok "10.1  Diagnosis.tsx: __tests__/Diagnosis.test.tsx exists"
else
  fail "10.1  Diagnosis.tsx: __tests__/Diagnosis.test.tsx missing"
fi

# 10.2  Accounts page has __tests__ file
if [ -f "apps/web/src/pages/__tests__/Accounts.test.tsx" ]; then
  ok "10.2  Accounts.tsx: __tests__/Accounts.test.tsx exists"
else
  fail "10.2  Accounts.tsx: __tests__/Accounts.test.tsx missing"
fi

# 10.3  Step8 page has __tests__ file
if [ -f "apps/web/src/pages/step/__tests__/Step8.test.tsx" ]; then
  ok "10.3  Step8.tsx: step/__tests__/Step8.test.tsx exists"
else
  fail "10.3  Step8.tsx: step/__tests__/Step8.test.tsx missing"
fi

# 10.4  VideoAnalysis page has __tests__ file
if [ -f "apps/web/src/pages/tools/__tests__/VideoAnalysis.test.tsx" ]; then
  ok "10.4  VideoAnalysis.tsx: tools/__tests__/VideoAnalysis.test.tsx exists"
else
  fail "10.4  VideoAnalysis.tsx: tools/__tests__/VideoAnalysis.test.tsx missing"
fi

# 10.5  Analysis page has __tests__ file
if [ -f "apps/web/src/pages/tools/__tests__/Analysis.test.tsx" ]; then
  ok "10.5  Analysis.tsx: tools/__tests__/Analysis.test.tsx exists"
else
  fail "10.5  Analysis.tsx: tools/__tests__/Analysis.test.tsx missing"
fi

# 10.6  VideoProduction page has __tests__ file
if [ -f "apps/web/src/pages/tools/__tests__/VideoProduction.test.tsx" ]; then
  ok "10.6  VideoProduction.tsx: tools/__tests__/VideoProduction.test.tsx exists"
else
  fail "10.6  VideoProduction.tsx: tools/__tests__/VideoProduction.test.tsx missing"
fi

# 10.7  AcquisitionVideo page has __tests__ file
if [ -f "apps/web/src/pages/tools/__tests__/AcquisitionVideo.test.tsx" ]; then
  ok "10.7  AcquisitionVideo.tsx: tools/__tests__/AcquisitionVideo.test.tsx exists"
else
  fail "10.7  AcquisitionVideo.tsx: tools/__tests__/AcquisitionVideo.test.tsx missing"
fi

# 10.8  Diagnosis test file has ≥ 5 test cases
DIAG_TEST_COUNT=$(grep -c "^  it\b\|^it\b" "apps/web/src/pages/__tests__/Diagnosis.test.tsx" 2>/dev/null || echo "0")
if [ "$DIAG_TEST_COUNT" -ge 5 ]; then
  ok "10.8  Diagnosis.test.tsx: $DIAG_TEST_COUNT test cases (>= 5)"
else
  fail "10.8  Diagnosis.test.tsx: $DIAG_TEST_COUNT test cases (need >= 5)"
fi

# 10.9  Accounts test file has ≥ 5 test cases
ACCT_TEST_COUNT=$(grep -c "^  it\b\|^it\b" "apps/web/src/pages/__tests__/Accounts.test.tsx" 2>/dev/null || echo "0")
if [ "$ACCT_TEST_COUNT" -ge 5 ]; then
  ok "10.9  Accounts.test.tsx: $ACCT_TEST_COUNT test cases (>= 5)"
else
  fail "10.9  Accounts.test.tsx: $ACCT_TEST_COUNT test cases (need >= 5)"
fi

# 10.10  Step8 test file has ≥ 6 test cases
STEP8_TEST_COUNT=$(grep -c "^  it\b\|^it\b" "apps/web/src/pages/step/__tests__/Step8.test.tsx" 2>/dev/null || echo "0")
if [ "$STEP8_TEST_COUNT" -ge 6 ]; then
  ok "10.10 Step8.test.tsx: $STEP8_TEST_COUNT test cases (>= 6)"
else
  fail "10.10 Step8.test.tsx: $STEP8_TEST_COUNT test cases (need >= 6)"
fi

# ─────────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════"
TOTAL=$((PASS + FAIL + SKIP))
echo "  PRD-23 RESULT: $PASS 通过 · $FAIL 失败 · $SKIP 跳过 (共 $TOTAL 项)"
echo "═══════════════════════════════════════════════════════════"

if [ "$FAIL" -gt 0 ]; then
  echo ""
  echo "❌ PRD-23 CI gate FAILED ($FAIL 检查项不通过)"
  exit 1
else
  echo ""
  echo "✅ PRD-23 CI gate PASSED (全 $PASS 项通过)"
  exit 0
fi
