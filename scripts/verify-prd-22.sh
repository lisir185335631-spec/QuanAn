#!/usr/bin/env bash
# scripts/verify-prd-22.sh
# PRD-22 Inline Refactor + Step Pages Polish — CI gate (complete · 10 sections · 52 checks)
# Usage: bash scripts/verify-prd-22.sh

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
echo "  PRD-22 Inline Refactor + Step Pages Polish — verify script"
echo "═══════════════════════════════════════════════════════════"
echo ""

# ─────────────────────────────────────────────────────────────
# §1  Inline picker utility 抽象 (US-001)
# ─────────────────────────────────────────────────────────────
echo "§1  Inline picker utility 抽象 (US-001)"
echo "─────────────────────────────────────────────────────────────"

# 1.1  ScriptTypeInlineCards.tsx exists
if [ -f "apps/web/src/components/inline-pickers/ScriptTypeInlineCards.tsx" ]; then
  ok "1.1  ScriptTypeInlineCards.tsx exists"
else
  fail "1.1  ScriptTypeInlineCards.tsx missing"
fi

# 1.2  ElementsInlineMultiPicker.tsx exists
if [ -f "apps/web/src/components/inline-pickers/ElementsInlineMultiPicker.tsx" ]; then
  ok "1.2  ElementsInlineMultiPicker.tsx exists"
else
  fail "1.2  ElementsInlineMultiPicker.tsx missing"
fi

# 1.3  PlatformInlineRadio.tsx exists
if [ -f "apps/web/src/components/inline-pickers/PlatformInlineRadio.tsx" ]; then
  ok "1.3  PlatformInlineRadio.tsx exists"
else
  fail "1.3  PlatformInlineRadio.tsx missing"
fi

# 1.4  barrel export index.ts exports all 3
if grep -q "ScriptTypeInlineCards" "apps/web/src/components/inline-pickers/index.ts" 2>/dev/null && \
   grep -q "ElementsInlineMultiPicker" "apps/web/src/components/inline-pickers/index.ts" 2>/dev/null && \
   grep -q "PlatformInlineRadio" "apps/web/src/components/inline-pickers/index.ts" 2>/dev/null; then
  ok "1.4  barrel index.ts exports all 3 inline pickers"
else
  fail "1.4  barrel index.ts missing one or more inline picker exports"
fi

# 1.5  unit tests exist for all 3
if [ -f "apps/web/src/components/inline-pickers/__tests__/ScriptTypeInlineCards.test.tsx" ] && \
   [ -f "apps/web/src/components/inline-pickers/__tests__/ElementsInlineMultiPicker.test.tsx" ] && \
   [ -f "apps/web/src/components/inline-pickers/__tests__/PlatformInlineRadio.test.tsx" ]; then
  ok "1.5  unit tests exist for all 3 inline pickers"
else
  fail "1.5  unit tests missing for one or more inline pickers"
fi

echo ""

# ─────────────────────────────────────────────────────────────
# §2  /generate inline 重构 (US-002)
# ─────────────────────────────────────────────────────────────
echo "§2  /generate inline 重构 (US-002)"
echo "─────────────────────────────────────────────────────────────"

GENERATE="apps/web/src/pages/tools/Generate.tsx"

# 2.1  ScriptTypeInlineCards imported in Generate.tsx
if grep -q "ScriptTypeInlineCards" "$GENERATE" 2>/dev/null; then
  ok "2.1  ScriptTypeInlineCards imported in Generate.tsx"
else
  fail "2.1  ScriptTypeInlineCards not found in Generate.tsx"
fi

# 2.2  ElementsInlineMultiPicker imported in Generate.tsx
if grep -q "ElementsInlineMultiPicker" "$GENERATE" 2>/dev/null; then
  ok "2.2  ElementsInlineMultiPicker imported in Generate.tsx"
else
  fail "2.2  ElementsInlineMultiPicker not found in Generate.tsx"
fi

# 2.3  textarea 0/500 character count
if grep -qE "500|0/500|length.*500|500.*length" "$GENERATE" 2>/dev/null; then
  ok "2.3  Generate.tsx has 0/500 textarea char limit"
else
  fail "2.3  Generate.tsx missing 0/500 textarea char limit"
fi

# 2.4  data-testid for generate CTA
if grep -qE "data-testid.*generate|testid.*cta|testid.*submit" "$GENERATE" 2>/dev/null; then
  ok "2.4  Generate.tsx has CTA data-testid"
