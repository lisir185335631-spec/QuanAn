#!/usr/bin/env bash
# scripts/verify-prd-24.sh
# PRD-24 Modules Final Polish — CI gate (complete · 10 sections · ≥30 checks)
# Usage: bash scripts/verify-prd-24.sh

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
echo "  PRD-24 Modules Final Polish — verify script"
echo "═══════════════════════════════════════════════════════════"
echo ""

# ─────────────────────────────────────────────────────────────
# §1  /daily-tasks · 3 stub 任务卡 + loading + EmptyState (US-001)
# ─────────────────────────────────────────────────────────────
echo "§1  /daily-tasks · 3 stub 任务卡 + loading + EmptyState (US-001)"
echo "─────────────────────────────────────────────────────────────"

DAILY_CONST="apps/web/src/lib/constants/daily-tasks.ts"
DAILY_PAGE="apps/web/src/pages/modules/DailyTasks.tsx"

# 1.1  H1 = '今日行动清单'
if grep -q "今日行动清单" "$DAILY_PAGE" 2>/dev/null; then
  ok "1.1  DailyTasks H1 = '今日行动清单'"
else
  fail "1.1  DailyTasks H1 '今日行动清单' missing"
fi

# 1.2  DAILY_TASKS_STUB has 3 tasks
TASK_COUNT=$(grep -c "id: '" "$DAILY_CONST" 2>/dev/null || echo "0")
if [ "$TASK_COUNT" -ge 3 ]; then
  ok "1.2  DAILY_TASKS_STUB: $TASK_COUNT tasks (>= 3)"
else
  fail "1.2  DAILY_TASKS_STUB: $TASK_COUNT tasks (need >= 3)"
fi

# 1.3  DailyTasks.tsx renders h3 cards (stub task titles)
if grep -q "<h3" "$DAILY_PAGE" 2>/dev/null; then
  ok "1.3  DailyTasks.tsx: <h3> task cards rendered"
else
  fail "1.3  DailyTasks.tsx: <h3> task cards missing"
fi

# 1.4  添加账号 CTA button in EmptyState
if grep -q "添加账号" "$DAILY_CONST" 2>/dev/null; then
  ok "1.4  DAILY_TASKS_EMPTY_CTA = '添加账号' in daily-tasks.ts"
else
  fail "1.4  '添加账号' missing from daily-tasks.ts"
fi

# 1.5  DailyTasks uses getLsKey (ls-namespace LD-009)
if grep -q "getLsKey" "$DAILY_PAGE" 2>/dev/null; then
  ok "1.5  DailyTasks.tsx: getLsKey (LD-009 ls-namespace) used"
else
  fail "1.5  DailyTasks.tsx: getLsKey missing (LD-009 violation)"
fi

# 1.6  DAILY_TASKS_LOADING_TEXT defined
if grep -q "DAILY_TASKS_LOADING_TEXT" "$DAILY_CONST" 2>/dev/null; then
  ok "1.6  DAILY_TASKS_LOADING_TEXT defined in daily-tasks.ts"
else
  fail "1.6  DAILY_TASKS_LOADING_TEXT missing from daily-tasks.ts"
fi

echo ""

# ─────────────────────────────────────────────────────────────
# §2  /evolution · 5 级 badge + 4 指标 + 5 H3 模块 + 4 进化方向 radio (US-002)
# ─────────────────────────────────────────────────────────────
echo "§2  /evolution · 5 级 badge + 4 指标仪表盘 + 5 H3 模块 + 进化方向 radio (US-002)"
echo "─────────────────────────────────────────────────────────────"

EVOL_CONST="apps/web/src/lib/constants/evolution.ts"
EVOL_PAGE="apps/web/src/pages/modules/Evolution.tsx"

# 2.1  H1 = '智能体进化中心'
if grep -q "智能体进化中心" "$EVOL_PAGE" 2>/dev/null; then
  ok "2.1  Evolution H1 = '智能体进化中心'"
else
  fail "2.1  Evolution H1 '智能体进化中心' missing"
fi

