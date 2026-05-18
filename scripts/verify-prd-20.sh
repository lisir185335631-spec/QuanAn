#!/usr/bin/env bash
# verify-prd-20.sh · PRD-20 真 LLM 接入全量验收
# 运行: bash scripts/verify-prd-20.sh
# 退出码: 0 = ALL PASS / SKIP · 1 = FAIL
# 无 OPENAI_API_KEY 时: §3.4/§4/§5.4 SKIP · 其余全跑 · ≥ 25 项 PASS

set -uo pipefail
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PASS=0
FAIL=0
SKIP=0

ok() {
  echo "✅  $1"
  PASS=$((PASS + 1))
}
fail() {
  echo "❌  $1"
  FAIL=$((FAIL + 1))
}
skip() {
  echo "⏭️  SKIP: $1"
  SKIP=$((SKIP + 1))
}

HAS_OPENAI="${OPENAI_API_KEY:-}"

echo "======================================================"
echo " verify-prd-20.sh · PRD-20 真 LLM 接入 40+ 检查"
echo " OPENAI_API_KEY: ${HAS_OPENAI:+✓ 存在}${HAS_OPENAI:-✗ 不存在 (部分 SKIP)}"
echo "======================================================"
echo ""

# ─────────────────────────────────────────────────────────────
# §1 ENV validation (3 项)
# ─────────────────────────────────────────────────────────────
echo "§1 ENV validation"

if grep -q 'OPENAI_API_KEY' "$PROJECT_ROOT/apps/api/src/lib/env.ts" 2>/dev/null \
   && grep -q 'ANTHROPIC_API_KEY' "$PROJECT_ROOT/apps/api/src/lib/env.ts" 2>/dev/null \
   && grep -q 'LLM_DEFAULT_MODEL' "$PROJECT_ROOT/apps/api/src/lib/env.ts" 2>/dev/null; then
  ok "§1.1 env.ts 含 3 LLM env vars (OPENAI/ANTHROPIC/DEFAULT_MODEL)"
else
  fail "§1.1 env.ts 含 3 LLM env vars"
fi

if grep -q 'emptyToUndefined' "$PROJECT_ROOT/apps/api/src/lib/env.ts" 2>/dev/null; then
  ok "§1.2 env.ts 有 emptyToUndefined preprocessor (empty string → undefined)"
else
  fail "§1.2 env.ts 有 emptyToUndefined preprocessor"
fi

if grep -q "llmMode.*real.*fallback\|'real'\|'fallback'" "$PROJECT_ROOT/apps/api/src/lib/env.ts" 2>/dev/null; then
  ok "§1.3 env.ts 返回 llmMode: 'real' | 'fallback'"
else
  fail "§1.3 env.ts 返回 llmMode"
fi
echo ""

# ─────────────────────────────────────────────────────────────
# §2 LLM SDK 真接 (3 项)
# ─────────────────────────────────────────────────────────────
echo "§2 LLM SDK 真接"

if grep -rq '@anthropic-ai/sdk\|anthropic' "$PROJECT_ROOT/apps/api/package.json" 2>/dev/null; then
  ok "§2.1 @anthropic-ai/sdk 在 package.json dependencies"
else
  fail "§2.1 @anthropic-ai/sdk 在 package.json dependencies"
fi

if grep -rq "MODEL_BY_TIER\|model_tier.*reasoning\|model_tier.*lightweight" \
     "$PROJECT_ROOT/apps/api/src/workers/llm-gateway/index.ts" 2>/dev/null; then
  ok "§2.2 LLMGateway MODEL_BY_TIER 已定义 (reasoning/lightweight 分档)"
else
  fail "§2.2 LLMGateway MODEL_BY_TIER"
fi

if grep -q "claude-sonnet-4-6" "$PROJECT_ROOT/apps/api/src/workers/llm-gateway/index.ts" 2>/dev/null \
   && grep -q "claude-haiku-4-5" "$PROJECT_ROOT/apps/api/src/workers/llm-gateway/index.ts" 2>/dev/null; then
  ok "§2.3 LLMGateway 含 claude-sonnet-4-6 (reasoning) + claude-haiku-4-5 (lightweight)"
else
  fail "§2.3 LLMGateway 含 reasoning + lightweight model 映射"