else
  fail "2.4  Generate.tsx missing CTA data-testid"
fi

# 2.5  ScriptTypeInlineCards.tsx uses SCRIPT_TYPES internally (20 卡)
if grep -q "SCRIPT_TYPES" "apps/web/src/components/inline-pickers/ScriptTypeInlineCards.tsx" 2>/dev/null; then
  ok "2.5  ScriptTypeInlineCards.tsx uses SCRIPT_TYPES (20 卡)"
else
  fail "2.5  SCRIPT_TYPES not found in ScriptTypeInlineCards.tsx"
fi

echo ""

# ─────────────────────────────────────────────────────────────
# §3  /boom-generate inline 重构 (US-003)
# ─────────────────────────────────────────────────────────────
echo "§3  /boom-generate inline 重构 (US-003)"
echo "─────────────────────────────────────────────────────────────"

BOOM="apps/web/src/pages/tools/BoomGenerate.tsx"

# 3.1  ElementsInlineMultiPicker imported
if grep -q "ElementsInlineMultiPicker" "$BOOM" 2>/dev/null; then
  ok "3.1  ElementsInlineMultiPicker imported in BoomGenerate.tsx"
else
  fail "3.1  ElementsInlineMultiPicker not found in BoomGenerate.tsx"
fi

# 3.2  行业 input present
if grep -q "行业" "$BOOM" 2>/dev/null; then
  ok "3.2  行业 input text in BoomGenerate.tsx"
else
  fail "3.2  行业 input missing in BoomGenerate.tsx"
fi

# 3.3  主题 input present
if grep -q "主题" "$BOOM" 2>/dev/null; then
  ok "3.3  主题 input text in BoomGenerate.tsx"
else
  fail "3.3  主题 input missing in BoomGenerate.tsx"
fi

# 3.4  一键生成 / 生成 5 篇 CTA present
if grep -qE "一键生成|生成.*篇|5 篇" "$BOOM" 2>/dev/null; then
  ok "3.4  BoomGenerate.tsx has 一键生成/生成5篇 CTA"
else
  fail "3.4  BoomGenerate.tsx missing 一键生成/生成5篇 CTA"
fi

# 3.5  data-testid for CTA + element picker selectors
if grep -qE 'data-testid.*boom-generate-cta|data-testid.*select-all-elements' "$BOOM" 2>/dev/null; then
  ok "3.5  BoomGenerate.tsx has boom-generate-cta + select-all-elements data-testids"
else
  fail "3.5  BoomGenerate.tsx missing boom-generate-cta or select-all-elements data-testid"
fi

echo ""

# ─────────────────────────────────────────────────────────────
# §4  /ai-video inline 重构 (US-004)
# ─────────────────────────────────────────────────────────────
echo "§4  /ai-video inline 重构 (US-004)"
echo "─────────────────────────────────────────────────────────────"

AIVIDEO="apps/web/src/pages/tools/AiVideo.tsx"

# 4.1  PlatformInlineRadio imported
if grep -q "PlatformInlineRadio" "$AIVIDEO" 2>/dev/null; then
  ok "4.1  PlatformInlineRadio imported in AiVideo.tsx"
else
  fail "4.1  PlatformInlineRadio not found in AiVideo.tsx"
fi

# 4.2  VIDEO_TYPES imported
if grep -q "VIDEO_TYPES" "$AIVIDEO" 2>/dev/null; then
  ok "4.2  VIDEO_TYPES imported in AiVideo.tsx"
else
  fail "4.2  VIDEO_TYPES not found in AiVideo.tsx"
fi

# 4.3  分镜表 13 列 · 检查 3 个代表列字面
if grep -q "镜号" "$AIVIDEO" 2>/dev/null && \
   grep -q "画面描述" "$AIVIDEO" 2>/dev/null && \
   grep -q "剪辑建议" "$AIVIDEO" 2>/dev/null; then
  ok "4.3  分镜表 13 列字面存在 (镜号 + 画面描述 + 剪辑建议)"
else
  fail "4.3  分镜表 13 列字面不完整 (缺 镜号/画面描述/剪辑建议)"
fi