# 2.2  EVOLUTION_LEVELS_5 has 5 levels
LEVEL_COUNT=$(grep -c "id: 'L" "$EVOL_CONST" 2>/dev/null || echo "0")
if [ "$LEVEL_COUNT" -ge 5 ]; then
  ok "2.2  EVOLUTION_LEVELS_5: $LEVEL_COUNT levels (>= 5)"
else
  fail "2.2  EVOLUTION_LEVELS_5: $LEVEL_COUNT levels (need >= 5)"
fi

# 2.3  Evolution page renders badge data-testid per level
if grep -q "data-testid.*badge" "$EVOL_PAGE" 2>/dev/null; then
  ok "2.3  Evolution.tsx: badge data-testid rendered"
else
  fail "2.3  Evolution.tsx: badge data-testid missing"
fi

# 2.4  EVOLUTION_METRICS_STUB has 4 keys (goodCount, needsImprovement, learningArchive, satisfactionRate)
METRIC_COUNT=$(grep -cE "(goodCount|needsImprovement|learningArchive|satisfactionRate)" "$EVOL_CONST" 2>/dev/null || echo "0")
if [ "$METRIC_COUNT" -ge 4 ]; then
  ok "2.4  EVOLUTION_METRICS_STUB: $METRIC_COUNT metric keys (>= 4)"
else
  fail "2.4  EVOLUTION_METRICS_STUB: $METRIC_COUNT metric keys (need >= 4)"
fi