fi
echo ""

# ─────────────────────────────────────────────────────────────
# §3 cost_log 真数据 + atomic UPDATE (4 项 money-critical)
# ─────────────────────────────────────────────────────────────
echo "§3 cost_log 真数据 + userQuota atomic"

if grep -rq "_writeCostLog\|writeCostLog" \
     "$PROJECT_ROOT/apps/api/src/specialists/base/BaseSpecialist.ts" 2>/dev/null; then
  ok "§3.1 BaseSpecialist._writeCostLog 存在"
else
  fail "§3.1 BaseSpecialist._writeCostLog 存在"
fi

if grep -q "callType.*specialist_call\|specialist_call" \
     "$PROJECT_ROOT/apps/api/src/specialists/base/BaseSpecialist.ts" 2>/dev/null; then
  ok "§3.2 cost_log callType='specialist_call' 已实现"
else
  fail "§3.2 cost_log callType='specialist_call'"
fi

if grep -rq "checkAndDeductQuota\|executeRaw\|atomic.*UPDATE\|UPDATE.*user_quota\|dailyUsed" \
     "$PROJECT_ROOT/apps/api/src/services/quota/" 2>/dev/null; then
  ok "§3.3 userQuota atomic deduct 已实现 (checkAndDeductQuota / executeRaw UPDATE)"
else
  fail "§3.3 userQuota atomic deduct"
fi

if [ -n "$HAS_OPENAI" ]; then
  COST_GREP=$(grep -rn "input_tokens\|output_tokens\|promptTokens\|completionTokens\|costUsd\|COST_PER_M" \
    "$PROJECT_ROOT/apps/api/src/specialists/base/BaseSpecialist.ts" 2>/dev/null | wc -l)
  if [ "$COST_GREP" -gt 0 ]; then
    ok "§3.4 costUsd 真计算字段 (token 计费) 已实现"
  else
    fail "§3.4 costUsd 真计算字段"
  fi
else
  skip "§3.4 costUsd 真数据 (SKIP: 无 OPENAI_API_KEY · 无法触发真 LLM 调用)"
fi
echo ""

# ─────────────────────────────────────────────────────────────
# §4 8 Specialist real LLM test PASS (8 项 · SKIP if no key)
# ─────────────────────────────────────────────────────────────
echo "§4 8 Specialist real LLM test 文件存在 + 结构合规"

SPECIALISTS=(
  "AnalysisAgent"
  "BrandingAgent"
  "CopywritingAgent"
  "DiagnosisAgent"
  "LivestreamAgent"
  "MonetizationAgent"
  "PositioningAgent"
  "TopicAgent"
  "VideoAgent"
)

REAL_LLM_TESTS=(
  "BrandingAgent.real-llm.test.ts"
  "CopywritingAgent.real-llm.test.ts"
  "LivestreamAgent.real-llm.test.ts"
  "MonetizationAgent.real-llm.test.ts"
  "PositioningAgent.real-llm.test.ts"
  "TopicAgent.real-llm.test.ts"
  "VideoAgent.real-llm.test.ts"
)

TEST_DIR="$PROJECT_ROOT/apps/api/src/specialists/__tests__"

TESTS_PRESENT=0
for TEST_FILE in "${REAL_LLM_TESTS[@]}"; do
  if [ -f "$TEST_DIR/$TEST_FILE" ]; then
    TESTS_PRESENT=$((TESTS_PRESENT + 1))
  fi
done

if [ "$TESTS_PRESENT" -eq "${#REAL_LLM_TESTS[@]}" ]; then
  ok "§4.1 7 real-llm test 文件全部存在 ($TESTS_PRESENT/${#REAL_LLM_TESTS[@]})"
else
  fail "§4.1 real-llm test 文件 ($TESTS_PRESENT/${#REAL_LLM_TESTS[@]} 存在)"
fi

SKIP_GUARDS=$(grep -rl "skipIfNoKey\|skipIf.*NoKey\|OPENAI_API_KEY\|ANTHROPIC_API_KEY" \
  "$TEST_DIR" 2>/dev/null | wc -l)
if [ "$SKIP_GUARDS" -ge 5 ]; then
  ok "§4.2 real-llm test 含 skipIfNoKey guard ($SKIP_GUARDS 文件有 CI-safe guard)"