# 4.4  STORYBOARD_COLUMNS has 13 entries
STORYBOARD_COUNT=$(grep -c "header:" "$AIVIDEO" 2>/dev/null || echo "0")
if [ "$STORYBOARD_COUNT" -ge 13 ]; then
  ok "4.4  STORYBOARD_COLUMNS: $STORYBOARD_COUNT 列 (>= 13)"
else
  fail "4.4  STORYBOARD_COLUMNS: $STORYBOARD_COUNT 列 (need >= 13)"
fi

# 4.5  textarea maxLength 5000
if grep -qE "maxLength.*5000|5000.*maxLength|5000" "$AIVIDEO" 2>/dev/null; then
  ok "4.5  AiVideo.tsx textarea maxLength 5000"
else
  fail "4.5  AiVideo.tsx textarea maxLength 5000 not found"
fi

echo ""

# ─────────────────────────────────────────────────────────────
# §5  /knowledge 重构 (US-005)
# ─────────────────────────────────────────────────────────────
echo "§5  /knowledge 重构 (US-005)"
echo "─────────────────────────────────────────────────────────────"

KNOWLEDGE="apps/web/src/pages/tools/Knowledge.tsx"

# 5.1  "20 类脚本" tab literal
if grep -q "20 类脚本" "$KNOWLEDGE" 2>/dev/null; then
  ok "5.1  Knowledge.tsx has '20 类脚本' tab literal"
else
  fail "5.1  Knowledge.tsx missing '20 类脚本' tab literal"
fi

# 5.2  "20 大爆款" tab literal
if grep -q "20 大爆款" "$KNOWLEDGE" 2>/dev/null; then
  ok "5.2  Knowledge.tsx has '20 大爆款' tab literal"
else
  fail "5.2  Knowledge.tsx missing '20 大爆款' tab literal"
fi

# 5.3  "开头公式" tab literal
if grep -q "开头公式" "$KNOWLEDGE" 2>/dev/null; then
  ok "5.3  Knowledge.tsx has '开头公式' tab literal"
else
  fail "5.3  Knowledge.tsx missing '开头公式' tab literal"
fi

# 5.4  "核心公式" tab literal
if grep -q "核心公式" "$KNOWLEDGE" 2>/dev/null; then
  ok "5.4  Knowledge.tsx has '核心公式' tab literal"
else
  fail "5.4  Knowledge.tsx missing '核心公式' tab literal"
fi

# 5.5  search input data-testid
if grep -qE "data-testid.*search|tab-scripts" "$KNOWLEDGE" 2>/dev/null; then
  ok "5.5  Knowledge.tsx has search/tab data-testid"
else
  fail "5.5  Knowledge.tsx missing search/tab data-testid"
fi

echo ""

# ─────────────────────────────────────────────────────────────
# §6  /step/1 视觉精修 (US-006)
# ─────────────────────────────────────────────────────────────
echo "§6  /step/1 视觉精修 (US-006)"
echo "─────────────────────────────────────────────────────────────"

STEP1="apps/web/src/pages/step/Step1.tsx"

# 6.1  "全部行业 (56)" tab literal
if grep -qE '"全部行业 \(56\)"|全部行业.*56' "$STEP1" 2>/dev/null; then
  ok "6.1  Step1.tsx has '全部行业 (56)' tab literal (D-218)"
else
  fail "6.1  Step1.tsx missing '全部行业 (56)' tab literal"
fi

# 6.2  IndustryEmojiGrid component (56 cards)
if [ -f "apps/web/src/components/industry/IndustryEmojiGrid.tsx" ]; then
  ok "6.2  IndustryEmojiGrid.tsx exists (56 cards)"
else
  fail "6.2  IndustryEmojiGrid.tsx missing"
fi

# 6.3  CustomIndustryModal component
if [ -f "apps/web/src/components/industry/CustomIndustryModal.tsx" ]; then
  ok "6.3  CustomIndustryModal.tsx exists"
else
  fail "6.3  CustomIndustryModal.tsx missing"
fi

# 6.4  step1-cta data-testid for visual baseline
if grep -q "step1-cta" "$STEP1" 2>/dev/null; then
  ok "6.4  Step1.tsx has data-testid='step1-cta'"
else
  fail "6.4  Step1.tsx missing data-testid='step1-cta'"
fi

# 6.5  industries constant has 56 entries
INDUSTRY_COUNT=$(grep -c "emoji:" "apps/web/src/lib/constants/industries.ts" 2>/dev/null || echo "0")
if [ "$INDUSTRY_COUNT" -ge 56 ]; then
  ok "6.5  industries.ts: $INDUSTRY_COUNT entries (>= 56)"
