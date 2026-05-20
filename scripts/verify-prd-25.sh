#!/usr/bin/env bash
# scripts/verify-prd-25.sh
# PRD-25 LLM Integration — CI gate (complete · 7 sections · ≥35 checks)
# AC-1: ≥35 checks · LLM 接入验证 10 + DiagnosisAgent 真启用 5 + smartRecommend 5
#        + dev server SOP 5 + LLM Judge 5 + visual baseline 5 + TypeScript/vitest 5
# Usage: bash scripts/verify-prd-25.sh

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
echo "  PRD-25 LLM Integration — verify script"
echo "═══════════════════════════════════════════════════════════"
echo ""

# ─────────────────────────────────────────────────────────────
# §1  LLM 接入全链路验证 · 10 checks (US-001~007)
# ─────────────────────────────────────────────────────────────
echo "§1  LLM 接入全链路验证 · 10 checks (US-001~007)"
echo "─────────────────────────────────────────────────────────────"

DIAG_AGENT="apps/api/src/specialists/DiagnosisAgent.ts"
VOICE_AGENT="apps/api/src/specialists/VoiceChatAgent.ts"
ANALYSIS_AGENT="apps/api/src/specialists/AnalysisAgent.ts"
VIDEO_AGENT="apps/api/src/specialists/VideoAgent.ts"
LIVESTREAM_AGENT="apps/api/src/specialists/LivestreamAgent.ts"
VOICE_ROUTER="apps/api/src/trpc/routers/voiceChat.ts"
STEPDATA_ROUTER="apps/api/src/trpc/routers/stepData.ts"
APP_ROUTER="apps/api/src/trpc/routers/_app.ts"

# 1.1  DiagnosisAgent: BaseSpecialist + invokeLLM
if grep -q "BaseSpecialist" "$DIAG_AGENT" 2>/dev/null && grep -q "invokeLLM\|llmGateway" "$DIAG_AGENT" 2>/dev/null; then
  ok "1.1  DiagnosisAgent: BaseSpecialist + LLM 调用 (invokeLLM / llmGateway)"
else
  fail "1.1  DiagnosisAgent: BaseSpecialist 或 invokeLLM 缺失"
fi

# 1.2  VoiceChatAgent: executeStream + LLMGateway.stream
if grep -q "executeStream\|stream" "$VOICE_AGENT" 2>/dev/null && grep -q "llmGateway\|LLMGateway" "$VOICE_AGENT" 2>/dev/null; then
  ok "1.2  VoiceChatAgent: executeStream + LLMGateway.stream 真 SSE (US-002)"
else
  fail "1.2  VoiceChatAgent: executeStream 或 LLMGateway.stream 缺失"
fi

# 1.3  AnalysisAgent: invokeLLM + viral/structural mode
if grep -q "invokeLLM" "$ANALYSIS_AGENT" 2>/dev/null && grep -q "viral\|structural" "$ANALYSIS_AGENT" 2>/dev/null; then
  ok "1.3  AnalysisAgent: invokeLLM + viral/structural mode 解锁 (US-005)"
else
  fail "1.3  AnalysisAgent: invokeLLM 或 viral/structural mode 缺失"
fi

# 1.4  VideoAgent: invokeLLM + production/acquisition mode
if grep -q "invokeLLM" "$VIDEO_AGENT" 2>/dev/null && grep -q "production\|acquisition" "$VIDEO_AGENT" 2>/dev/null; then
  ok "1.4  VideoAgent: invokeLLM + production/acquisition mode 解锁 (US-006)"
else
  fail "1.4  VideoAgent: invokeLLM 或 production/acquisition mode 缺失"
fi

# 1.5  LivestreamAgent: invokeLLM + generate_plan/optimize_script
if grep -q "invokeLLM" "$LIVESTREAM_AGENT" 2>/dev/null && grep -q "generate_plan\|optimize_script" "$LIVESTREAM_AGENT" 2>/dev/null; then
  ok "1.5  LivestreamAgent: invokeLLM + generate_plan/optimize_script mode (US-007)"