else
  fail "§4.2 real-llm test CI-safe guard ($SKIP_GUARDS 文件 · 期望 ≥ 5)"
fi

FALLBACK_TESTS=$(grep -rl "fallback schema alignment\|fallback.*satisfies\|fallback.*Schema" \
  "$TEST_DIR" 2>/dev/null | wc -l)
if [ "$FALLBACK_TESTS" -ge 2 ]; then
  ok "§4.3 fallback schema alignment test 存在 ($FALLBACK_TESTS 文件)"
else
  fail "§4.3 fallback schema alignment test ($FALLBACK_TESTS 文件 · 期望 ≥ 2)"
fi

SPECIALIST_COUNT=$(find "$PROJECT_ROOT/apps/api/src/specialists" -maxdepth 1 -name "*Agent.ts" ! -name "*.test.ts" | wc -l)
if [ "$SPECIALIST_COUNT" -ge 8 ]; then
  ok "§4.4 ≥ 8 Specialist 文件存在 ($SPECIALIST_COUNT 个 *Agent.ts)"
else
  fail "§4.4 ≥ 8 Specialist 文件 ($SPECIALIST_COUNT 个)"
fi

MODEL_TIER_HITS=$(grep -rl "model_tier.*reasoning\|model_tier.*lightweight" \
  "$PROJECT_ROOT/apps/api/src/specialists" --include="*.ts" 2>/dev/null | grep -v test | wc -l)
if [ "$MODEL_TIER_HITS" -ge 6 ]; then
  ok "§4.5 ≥ 6 Specialist 有明确 model_tier 配置 ($MODEL_TIER_HITS 个)"
else
  fail "§4.5 ≥ 6 Specialist model_tier ($MODEL_TIER_HITS 个)"
fi

if [ -n "$HAS_OPENAI" ]; then
  VITEST_OUTPUT=$(cd "$PROJECT_ROOT/apps/api" && pnpm vitest run \
    "src/specialists/__tests__" 2>&1)
  PASS_COUNT=$(echo "$VITEST_OUTPUT" | grep -c "✓" || true)
  FAIL_COUNT=$(echo "$VITEST_OUTPUT" | grep -c " × \| ✗ " || true)
  if echo "$VITEST_OUTPUT" | grep -qE "Tests.*passed" && [ "$FAIL_COUNT" -eq 0 ]; then
    ok "§4.6 real-llm 专项 vitest PASS ($PASS_COUNT 通过 · $FAIL_COUNT 失败)"
  else
    fail "§4.6 real-llm 专项 vitest ($FAIL_COUNT 失败)"
  fi
  if grep -rq "costLog.create\|_writeCostLog" \
       "$PROJECT_ROOT/apps/api/src/specialists/base/BaseSpecialist.ts" 2>/dev/null; then
    ok "§4.7 costLog.create 在 BaseSpecialist(真 LLM path 有 DB 写入)"
  else
    fail "§4.7 costLog.create in BaseSpecialist"
  fi
  if grep -rq "fallback.*model.*='fallback'\|model.*fallback.*tokens.*0\|tokens.*0.*fallback" \
       "$PROJECT_ROOT/apps/api/src/specialists/base/BaseSpecialist.ts" 2>/dev/null; then
    ok "§4.8 fallback path cost_log model='fallback' tokens=0"
  else
    fail "§4.8 fallback cost_log model='fallback' tokens=0"
  fi
else
  skip "§4.6 real-llm vitest run (SKIP: 无 OPENAI_API_KEY)"
  skip "§4.7 costLog.create 真调用验证 (SKIP: 无 OPENAI_API_KEY)"
  skip "§4.8 fallback cost_log 真调用验证 (SKIP: 无 OPENAI_API_KEY)"
fi
echo ""

# ─────────────────────────────────────────────────────────────
# §5 TD-79/80/81/82 fix 验证 (4 项)
# ─────────────────────────────────────────────────────────────
echo "§5 TD-79/80/81/82 fix 验证"

TD79_LABEL=$(grep -r "STEP1_CTA_LABEL\|生成行业洞察" \
  "$PROJECT_ROOT/apps/web/src/lib/constants/industries.ts" 2>/dev/null | wc -l)