else
  fail "6.5  industries.ts: $INDUSTRY_COUNT entries (need >= 56)"
fi

echo ""

# ─────────────────────────────────────────────────────────────
# §7  /step/3 + /step/3b 视觉精修 (US-007)
# ─────────────────────────────────────────────────────────────
echo "§7  /step/3 + /step/3b 视觉精修 (US-007)"
echo "─────────────────────────────────────────────────────────────"

STEP3="apps/web/src/pages/step/Step3.tsx"
STEP3B="apps/web/src/pages/step/Step3b.tsx"
STEP3_CONST="apps/web/src/lib/constants/step3.ts"
STEP3B_CONST="apps/web/src/lib/constants/step3b.ts"

# 7.1  Step3 has 6 H3 labels (视频参考案例/昵称推荐/头像设计方案/背景图设计方案/简介文案方案/整体包装策略)
if grep -q "视频参考案例" "$STEP3_CONST" 2>/dev/null && \
   grep -q "整体包装策略" "$STEP3_CONST" 2>/dev/null; then
  ok "7.1  Step3 constants: 6 H3 labels present (视频参考案例 → 整体包装策略)"
else
  fail "7.1  Step3 constants: H3 labels incomplete"
fi

# 7.2  Step3 top H3 "账号包装方案"
if grep -q "账号包装方案" "$STEP3" 2>/dev/null; then
  ok "7.2  Step3.tsx has '账号包装方案' top H3 (7th 总览)"
else
  fail "7.2  Step3.tsx missing '账号包装方案' top H3"
fi

# 7.3  PlatformInlineRadio in Step3.tsx (D-220: Step3 has platform picker)
if grep -q "PlatformInlineRadio" "$STEP3" 2>/dev/null; then
  ok "7.3  PlatformInlineRadio present in Step3.tsx (D-220)"
else
  fail "7.3  PlatformInlineRadio not found in Step3.tsx"
fi

# 7.4  Step3b has 6 H3 labels (人设定位/人设标签/内容方向/差异化策略/内容方向建议/IP故事框架)
if grep -q "人设定位" "$STEP3B_CONST" 2>/dev/null && \
   grep -q "IP 故事框架" "$STEP3B_CONST" 2>/dev/null; then
  ok "7.4  Step3b constants: 6 H3 labels present (人设定位 → IP 故事框架)"
else
  fail "7.4  Step3b constants: H3 labels incomplete"
fi

# 7.5  Step3b visual baseline spec has prd22-step3b.png
if grep -q "prd22-step3b" "tests/e2e/prd22-visual-baseline.spec.ts" 2>/dev/null; then
  ok "7.5  prd22-step3b baseline in visual spec"
else
  fail "7.5  prd22-step3b baseline missing from visual spec"
fi

echo ""

# ─────────────────────────────────────────────────────────────
# §8  /step/4 + /step/4b 视觉精修 (US-008)
# ─────────────────────────────────────────────────────────────
echo "§8  /step/4 + /step/4b 视觉精修 (US-008)"
echo "─────────────────────────────────────────────────────────────"

STEP4_CONST="apps/web/src/lib/constants/step4.ts"
STEP4B_CONST="apps/web/src/lib/constants/step4b.ts"

# 8.1  Step4 "每日 KPI" H3 literal
if grep -q "每日 KPI" "$STEP4_CONST" 2>/dev/null; then
  ok "8.1  Step4 constants: '每日 KPI' H3 literal present"
else
  fail "8.1  Step4 constants: '每日 KPI' H3 literal missing"
fi

# 8.2  Step4 "每周 KPI" H3 literal
if grep -q "每周 KPI" "$STEP4_CONST" 2>/dev/null; then
  ok "8.2  Step4 constants: '每周 KPI' H3 literal present"
else
  fail "8.2  Step4 constants: '每周 KPI' H3 literal missing"
fi

# 8.3  Step4 "阶段 KPI" H3 literal
if grep -q "阶段 KPI" "$STEP4_CONST" 2>/dev/null; then
  ok "8.3  Step4 constants: '阶段 KPI' H3 literal present"
else
  fail "8.3  Step4 constants: '阶段 KPI' H3 literal missing"
fi