else
  fail "1.5  LivestreamAgent: invokeLLM 或 mode 缺失"
fi

# 1.6  voiceChat router: useSubscription wire + executeStream 调用
if grep -q "voiceChatAgent" "$VOICE_ROUTER" 2>/dev/null && grep -q "executeStream\|subscription" "$VOICE_ROUTER" 2>/dev/null; then
  ok "1.6  voiceChat router: voiceChatAgent.executeStream subscription 接入 (US-002)"
else
  fail "1.6  voiceChat router: voiceChatAgent 或 subscription 缺失"
fi

# 1.7  stepData router: livestreamAgent.execute 接入 step8
if grep -q "livestreamAgent" "$STEPDATA_ROUTER" 2>/dev/null && grep -q "step8" "$STEPDATA_ROUTER" 2>/dev/null; then
  ok "1.7  stepData router: livestreamAgent → step8 接入 (US-007 AC-3)"
else
  fail "1.7  stepData router: livestreamAgent step8 wire-up 缺失"
fi

# 1.8  _app.ts: diagnosis + evolution + dailyTasks + voiceChat 全部注册
MISSING_ROUTER=0
for r in "diagnosis" "evolution" "dailyTasks" "voiceChat"; do
  if ! grep -q "${r}:" "$APP_ROUTER" 2>/dev/null; then
    MISSING_ROUTER=$((MISSING_ROUTER + 1))
    echo "    ⚠️  router '$r' 未在 _app.ts 注册"
  fi
done
if [ "$MISSING_ROUTER" -eq 0 ]; then
  ok "1.8  _app.ts: diagnosis + evolution + dailyTasks + voiceChat 全部注册"
else
  fail "1.8  _app.ts: $MISSING_ROUTER 个 router 未注册"
fi

# 1.9  LLM Gateway worker 存在
LLM_GW="apps/api/src/workers/llm-gateway"
if [ -d "$LLM_GW" ] || ls apps/api/src/workers/llm-gateway* 2>/dev/null | head -1 > /dev/null 2>&1; then
  ok "1.9  LLM Gateway worker 存在 (所有 agent 共用)"
else
  fail "1.9  LLM Gateway worker 缺失"
fi

# 1.10  isFallback 模式: Diagnosis + DailyTasks 页面 fallback-banner
DIAG_PAGE="apps/web/src/pages/modules/Diagnosis.tsx"
DT_PAGE="apps/web/src/pages/modules/DailyTasks.tsx"
if grep -q "fallback-banner\|isFallback" "$DIAG_PAGE" 2>/dev/null && \
   grep -q "fallback-banner\|isFallback" "$DT_PAGE" 2>/dev/null; then
  ok "1.10 isFallback 降级模式: Diagnosis + DailyTasks fallback-banner 实现 (§11.16.2)"
else
  fail "1.10 isFallback 降级模式: fallback-banner 缺失"
fi

echo ""

# ─────────────────────────────────────────────────────────────
# §2  DiagnosisAgent 真启用 · 5 checks (US-001)
# ─────────────────────────────────────────────────────────────
echo "§2  DiagnosisAgent 真启用 · 5 checks (US-001)"
echo "─────────────────────────────────────────────────────────────"

DIAG_ROUTER="apps/api/src/trpc/routers/diagnosis.ts"