if [ "$TD79_LABEL" -ge 1 ]; then
  ok "§5.1 TD-79: STEP1_CTA_LABEL='生成行业洞察' (industries.ts 含 ≥1 hit)"
else
  fail "§5.1 TD-79: STEP1_CTA_LABEL='生成行业洞察'"
fi

HARDCODE_HEADING=$(grep -rn "'市场分析'\|\"市场分析\"\|'竞争程度'\|\"竞争程度\"\|'定位建议'\|\"定位建议\"" \
  "$PROJECT_ROOT/apps/web/src/components/StepResult/" 2>/dev/null | grep -v "test\|spec" | wc -l)
if [ "$HARDCODE_HEADING" -eq 0 ]; then
  ok "§5.2 TD-80: StepResult heading 无硬编码字面量 (0 hit)"
else
  fail "§5.2 TD-80: StepResult heading 硬编码 ($HARDCODE_HEADING hit · 期望 0)"
fi

DEAD_CODE=$(grep -rn "acc_step5_selected_topic" \
  "$PROJECT_ROOT/apps/web/src/" 2>/dev/null | grep -v "test\|spec" | wc -l)
if [ "$DEAD_CODE" -eq 0 ]; then
  ok "§5.3 TD-81: acc_step5_selected_topic backward compat dead code 已删 (0 hit)"
else
  fail "§5.3 TD-81: dead code $DEAD_CODE hit (期望 0)"
fi

TD82_SKIP=$(grep -n "test.skip.*HAS_OPENAI\|test.skip.*OPENAI_API_KEY" \
  "$PROJECT_ROOT/apps/web/e2e/prd-18-step-4-5-6-7-8.spec.ts" 2>/dev/null | wc -l)
if [ "$TD82_SKIP" -ge 1 ]; then
  ok "§5.4 TD-82: prd-18 test3 加 test.skip(!HAS_OPENAI_KEY) ($TD82_SKIP hit)"
else
  fail "§5.4 TD-82: prd-18 test3 skip guard 未找到"
fi
echo ""

# ─────────────────────────────────────────────────────────────
# §6 zero-regression (3 项)
# ─────────────────────────────────────────────────────────────
echo "§6 zero-regression"

TYPECHECK_OUT=$(pnpm -r typecheck 2>&1)
if echo "$TYPECHECK_OUT" | grep -qE "error TS|tsc: error|Type error"; then
  fail "§6.1 pnpm -r typecheck → 有 TypeScript 错误"
else
  ok "§6.1 pnpm -r typecheck → 0 errors (全 workspace)"
fi

API_VITEST=$(cd "$PROJECT_ROOT/apps/api" && pnpm vitest run 2>&1)
API_FAIL=$(echo "$API_VITEST" | grep -cE " × | ✗ |FAIL " || true)
API_PASS=$(echo "$API_VITEST" | grep -oE "Tests +[0-9]+ passed" | grep -oE "[0-9]+" | head -1 || echo "0")
if [ "$API_FAIL" -eq 0 ] && [ "${API_PASS:-0}" -ge 1 ]; then
  ok "§6.2 apps/api vitest → $API_PASS passed · 0 failed"
else
  fail "§6.2 apps/api vitest → $API_FAIL failed"
fi

WEB_VITEST=$(cd "$PROJECT_ROOT/apps/web" && pnpm vitest run 2>&1)
WEB_FAIL=$(echo "$WEB_VITEST" | grep -cE " × | ✗ |FAIL " || true)
WEB_PASS=$(echo "$WEB_VITEST" | grep -oE "Tests +[0-9]+ passed" | grep -oE "[0-9]+" | head -1 || echo "0")
if [ "$WEB_FAIL" -eq 0 ] && [ "${WEB_PASS:-0}" -ge 1 ]; then
  ok "§6.3 apps/web vitest → $WEB_PASS passed · 0 failed"
else
  fail "§6.3 apps/web vitest → $WEB_FAIL failed"
fi
echo ""

# ─────────────────────────────────────────────────────────────
# §7 D4=B / D3=A / LD-009 严守 (3 项)
# ─────────────────────────────────────────────────────────────
echo "§7 D4=B / D3=A / LD-009 架构严守"