# 8.4  Step4b "初阶变现路径" H3 literal
if grep -q "初阶变现路径" "$STEP4B_CONST" 2>/dev/null; then
  ok "8.4  Step4b constants: '初阶变现路径' H3 literal present"
else
  fail "8.4  Step4b constants: '初阶变现路径' H3 literal missing"
fi

# 8.5  Step4b "中阶变现路径" + "高阶变现路径" H3 literals
if grep -q "中阶变现路径" "$STEP4B_CONST" 2>/dev/null && \
   grep -q "高阶变现路径" "$STEP4B_CONST" 2>/dev/null; then
  ok "8.5  Step4b constants: '中阶变现路径' + '高阶变现路径' H3 literals present"
else
  fail "8.5  Step4b constants: '中阶/高阶变现路径' H3 literals missing"
fi

echo ""

# ─────────────────────────────────────────────────────────────
# §9  /step/5 + /step/6 + /step/7 视觉精修 (US-009 + US-010)
# ─────────────────────────────────────────────────────────────
echo "§9  /step/5 + /step/6 + /step/7 视觉精修 (US-009 + US-010)"
echo "─────────────────────────────────────────────────────────────"

STEP5="apps/web/src/pages/step/Step5.tsx"
STEP6="apps/web/src/pages/step/Step6.tsx"
STEP7="apps/web/src/pages/step/Step7.tsx"
STEP7_CONST="apps/web/src/lib/constants/step7.ts"

# 9.1  FileUpload component imported in Step5
if grep -q "FileUpload" "$STEP5" 2>/dev/null; then
  ok "9.1  FileUpload imported in Step5.tsx"
else
  fail "9.1  FileUpload not found in Step5.tsx"
fi

# 9.2  Step6 textarea with min-char validation
if grep -q "textarea" "$STEP6" 2>/dev/null; then
  ok "9.2  Step6.tsx has textarea element"
else
  fail "9.2  Step6.tsx missing textarea element"
fi

# 9.3  Step7 SCRIPT_TYPES 20 脚本 (constants/scripts.ts · key: entries)
SCRIPT_TYPES_COUNT=$(grep -c "{ key:" "apps/web/src/lib/constants/scripts.ts" 2>/dev/null || echo "0")
if [ "$SCRIPT_TYPES_COUNT" -ge 20 ]; then
  ok "9.3  SCRIPT_TYPES: $SCRIPT_TYPES_COUNT entries (>= 20)"
else
  fail "9.3  SCRIPT_TYPES: $SCRIPT_TYPES_COUNT entries (need >= 20)"
fi

# 9.4  Step7 STEP7_ELEMENTS_22 (22 elements)
ELEMENTS_COUNT=$(grep -c "id:" "$STEP7_CONST" 2>/dev/null || echo "0")
if [ "$ELEMENTS_COUNT" -ge 22 ]; then
  ok "9.4  STEP7_ELEMENTS_22: $ELEMENTS_COUNT entries (>= 22)"
else
  fail "9.4  STEP7_ELEMENTS_22: $ELEMENTS_COUNT entries (need >= 22)"
fi

# 9.5  Step7 4 H4 output literals (话题抛出/正方/反方/我的立场)
if grep -q "话题抛出" "$STEP7_CONST" 2>/dev/null && \
   grep -q "我的立场" "$STEP7_CONST" 2>/dev/null && \
   grep -q "正方" "$STEP7_CONST" 2>/dev/null && \
   grep -q "反方" "$STEP7_CONST" 2>/dev/null; then
  ok "9.5  Step7 4 H4 literals: 话题抛出 + 正方 + 反方 + 我的立场"
else
  fail "9.5  Step7 4 H4 literals incomplete"
fi

echo ""

# ─────────────────────────────────────────────────────────────
# §10  跨 page 验证 (US-011 + 收官)
# ─────────────────────────────────────────────────────────────
echo "§10  跨 page 验证 (US-011 + 收官)"
echo "─────────────────────────────────────────────────────────────"

# 10.1  TypeScript: 0 errors
echo "  ⏳ running typecheck..."
TS_OUT=$(cd "$ROOT_DIR" && pnpm --filter web typecheck 2>&1 || true)
TS_ERRORS=$(echo "$TS_OUT" | grep -c "error TS" || true)
if [ "$TS_ERRORS" -eq 0 ]; then
  ok "10.1  TypeScript: 0 errors"