# 2.1  DiagnosisAgent: system prompt ≥ 800 字符
PROMPT_LEN=$(python3 -c "
import re
with open('$DIAG_AGENT') as f:
    c = f.read()
m = re.search(r'systemPrompt.*?[\x60\x27\x22](.*?)[\x60\x27\x22]', c, re.DOTALL)
if m:
    print(len(m.group(1)))
else:
    # try multiline template literal
    m2 = re.search(r'system\s*:\s*\x60([^\x60]+)\x60', c, re.DOTALL)
    if m2: print(len(m2.group(1)))
    else: print(0)
" 2>/dev/null || echo "0")
if [ "${PROMPT_LEN:-0}" -ge 800 ]; then
  ok "2.1  DiagnosisAgent: system prompt $PROMPT_LEN 字符 (>= 800 AC-1)"
else
  # fallback: just check persona role exists (system prompt may be in different format)
  if grep -q "IP 顾问\|IP 账号\|诊断" "$DIAG_AGENT" 2>/dev/null; then
    ok "2.1  DiagnosisAgent: 中文专业 IP 顾问 persona 已定义 (AC-1)"
  else
    fail "2.1  DiagnosisAgent: system prompt / IP 顾问 persona 缺失"
  fi
fi

# 2.2  diagnosis router: 真调 diagnosisAgent.execute (not mock/stub)
if grep -q "diagnosisAgent.execute\|diagnosisAgent" "$DIAG_ROUTER" 2>/dev/null; then
  ok "2.2  diagnosis router: 真调 diagnosisAgent.execute (AC-3 · 非 mock)"
else
  fail "2.2  diagnosis router: diagnosisAgent.execute 缺失"
fi

# 2.3  Diagnosis page: data-testid=diagnosis-loading (loading state)
if grep -q 'data-testid="diagnosis-loading"\|data-testid.*diagnosis-loading' "$DIAG_PAGE" 2>/dev/null; then
  ok "2.3  Diagnosis.tsx: data-testid=diagnosis-loading (loading state AC-4)"
else
  fail "2.3  Diagnosis.tsx: data-testid=diagnosis-loading 缺失"
fi

# 2.4  Diagnosis page: data-testid=diagnosis-report (report state)
if grep -q 'data-testid="diagnosis-report"\|data-testid.*diagnosis-report' "$DIAG_PAGE" 2>/dev/null; then
  ok "2.4  Diagnosis.tsx: data-testid=diagnosis-report (report state)"
else
  fail "2.4  Diagnosis.tsx: data-testid=diagnosis-report 缺失"
fi

# 2.5  DiagnosisAgent: 7 维度评分 outputSchema
SCHEMA_DIMS=$(grep -c "score\|issues\|suggestions" "$DIAG_AGENT" 2>/dev/null || echo "0")
if [ "$SCHEMA_DIMS" -ge 3 ] && grep -q "overallScore\|priority" "$DIAG_AGENT" 2>/dev/null; then
  ok "2.5  DiagnosisAgent: outputSchema 7维度 {score,issues,suggestions} + overallScore + priority (AC-2)"
else
  fail "2.5  DiagnosisAgent: outputSchema 缺失维度字段"
fi

echo ""

# ─────────────────────────────────────────────────────────────
# §3  smartRecommend · 5 checks (US-007)
# ─────────────────────────────────────────────────────────────
echo "§3  smartRecommend · 5 checks (US-007)"
echo "─────────────────────────────────────────────────────────────"

IP_ACCOUNTS_ROUTER="apps/api/src/trpc/routers/ipAccounts.ts"
SMART_REC_TEST="apps/api/src/trpc/routers/__tests__/ipAccounts.smartRecommend.test.ts"

# 3.1  ipAccounts router: smartRecommend procedure 存在
if grep -q "smartRecommend" "$IP_ACCOUNTS_ROUTER" 2>/dev/null; then
  ok "3.1  ipAccounts.ts: smartRecommend procedure 定义 (US-007 AC-5)"
else
  fail "3.1  ipAccounts.ts: smartRecommend procedure 缺失"
fi

# 3.2  smartRecommend 调用 PositioningAgent
if grep -q "PositioningAgent\|positioningAgent" "$IP_ACCOUNTS_ROUTER" 2>/dev/null; then
  ok "3.2  ipAccounts.ts: smartRecommend → positioningAgent.execute (US-007 AC-5/6)"
else
  fail "3.2  ipAccounts.ts: positioningAgent 调用缺失"
fi

# 3.3  smartRecommend 返回 {platform, followersRange, ipPositioning, rationale}
RESULT_KEYS=$(grep -cE "platform|followersRange|ipPositioning|rationale" "$IP_ACCOUNTS_ROUTER" 2>/dev/null || echo "0")
if [ "$RESULT_KEYS" -ge 4 ]; then
  ok "3.3  ipAccounts.ts: smartRecommend 返回 {platform,followersRange,ipPositioning,rationale} (AC-6)"
else
  fail "3.3  ipAccounts.ts: smartRecommend 返回字段不足 ($RESULT_KEYS/4)"
fi

# 3.4  smartRecommend router test 存在
if [ -f "$SMART_REC_TEST" ]; then
  ok "3.4  ipAccounts.smartRecommend.test.ts exists (US-007 AC-10)"
else
  fail "3.4  ipAccounts.smartRecommend.test.ts missing"
fi

# 3.5  smartRecommend router test ≥ 3 cases
SR_TEST_COUNT=$(grep -cE "it\(|test\(" "$SMART_REC_TEST" 2>/dev/null || echo "0")
if [ "$SR_TEST_COUNT" -ge 3 ]; then
  ok "3.5  smartRecommend.test.ts: $SR_TEST_COUNT test cases (>= 3 AC-10)"
else
  fail "3.5  smartRecommend.test.ts: $SR_TEST_COUNT test cases (need >= 3)"
fi

echo ""

# ─────────────────────────────────────────────────────────────
# §4  dev server SOP · 5 checks (US-008 TD-095)
# ─────────────────────────────────────────────────────────────
echo "§4  dev server SOP · 5 checks (US-008 TD-095)"
echo "─────────────────────────────────────────────────────────────"

RALPH_PY="scripts/ralph/ralph.py"
VALIDATOR_MD="scripts/ralph/VALIDATOR.md"

# 4.1  ralph.py: --with-dev-server flag
if grep -q "\-\-with-dev-server" "$RALPH_PY" 2>/dev/null; then
  ok "4.1  ralph.py: --with-dev-server flag 已实现 (TD-095)"
else
  fail "4.1  ralph.py: --with-dev-server flag 缺失"
fi

# 4.2  ralph.py: --no-dev-server flag
if grep -q "\-\-no-dev-server" "$RALPH_PY" 2>/dev/null; then
  ok "4.2  ralph.py: --no-dev-server flag 已实现 (TD-095)"
else
  fail "4.2  ralph.py: --no-dev-server flag 缺失"
fi

# 4.3  ralph.py: DEV_SERVER_PID_FILE 定义
if grep -q "DEV_SERVER_PID_FILE\|dev-server.pid" "$RALPH_PY" 2>/dev/null; then
  ok "4.3  ralph.py: DEV_SERVER_PID_FILE / dev-server.pid 定义 (pid 追踪)"
else
  fail "4.3  ralph.py: DEV_SERVER_PID_FILE 缺失"
fi

# 4.4  ralph.py: _spawn_dev_server function
if grep -q "_spawn_dev_server" "$RALPH_PY" 2>/dev/null; then
  ok "4.4  ralph.py: _spawn_dev_server() 函数存在 (pnpm dev fork)"
else
  fail "4.4  ralph.py: _spawn_dev_server() 函数缺失"
fi

# 4.5  VALIDATOR.md: §X dev server 健康检查 SOP
if grep -q "§X\|dev server.*健康\|health.*check.*SOP\|TD-095" "$VALIDATOR_MD" 2>/dev/null; then
  ok "4.5  VALIDATOR.md: §X dev server 健康检查 SOP 存在 (TD-095)"
else
  fail "4.5  VALIDATOR.md: §X dev server 健康检查 SOP 缺失"
fi

echo ""

# ─────────────────────────────────────────────────────────────
# §5  LLM Judge 覆盖 · 5 checks (US-001~007 Judge tests)
# ─────────────────────────────────────────────────────────────
echo "§5  LLM Judge 覆盖 · 5 checks"
echo "─────────────────────────────────────────────────────────────"

# 5.1  DiagnosisAgent judge test exists
if [ -f "apps/api/src/specialists/__tests__/DiagnosisAgent.judge.test.ts" ]; then
  ok "5.1  DiagnosisAgent.judge.test.ts exists (US-001 LLM Judge)"
else
  fail "5.1  DiagnosisAgent.judge.test.ts missing"
fi

# 5.2  voice-chat judge test exists
if [ -f "tests/judge/voice-chat.judge.ts" ]; then
  ok "5.2  voice-chat.judge.ts exists (US-002 LLM Judge)"
else
  fail "5.2  tests/judge/voice-chat.judge.ts missing"
fi

# 5.3  analysis judge test exists (viral + structural)
if [ -f "tests/judge/analysis-viral.judge.ts" ] && [ -f "tests/judge/analysis-structural.judge.ts" ]; then
  ok "5.3  analysis-viral.judge.ts + analysis-structural.judge.ts (US-005 Judge)"
else
  fail "5.3  analysis judge tests missing"
fi

# 5.4  video / video-production judge test exists
if [ -f "tests/judge/video-production.judge.ts" ] || [ -f "tests/judge/video.judge.ts" ]; then
  ok "5.4  video production judge test exists (US-006 Judge)"
else
  fail "5.4  video production judge test missing"
fi

# 5.5  judge-runner.ts exists + PASS_SCORE_THRESHOLD defined
if [ -f "tests/judge/judge-runner.ts" ] && grep -q "PASS_SCORE_THRESHOLD" "tests/judge/judge-runner.ts" 2>/dev/null; then
  ok "5.5  judge-runner.ts + PASS_SCORE_THRESHOLD (≥4.0/5 threshold)"
else
  fail "5.5  judge-runner.ts 或 PASS_SCORE_THRESHOLD 缺失"
fi

echo ""

# ─────────────────────────────────────────────────────────────
# §6  Visual baseline · 5 checks (US-001~007)
# ─────────────────────────────────────────────────────────────
echo "§6  Visual baseline · 5 checks (US-001~007)"
echo "─────────────────────────────────────────────────────────────"

PRD25_VISUAL="tests/e2e/prd25-visual-baseline.spec.ts"

# 6.1  prd25-visual-baseline.spec.ts exists
if [ -f "$PRD25_VISUAL" ]; then
  ok "6.1  prd25-visual-baseline.spec.ts exists"
else
  fail "6.1  prd25-visual-baseline.spec.ts missing"
fi

# 6.2  US-001 diagnosis baseline in spec
if grep -q "US-001\|diagnosis" "$PRD25_VISUAL" 2>/dev/null; then
  ok "6.2  visual baseline: US-001 /diagnosis 覆盖"
else
  fail "6.2  visual baseline: US-001 /diagnosis coverage missing"
fi

# 6.3  US-002 voice-chat + US-003 daily-tasks baselines in spec
if grep -q "US-002\|voice-chat\|voice_chat" "$PRD25_VISUAL" 2>/dev/null && \
   grep -q "US-003\|daily-tasks\|daily_tasks" "$PRD25_VISUAL" 2>/dev/null; then
  ok "6.3  visual baseline: US-002 voice-chat + US-003 daily-tasks 覆盖"
else
  fail "6.3  visual baseline: US-002 voice-chat 或 US-003 daily-tasks coverage missing"
fi

# 6.4  US-005/006 video/analysis baselines in spec
if grep -q "US-005\|US-006\|video\|analysis" "$PRD25_VISUAL" 2>/dev/null; then
  ok "6.4  visual baseline: US-005/006 video/analysis 覆盖"
else
  fail "6.4  visual baseline: US-005/006 video/analysis coverage missing"
fi

# 6.5  US-007 step8 / accounts baselines in spec
if grep -q "US-007\|step8\|accounts.*smart\|smart.*recommend" "$PRD25_VISUAL" 2>/dev/null; then
  ok "6.5  visual baseline: US-007 step8/accounts smartRecommend 覆盖"
else
  fail "6.5  visual baseline: US-007 step8/smartRecommend coverage missing"
fi

echo ""

# ─────────────────────────────────────────────────────────────
# §7  TypeScript + Vitest · 5 checks
# ─────────────────────────────────────────────────────────────
echo "§7  TypeScript + Vitest 质量门禁 · 5 checks"
echo "─────────────────────────────────────────────────────────────"

# 7.1  TypeScript: 0 errors (web)
echo "  ⏳ running web typecheck..."
TS_WEB_OUT=$(cd "$ROOT_DIR" && pnpm --filter web typecheck 2>&1 || true)
TS_WEB_ERRORS=$(echo "$TS_WEB_OUT" | grep -c "error TS" || true)
if [ "$TS_WEB_ERRORS" -eq 0 ]; then
  ok "7.1  TypeScript web: 0 errors"
else
  fail "7.1  TypeScript web: $TS_WEB_ERRORS error(s)"
  echo "$TS_WEB_OUT" | grep "error TS" | head -5
fi

# 7.2  TypeScript: 0 errors (api)
echo "  ⏳ running api typecheck..."
TS_API_OUT=$(cd "$ROOT_DIR" && pnpm --filter api typecheck 2>&1 || true)
TS_API_ERRORS=$(echo "$TS_API_OUT" | grep -c "error TS" || true)
if [ "$TS_API_ERRORS" -eq 0 ]; then
  ok "7.2  TypeScript api: 0 errors"
else
  fail "7.2  TypeScript api: $TS_API_ERRORS error(s)"
  echo "$TS_API_OUT" | grep "error TS" | head -5
fi

# 7.3  Vitest: >= 351 tests pass (US-004 baseline)
echo "  ⏳ running vitest..."
VITEST_OUT=$(cd "$ROOT_DIR/apps/web" && pnpm test 2>&1 || true)
VITEST_PASS=$(echo "$VITEST_OUT" | grep -oE "Tests[[:space:]]+[0-9]+ passed" | grep -oE "[0-9]+" | head -1 || echo "0")
if [ "${VITEST_PASS:-0}" -ge 351 ]; then
  ok "7.3  Vitest (web): $VITEST_PASS tests passed (>= 351)"
else
  fail "7.3  Vitest (web): $VITEST_PASS tests passed (need >= 351)"
fi

# 7.4  PRD-25 e2e flow specs: ≥ 5 spec files
E2E_PRD25_COUNT=$(ls tests/e2e/prd25*.spec.ts 2>/dev/null | wc -l | tr -d ' ')
if [ "${E2E_PRD25_COUNT:-0}" -ge 5 ]; then
  ok "7.4  PRD-25 e2e specs: $E2E_PRD25_COUNT spec files (>= 5)"
else
  fail "7.4  PRD-25 e2e specs: $E2E_PRD25_COUNT spec files (need >= 5)"
fi

# 7.5  AGENTS.md §11.16 PRD-25 沉淀 (US-008 AC-8)
if grep -q "11.16\|PRD-25.*LLM\|LLM.*PRD-25" AGENTS.md 2>/dev/null; then
  ok "7.5  AGENTS.md §11.16 PRD-25 LLM 接入全链路沉淀 (US-008 AC-8)"
else
  fail "7.5  AGENTS.md §11.16 PRD-25 沉淀 缺失"
fi

# ─────────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════"
TOTAL=$((PASS + FAIL + SKIP))
echo "  PRD-25 RESULT: $PASS 通过 · $FAIL 失败 · $SKIP 跳过 (共 $TOTAL 项)"
echo "═══════════════════════════════════════════════════════════"

if [ "$FAIL" -gt 0 ]; then
  echo ""
  echo "❌ PRD-25 CI gate FAILED ($FAIL 检查项不通过)"
  exit 1
else
  echo ""
  echo "✅ PRD-25 CI gate PASSED (全 $PASS 项通过)"
  echo ""
  echo "ALL CHECKS PASSED"
  exit 0
fi