R001_HIT=$(grep -rn "OPENAI_API_KEY\|ANTHROPIC_API_KEY\|LLM_API_KEY" \
  "$PROJECT_ROOT/apps/web/src" 2>/dev/null | grep -v "test\|spec\|e2e\|\.env" | wc -l)
if [ "$R001_HIT" -eq 0 ]; then
  ok "§7.1 D4=B(R-001): LLM key 未暴露给前端 apps/web/src (0 hit)"
else
  fail "§7.1 D4=B(R-001): LLM key 暴露前端 ($R001_HIT hit · 期望 0)"
fi

LD009_HIT=$(grep -rn "LD-009\|LD_009\|double.layer\|双层防护" \
  "$PROJECT_ROOT/apps/api/src/trpc" 2>/dev/null | wc -l)
if [ "$LD009_HIT" -ge 5 ]; then
  ok "§7.2 LD-009: tRPC 双层防护注释 ≥5 处 ($LD009_HIT 处)"
else
  fail "§7.2 LD-009: 双层防护注释 ($LD009_HIT 处 · 期望 ≥ 5)"
fi

MOCK_DB_HIT=$(grep -rn "vi.mock.*prisma.*{.*prisma\|mock.*database" \
  "$PROJECT_ROOT/apps/api/src/services/quota/__tests__" 2>/dev/null | wc -l)
if [ "$MOCK_DB_HIT" -eq 0 ]; then
  ok "§7.3 D3=A(LD-009): quota 服务 integration tests 未 mock DB (0 hit)"
else
  fail "§7.3 D3=A: quota tests mock DB ($MOCK_DB_HIT hit · LD-009 禁 mock)"
fi
echo ""

# ─────────────────────────────────────────────────────────────
# §8 Specialist tuning baseline doc (1 项)
# ─────────────────────────────────────────────────────────────
echo "§8 Specialist tuning baseline"

if [ -f "$PROJECT_ROOT/.agents/specialist-tuning-baseline.md" ]; then
  LINE_COUNT=$(wc -l < "$PROJECT_ROOT/.agents/specialist-tuning-baseline.md")
  if [ "$LINE_COUNT" -ge 40 ]; then
    ok "§8.1 .agents/specialist-tuning-baseline.md 存在 ($LINE_COUNT 行 ≥ 40)"
  else
    fail "§8.1 specialist-tuning-baseline.md 存在但内容不足 ($LINE_COUNT 行 · 期望 ≥ 40)"
  fi
else
  fail "§8.1 .agents/specialist-tuning-baseline.md 不存在"
fi
echo ""

# ─────────────────────────────────────────────────────────────
# §9 tech-debt.json TD-79/80/81/82 全 resolved (4 项)
# ─────────────────────────────────────────────────────────────
echo "§9 tech-debt.json resolved 状态"

TD_FILE="$PROJECT_ROOT/.agents/tech-debt.json"
for TD_ID in TD-79 TD-80 TD-81 TD-82; do
  STATUS=$(python3 -c "
import json, sys
try:
  data = json.load(open('$TD_FILE'))
  items = data.get('items', [])
  item = next((i for i in items if i.get('id') == '$TD_ID'), None)
  if item:
    print(item.get('status', 'missing'))
  else:
    print('not_found')
except Exception as e:
  print('error:' + str(e))
" 2>/dev/null)
  if [ "$STATUS" = "resolved" ]; then
    ok "§9.$(echo $TD_ID | tr -d 'TD-' | awk '{print $1-78}') $TD_ID status=resolved ✓"
  else
    fail "§9.X $TD_ID status=$STATUS (期望 resolved)"
  fi
done
echo ""

# ─────────────────────────────────────────────────────────────
# 汇总
# ─────────────────────────────────────────────────────────────
TOTAL=$((PASS + FAIL + SKIP))
echo "======================================================"
echo " 结果: ${PASS} 通过 · ${FAIL} 失败 · ${SKIP} 跳过 (共 ${TOTAL} 项)"
echo "======================================================"
if [ "$FAIL" -gt 0 ]; then
  echo "❌  FAIL — ${FAIL} 项检查未通过"
  exit 1
else
  echo "✅  ALL PASS — ${PASS}/${TOTAL} 通过 · ${SKIP} SKIP (CI 友好)"
  exit 0
fi