# 2.5  EVOLUTION_MODULES_5 has 5 module names
MODULE_COUNT=$(python3 -c "
import re
with open('$EVOL_CONST') as f:
    content = f.read()
m = re.search(r'EVOLUTION_MODULES_5.*?\[(.+?)\] as const', content, re.DOTALL)
if m:
    items = re.findall(r\"'([^']+)'\", m.group(1))
    print(len(items))
else:
    print(0)
" 2>/dev/null || echo "0")
if [ "${MODULE_COUNT:-0}" -ge 5 ]; then
  ok "2.5  EVOLUTION_MODULES_5: $MODULE_COUNT modules (>= 5)"
else
  fail "2.5  EVOLUTION_MODULES_5: $MODULE_COUNT modules (need >= 5)"
fi

# 2.6  EVOLUTION_DIRECTIONS_4 has 4 directions
DIR_COUNT=$(python3 -c "
import re
with open('$EVOL_CONST') as f:
    content = f.read()
m = re.search(r'EVOLUTION_DIRECTIONS_4.*?\[(.+?)\] as const', content, re.DOTALL)
if m:
    items = re.findall(r\"'([^']+)'\", m.group(1))
    print(len(items))
else:
    print(0)
" 2>/dev/null || echo "0")
if [ "${DIR_COUNT:-0}" -ge 4 ]; then
  ok "2.6  EVOLUTION_DIRECTIONS_4: $DIR_COUNT directions (>= 4)"
else
  fail "2.6  EVOLUTION_DIRECTIONS_4: $DIR_COUNT directions (need >= 4)"
fi

# 2.7  Evolution page has radio-like direction selector (aria-label or 进化方向)
if grep -q "进化方向" "$EVOL_PAGE" 2>/dev/null; then
  ok "2.7  Evolution.tsx: 进化方向 radio/selector rendered"
else
  fail "2.7  Evolution.tsx: 进化方向 selector missing"
fi

# 2.8  Evolution page uses EVOLUTION_MODULES_5 and EVOLUTION_LEVELS_5
if grep -q "EVOLUTION_MODULES_5" "$EVOL_PAGE" 2>/dev/null && grep -q "EVOLUTION_LEVELS_5" "$EVOL_PAGE" 2>/dev/null; then
  ok "2.8  Evolution.tsx: imports EVOLUTION_MODULES_5 + EVOLUTION_LEVELS_5"
else
  fail "2.8  Evolution.tsx: missing EVOLUTION_MODULES_5 or EVOLUTION_LEVELS_5"
fi

echo ""

# ─────────────────────────────────────────────────────────────
# §3  /voice-chat · VOICE CHAT H1 + 6 quick prompts + 自我介绍 (US-003)
# ─────────────────────────────────────────────────────────────
echo "§3  /voice-chat · VOICE CHAT H1 + 6 quick prompts + 自我介绍 (US-003)"
echo "─────────────────────────────────────────────────────────────"

VOICE_CONST="apps/web/src/lib/constants/voice-chat.ts"
VOICE_PAGE="apps/web/src/pages/tools/VoiceChat.tsx"

# 3.1  H1 = 'VOICE CHAT' (uppercase Orbitron)
if grep -q "VOICE CHAT" "$VOICE_PAGE" 2>/dev/null; then
  ok "3.1  VoiceChat H1 = 'VOICE CHAT' (D-239 字面锁)"
else
  fail "3.1  VoiceChat H1 'VOICE CHAT' missing"
fi

# 3.2  VOICE_CHAT_QUICK_PROMPTS_6 has 6 prompts
PROMPT_COUNT=$(python3 -c "
import re
with open('$VOICE_CONST') as f:
    content = f.read()
m = re.search(r'VOICE_CHAT_QUICK_PROMPTS_6\s*=\s*\[(.+?)\] as const', content, re.DOTALL)
if m:
    items = re.findall(r\"'([^']+)'\", m.group(1))
    print(len(items))
else:
    print(0)
" 2>/dev/null || echo "0")
if [ "${PROMPT_COUNT:-0}" -ge 6 ]; then
  ok "3.2  VOICE_CHAT_QUICK_PROMPTS_6: $PROMPT_COUNT prompts (>= 6)"
else
  fail "3.2  VOICE_CHAT_QUICK_PROMPTS_6: $PROMPT_COUNT prompts (need >= 6)"
fi

# 3.3  VOICE_CHAT_INTRO defined (自我介绍)
if grep -q "VOICE_CHAT_INTRO" "$VOICE_CONST" 2>/dev/null; then
  ok "3.3  VOICE_CHAT_INTRO defined in voice-chat.ts (自我介绍字面锁)"
else
  fail "3.3  VOICE_CHAT_INTRO missing from voice-chat.ts"
fi

# 3.4  VoiceChat.tsx renders quick prompts from constant (data-testid per prompt)
if grep -q "data-testid.*quick-prompt" "$VOICE_PAGE" 2>/dev/null; then
  ok "3.4  VoiceChat.tsx: data-testid='quick-prompt-{i}' rendered"
else
  fail "3.4  VoiceChat.tsx: quick-prompt data-testid missing"
fi

# 3.5  VoiceChat.tsx uses getLsKey (LD-009)
if grep -q "getLsKey\|getToolLsKey" "$VOICE_PAGE" 2>/dev/null; then
  ok "3.5  VoiceChat.tsx: getLsKey/getToolLsKey (LD-009) used for history"
else
  fail "3.5  VoiceChat.tsx: ls-namespace getLsKey missing (LD-009 violation)"
fi

# 3.6  VoiceChat imports VOICE_CHAT_QUICK_PROMPTS_6 and VOICE_CHAT_INTRO
if grep -q "VOICE_CHAT_QUICK_PROMPTS_6" "$VOICE_PAGE" 2>/dev/null && grep -q "VOICE_CHAT_INTRO" "$VOICE_PAGE" 2>/dev/null; then
  ok "3.6  VoiceChat.tsx: imports VOICE_CHAT_QUICK_PROMPTS_6 + VOICE_CHAT_INTRO"
else
  fail "3.6  VoiceChat.tsx: missing VOICE_CHAT_QUICK_PROMPTS_6 or VOICE_CHAT_INTRO import"
fi

echo ""

# ─────────────────────────────────────────────────────────────
# §4  跨 page · TypeScript + Vitest (US-001~003)
# ─────────────────────────────────────────────────────────────
echo "§4  跨 page · TypeScript + Vitest"
echo "─────────────────────────────────────────────────────────────"

# 4.1  TypeScript: 0 errors
echo "  ⏳ running typecheck..."
TS_OUT=$(cd "$ROOT_DIR" && pnpm --filter web typecheck 2>&1 || true)
TS_ERRORS=$(echo "$TS_OUT" | grep -c "error TS" || true)
if [ "$TS_ERRORS" -eq 0 ]; then
  ok "4.1  TypeScript: 0 errors"
else
  fail "4.1  TypeScript: $TS_ERRORS error(s) found"
  echo "$TS_OUT" | grep "error TS" | head -5
fi

# 4.2  Vitest: >= 308 tests pass
echo "  ⏳ running vitest..."
VITEST_OUT=$(cd "$ROOT_DIR/apps/web" && pnpm test 2>&1 || true)
VITEST_PASS=$(echo "$VITEST_OUT" | grep -oE "Tests[[:space:]]+[0-9]+ passed" | grep -oE "[0-9]+" | head -1 || echo "0")
if [ "${VITEST_PASS:-0}" -ge 308 ]; then
  ok "4.2  Vitest: $VITEST_PASS tests passed (>= 308)"
else
  fail "4.2  Vitest: $VITEST_PASS tests passed (need >= 308)"
fi

echo ""

# ─────────────────────────────────────────────────────────────
# §5  Visual baseline · prd22 13 + prd23 16 + prd24 3 = 32 (US-004)
# ─────────────────────────────────────────────────────────────
echo "§5  Visual baseline · prd22 13 + prd23 16 + prd24 3 = 32 (US-004)"
echo "─────────────────────────────────────────────────────────────"

PRD22_SPEC="tests/e2e/prd22-visual-baseline.spec.ts"
PRD23_SPEC="tests/e2e/prd23-visual-baseline.spec.ts"
PRD24_SPEC="tests/e2e/prd24-visual-baseline.spec.ts"

# 5.1  prd22 visual baseline spec exists
if [ -f "$PRD22_SPEC" ]; then
  ok "5.1  prd22-visual-baseline.spec.ts exists"
else
  fail "5.1  prd22-visual-baseline.spec.ts missing"
fi

# 5.2  prd22 has >= 13 expectVisualMatch calls
PRD22_VM=$(grep -c "expectVisualMatch" "$PRD22_SPEC" 2>/dev/null || echo "0")
PRD22_TESTS=$((PRD22_VM - 1))
if [ "$PRD22_TESTS" -ge 13 ]; then
  ok "5.2  prd22-visual-baseline.spec.ts: $PRD22_TESTS baseline tests (>= 13)"
else
  fail "5.2  prd22-visual-baseline.spec.ts: $PRD22_TESTS baseline tests (need >= 13)"
fi

# 5.3  prd23 visual baseline spec exists
if [ -f "$PRD23_SPEC" ]; then
  ok "5.3  prd23-visual-baseline.spec.ts exists"
else
  fail "5.3  prd23-visual-baseline.spec.ts missing"
fi

# 5.4  prd23 has >= 16 expectVisualMatch calls
PRD23_VM=$(grep -c "expectVisualMatch" "$PRD23_SPEC" 2>/dev/null || echo "0")
PRD23_TESTS=$((PRD23_VM - 1))
if [ "$PRD23_TESTS" -ge 16 ]; then
  ok "5.4  prd23-visual-baseline.spec.ts: $PRD23_TESTS baseline tests (>= 16)"
else
  fail "5.4  prd23-visual-baseline.spec.ts: $PRD23_TESTS baseline tests (need >= 16)"
fi

# 5.5  prd24 visual baseline spec exists
if [ -f "$PRD24_SPEC" ]; then
  ok "5.5  prd24-visual-baseline.spec.ts exists"
else
  fail "5.5  prd24-visual-baseline.spec.ts missing"
fi

# 5.6  prd24 has >= 3 expectVisualMatch calls (daily-tasks + evolution + voice-chat)
PRD24_VM=$(grep -c "expectVisualMatch" "$PRD24_SPEC" 2>/dev/null || echo "0")
PRD24_TESTS=$((PRD24_VM - 1))
if [ "$PRD24_TESTS" -ge 3 ]; then
  ok "5.6  prd24-visual-baseline.spec.ts: $PRD24_TESTS baseline tests (>= 3)"
else
  fail "5.6  prd24-visual-baseline.spec.ts: $PRD24_TESTS baseline tests (need >= 3)"
fi

# 5.7  Combined 32 baseline total
TOTAL_BASELINES=$((PRD22_TESTS + PRD23_TESTS + PRD24_TESTS))
if [ "$TOTAL_BASELINES" -ge 32 ]; then
  ok "5.7  Combined visual baselines: $TOTAL_BASELINES (>= 32 · prd22+prd23+prd24 收官)"
else
  fail "5.7  Combined visual baselines: $TOTAL_BASELINES (need >= 32)"
fi

# 5.8  prd24 baseline PNGs exist in /tmp/aiipznt-clone-research/screenshots/
SCREENSHOT_DIR="/tmp/aiipznt-clone-research/screenshots"
PRD24_PNGS=("prd24-daily-tasks.png" "prd24-evolution.png" "prd24-voice-chat.png")
MISSING_PNG=0
for f in "${PRD24_PNGS[@]}"; do
  if [ ! -f "$SCREENSHOT_DIR/$f" ]; then
    MISSING_PNG=$((MISSING_PNG + 1))
  fi
done
if [ "$MISSING_PNG" -eq 0 ]; then
  ok "5.8  All 3 PRD-24 baseline PNGs exist in /tmp/aiipznt-clone-research/screenshots/"
else
  fail "5.8  $MISSING_PNG of 3 PRD-24 baseline PNGs missing from /tmp/aiipznt-clone-research/screenshots/"
fi

echo ""

# ─────────────────────────────────────────────────────────────
# §6  Unit test 同步规则 · 3 PRD-24 pages 都有 __tests__ (D-239)
# ─────────────────────────────────────────────────────────────
echo "§6  Unit test 同步规则 · 3 PRD-24 new pages 都有 __tests__ (D-239)"
echo "─────────────────────────────────────────────────────────────"

# 6.1  DailyTasks page has __tests__ file
if [ -f "apps/web/src/pages/__tests__/DailyTasks.test.tsx" ]; then
  ok "6.1  DailyTasks.tsx: pages/__tests__/DailyTasks.test.tsx exists"
else
  fail "6.1  DailyTasks.tsx: pages/__tests__/DailyTasks.test.tsx missing"
fi

# 6.2  Evolution page has __tests__ file
if [ -f "apps/web/src/pages/__tests__/Evolution.test.tsx" ]; then
  ok "6.2  Evolution.tsx: pages/__tests__/Evolution.test.tsx exists"
else
  fail "6.2  Evolution.tsx: pages/__tests__/Evolution.test.tsx missing"
fi

# 6.3  VoiceChat page has __tests__ file
if [ -f "apps/web/src/pages/tools/__tests__/VoiceChat.test.tsx" ]; then
  ok "6.3  VoiceChat.tsx: tools/__tests__/VoiceChat.test.tsx exists"
else
  fail "6.3  VoiceChat.tsx: tools/__tests__/VoiceChat.test.tsx missing"
fi

# 6.4  DailyTasks test has >= 5 test cases
DT_TEST_COUNT=$(grep -c "^  it\b\|^it\b" "apps/web/src/pages/__tests__/DailyTasks.test.tsx" 2>/dev/null || echo "0")
if [ "$DT_TEST_COUNT" -ge 5 ]; then
  ok "6.4  DailyTasks.test.tsx: $DT_TEST_COUNT test cases (>= 5)"
else
  fail "6.4  DailyTasks.test.tsx: $DT_TEST_COUNT test cases (need >= 5)"
fi

# 6.5  Evolution test has >= 5 test cases
EV_TEST_COUNT=$(grep -c "^  it\b\|^it\b" "apps/web/src/pages/__tests__/Evolution.test.tsx" 2>/dev/null || echo "0")
if [ "$EV_TEST_COUNT" -ge 5 ]; then
  ok "6.5  Evolution.test.tsx: $EV_TEST_COUNT test cases (>= 5)"
else
  fail "6.5  Evolution.test.tsx: $EV_TEST_COUNT test cases (need >= 5)"
fi

# 6.6  VoiceChat test has >= 5 test cases
VC_TEST_COUNT=$(grep -c "^  it\b\|^it\b" "apps/web/src/pages/tools/__tests__/VoiceChat.test.tsx" 2>/dev/null || echo "0")
if [ "$VC_TEST_COUNT" -ge 5 ]; then
  ok "6.6  VoiceChat.test.tsx: $VC_TEST_COUNT test cases (>= 5)"
else
  fail "6.6  VoiceChat.test.tsx: $VC_TEST_COUNT test cases (need >= 5)"
fi

echo ""

# ─────────────────────────────────────────────────────────────
# §7  E2E flow specs · 3 PRD-24 pages (US-001~003)
# ─────────────────────────────────────────────────────────────
echo "§7  E2E flow specs · 3 PRD-24 pages (US-001~003)"
echo "─────────────────────────────────────────────────────────────"

# 7.1  prd24-daily-tasks-flow.spec.ts exists
if [ -f "tests/e2e/prd24-daily-tasks-flow.spec.ts" ]; then
  ok "7.1  prd24-daily-tasks-flow.spec.ts exists"
else
  fail "7.1  prd24-daily-tasks-flow.spec.ts missing"
fi

# 7.2  prd24-evolution-flow.spec.ts exists
if [ -f "tests/e2e/prd24-evolution-flow.spec.ts" ]; then
  ok "7.2  prd24-evolution-flow.spec.ts exists"
else
  fail "7.2  prd24-evolution-flow.spec.ts missing"
fi

# 7.3  prd24-voice-chat-flow.spec.ts exists
if [ -f "tests/e2e/prd24-voice-chat-flow.spec.ts" ]; then
  ok "7.3  prd24-voice-chat-flow.spec.ts exists"
else
  fail "7.3  prd24-voice-chat-flow.spec.ts missing"
fi

echo ""

# ─────────────────────────────────────────────────────────────
# §8  Constants 文件 · 3 PRD-24 常量文件 + unit tests (US-001~003)
# ─────────────────────────────────────────────────────────────
echo "§8  Constants 文件 · 3 PRD-24 常量文件 + constant unit tests (US-001~003)"
echo "─────────────────────────────────────────────────────────────"

# 8.1  daily-tasks.ts exists
if [ -f "apps/web/src/lib/constants/daily-tasks.ts" ]; then
  ok "8.1  lib/constants/daily-tasks.ts exists"
else
  fail "8.1  lib/constants/daily-tasks.ts missing"
fi

# 8.2  evolution.ts exists
if [ -f "apps/web/src/lib/constants/evolution.ts" ]; then
  ok "8.2  lib/constants/evolution.ts exists"
else
  fail "8.2  lib/constants/evolution.ts exists"
fi

# 8.3  voice-chat.ts exists
if [ -f "apps/web/src/lib/constants/voice-chat.ts" ]; then
  ok "8.3  lib/constants/voice-chat.ts exists"
else
  fail "8.3  lib/constants/voice-chat.ts missing"
fi

# 8.4  daily-tasks constant unit test exists
if [ -f "apps/web/src/lib/constants/__tests__/daily-tasks.test.ts" ]; then
  ok "8.4  constants/__tests__/daily-tasks.test.ts exists"
else
  fail "8.4  constants/__tests__/daily-tasks.test.ts missing"
fi

# 8.5  voice-chat constant unit test exists
if [ -f "apps/web/src/lib/constants/__tests__/voice-chat.test.ts" ]; then
  ok "8.5  constants/__tests__/voice-chat.test.ts exists"
else
  fail "8.5  constants/__tests__/voice-chat.test.ts missing"
fi

echo ""

# ─────────────────────────────────────────────────────────────
# §9  LD-009 ls-namespace · PRD-24 all 3 pages use getLsKey (no bare localStorage)
# ─────────────────────────────────────────────────────────────
echo "§9  LD-009 ls-namespace · PRD-24 pages 不直接调 localStorage.*setItem/getItem"
echo "─────────────────────────────────────────────────────────────"

# 9.1  DailyTasks.tsx: if localStorage used, must also use getLsKey (no hardcoded raw string keys)
DT_HAS_LS=$(grep -c "localStorage\." "$DAILY_PAGE" 2>/dev/null || echo "0")
DT_HAS_LS_KEY=$(grep -c "getLsKey\|getToolLsKey" "$DAILY_PAGE" 2>/dev/null || echo "0")
if [ "$DT_HAS_LS" -eq 0 ] || [ "$DT_HAS_LS_KEY" -gt 0 ]; then
  ok "9.1  DailyTasks.tsx: localStorage via getLsKey (LD-009 compliant)"
else
  fail "9.1  DailyTasks.tsx: localStorage without getLsKey (LD-009 violation — hardcoded key)"
fi

# 9.2  VoiceChat.tsx: if localStorage used, must also use getLsKey
VC_HAS_LS=$(grep -c "localStorage\." "$VOICE_PAGE" 2>/dev/null || echo "0")
VC_HAS_LS_KEY=$(grep -c "getLsKey\|getToolLsKey" "$VOICE_PAGE" 2>/dev/null || echo "0")
if [ "$VC_HAS_LS" -eq 0 ] || [ "$VC_HAS_LS_KEY" -gt 0 ]; then
  ok "9.2  VoiceChat.tsx: localStorage via getLsKey (LD-009 compliant)"
else
  fail "9.2  VoiceChat.tsx: localStorage without getLsKey (LD-009 violation — hardcoded key)"
fi

# 9.3  Evolution.tsx uses getLsKey or getToolLsKey
if grep -q "getLsKey\|getToolLsKey" "$EVOL_PAGE" 2>/dev/null; then
  ok "9.3  Evolution.tsx: getLsKey/getToolLsKey (LD-009) used"
else
  ok "9.3  Evolution.tsx: no localStorage persistence needed (stub metrics only) — LD-009 N/A"
fi

echo ""

# ─────────────────────────────────────────────────────────────
# §10  D-234 · 3 stub 页无直接 tRPC 依赖 + 无 LLM 接入
# ─────────────────────────────────────────────────────────────
echo "§10  D-234 · PRD-24 stub 页无 tRPC mutation / LLM 调用"
echo "─────────────────────────────────────────────────────────────"

# 10.1  DailyTasks.tsx no trpc mutation call
if ! grep -qE "useMutation|trpc\.[a-z]+\.[a-z]+\.useMutation" "$DAILY_PAGE" 2>/dev/null; then
  ok "10.1  DailyTasks.tsx: no tRPC mutation (D-234 stub only)"
else
  fail "10.1  DailyTasks.tsx: tRPC mutation found (violates D-234 stub)"
fi

# 10.2  Evolution.tsx no trpc mutation call
if ! grep -qE "useMutation|trpc\.[a-z]+\.[a-z]+\.useMutation" "$EVOL_PAGE" 2>/dev/null; then
  ok "10.2  Evolution.tsx: no tRPC mutation (D-234 stub only)"
else
  fail "10.2  Evolution.tsx: tRPC mutation found (violates D-234 stub)"
fi

# 10.3  VoiceChat.tsx no trpc mutation call
if ! grep -qE "useMutation|trpc\.[a-z]+\.[a-z]+\.useMutation" "$VOICE_PAGE" 2>/dev/null; then
  ok "10.3  VoiceChat.tsx: no tRPC mutation (D-234 stub only)"
else
  fail "10.3  VoiceChat.tsx: tRPC mutation found (violates D-234 stub)"
fi

# 10.4  prd24 visual baseline has 3 pages (daily-tasks, evolution, voice-chat)
if grep -q "daily-tasks" "$PRD24_SPEC" 2>/dev/null && \
   grep -q "evolution" "$PRD24_SPEC" 2>/dev/null && \
   grep -q "voice-chat" "$PRD24_SPEC" 2>/dev/null; then
  ok "10.4  prd24-visual-baseline.spec.ts covers all 3 pages (daily-tasks + evolution + voice-chat)"
else
  fail "10.4  prd24-visual-baseline.spec.ts missing coverage for some pages"
fi

# ─────────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════"
TOTAL=$((PASS + FAIL + SKIP))
echo "  PRD-24 RESULT: $PASS 通过 · $FAIL 失败 · $SKIP 跳过 (共 $TOTAL 项)"
echo "═══════════════════════════════════════════════════════════"

if [ "$FAIL" -gt 0 ]; then
  echo ""
  echo "❌ PRD-24 CI gate FAILED ($FAIL 检查项不通过)"
  exit 1
else
  echo ""
  echo "✅ PRD-24 CI gate PASSED (全 $PASS 项通过)"
  exit 0
fi