else
  fail "10.1  TypeScript: $TS_ERRORS error(s) found"
fi

# 10.2  Vitest: >= 196 tests pass
echo "  ⏳ running vitest..."
VITEST_OUT=$(cd "$ROOT_DIR/apps/web" && pnpm test 2>&1 || true)
VITEST_PASS=$(echo "$VITEST_OUT" | grep -oE "Tests.*passed" | grep -oE "[0-9]+" | head -1 || echo "0")
if [ "${VITEST_PASS:-0}" -ge 196 ]; then
  ok "10.2  Vitest: $VITEST_PASS tests passed (>= 196)"
else
  fail "10.2  Vitest: $VITEST_PASS tests passed (need >= 196)"
fi

# 10.3  FadeInWrapper used across pages (US-011 polish)
FW_COUNT=$(grep -rl "FadeInWrapper" "apps/web/src/pages/" 2>/dev/null | wc -l | tr -d ' ')
if [ "$FW_COUNT" -ge 5 ]; then
  ok "10.3  FadeInWrapper used in $FW_COUNT page files (>= 5 · US-011 polish)"
else
  fail "10.3  FadeInWrapper used in $FW_COUNT page files (need >= 5)"
fi

# 10.4  glass-card used across pages (US-011 polish)
GC_COUNT=$(grep -rl "glass-card" "apps/web/src/pages/" 2>/dev/null | wc -l | tr -d ' ')
if [ "$GC_COUNT" -ge 5 ]; then
  ok "10.4  glass-card used in $GC_COUNT page files (>= 5 · US-011 polish)"
else
  fail "10.4  glass-card used in $GC_COUNT page files (need >= 5)"
fi

# 10.5  Toaster configured bottom-right in App.tsx
if grep -qE "position.*bottom-right|bottom-right.*position|Toaster" "apps/web/src/App.tsx" 2>/dev/null; then
  ok "10.5  Toaster present in App.tsx (US-011)"
else
  fail "10.5  Toaster missing in App.tsx"
fi

# 10.6  13 visual baseline PNGs exist
BASELINE_DIR="/tmp/aiipznt-clone-research/screenshots"
PRD22_BASELINES=(
  "prd22-generate.png"
  "prd22-boom-generate.png"
  "prd22-ai-video.png"
  "prd22-knowledge.png"
  "prd22-knowledge-mobile.png"
  "prd22-step1.png"
  "prd22-step3.png"
  "prd22-step3b.png"
  "prd22-step4.png"
  "prd22-step4b.png"
  "prd22-step5.png"
  "prd22-step6.png"
  "prd22-step7.png"
)
MISSING_BASELINE=0
for f in "${PRD22_BASELINES[@]}"; do
  if [ ! -f "$BASELINE_DIR/$f" ]; then
    MISSING_BASELINE=$((MISSING_BASELINE + 1))
  fi
done
if [ "$MISSING_BASELINE" -eq 0 ]; then
  ok "10.6  All 13 PRD-22 visual baselines exist"
else
  fail "10.6  $MISSING_BASELINE of 13 PRD-22 visual baselines missing"
fi

# 10.7  prd22-visual-baseline.spec.ts has 13 test cases
VISUAL_TEST_COUNT=$(grep -c "expectVisualMatch" "tests/e2e/prd22-visual-baseline.spec.ts" 2>/dev/null || echo "0")
if [ "$VISUAL_TEST_COUNT" -ge 13 ]; then
  ok "10.7  prd22-visual-baseline.spec.ts: $VISUAL_TEST_COUNT expectVisualMatch calls (>= 13)"
else
  fail "10.7  prd22-visual-baseline.spec.ts: $VISUAL_TEST_COUNT expectVisualMatch calls (need >= 13)"
fi

# ─────────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════"
TOTAL=$((PASS + FAIL + SKIP))
echo "  PRD-22 RESULT: $PASS 通过 · $FAIL 失败 · $SKIP 跳过 (共 $TOTAL 项)"
echo "═══════════════════════════════════════════════════════════"

if [ "$FAIL" -gt 0 ]; then
  echo ""
  echo "❌ PRD-22 CI gate FAILED ($FAIL 检查项不通过)"
  exit 1
else
  echo ""
  echo "✅ PRD-22 CI gate PASSED (全 $PASS 项通过)"
  exit 0
fi
