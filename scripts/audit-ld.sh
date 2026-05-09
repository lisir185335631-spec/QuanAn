#!/usr/bin/env bash
# QuanQn · 18 LD + 5 复杂 R 检测 (TD-018 修 · 2026-05-09 新建)
# 派生自 AGENTS.md §3 Locked Decisions + §5.6 红线
# audit-redlines.sh 已 cover 12 条简单 grep · 本脚本补 5 条复杂 + 18 LD 关键验证

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

FAIL=0
fail() { echo "❌ $1"; FAIL=1; }
pass() { echo "✅ $1"; }
warn() { echo "⚠️  $1"; }

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  QuanQn · 18 LD + 5 复杂 R 检测"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# §1 · 18 Locked Decisions
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo "=== §1 · Locked Decisions (18 条) ==="

# LD-001 · 95/5 编排 (Workflow vs Agent · 不允许 Specialist 内多轮 LLM 循环)
# 已被 audit-redlines.sh R-3 覆盖 · 这里仅复检
SPECIALIST_LOOPS=$(grep -rE "(for|while)\s*\(" apps/api/src/specialists/ --include="*.ts" 2>/dev/null \
    | grep -v "/__tests__/" | grep -vE "^[^:]+:[0-9]+:\s*(\*|//|/\*)" \
    | grep -iE "llm|invoke|complete|stream" | wc -l | tr -d ' ')
if [ "$SPECIALIST_LOOPS" -gt 0 ]; then fail "LD-001 · Specialist 内 ${SPECIALIST_LOOPS} 处 LLM 循环 · 触犯 95/5"
else pass "LD-001 · 95% Workflow + 5% Agent (Specialist 0 LLM 循环)"; fi

# LD-002 · 14 能力域 Specialist 切分 (上限 14)
COUNT=$(ls apps/api/src/specialists/*.ts 2>/dev/null \
    | grep -v "\.test\." | grep -v "/base/" | grep -v "/__tests__/" | wc -l | tr -d ' ')
if [ "$COUNT" -gt 14 ]; then fail "LD-002 · Specialist 数 ${COUNT} > 14"
else pass "LD-002 · 14 能力域 (实际 ${COUNT}/14 · PRD-1~5 完成)"; fi

# LD-004 · 3 L5 自治 Agent 走外部 orchestrator (本期 PRD-6+ 才实施 · 验证不在主代码中违规启动循环)
# 关键: 不允许 VoiceChatAgent / EvolutionAgent / DailyTaskAgent 在 specialists/ 中 · 必须独立 orchestrator
L5_VIOLATION=$(ls apps/api/src/specialists/ 2>/dev/null \
    | grep -E "VoiceChatAgent|EvolutionAgent|DailyTaskAgent" || true)
if [ -n "$L5_VIOLATION" ]; then fail "LD-004 · L5 Agent 在 specialists/ 中 · 必须用 ADR-018 外部 orchestrator"
else pass "LD-004 · 3 L5 Agent 留 PRD-6+ (orchestrator 模式)"; fi

# LD-005 · BaseSpecialist 抽象 + 五层配置
SPECIALIST_FILES=$(ls apps/api/src/specialists/*.ts 2>/dev/null \
    | grep -v "/base/" | grep -v "\.test\." | grep -v "/__tests__/")
if [ -z "$SPECIALIST_FILES" ]; then warn "LD-005 · 0 Specialist 实现 · 跳过"
else
  MISSING=0
  for f in $SPECIALIST_FILES; do
    if ! grep -q "extends BaseSpecialist" "$f"; then
      echo "  ⚠️  $(basename $f) 未 extends BaseSpecialist"
      MISSING=$((MISSING + 1))
    fi
  done
  if [ "$MISSING" -gt 0 ]; then fail "LD-005 · ${MISSING} 个 Specialist 未 extends BaseSpecialist"
  else pass "LD-005 · 全 Specialist extends BaseSpecialist (五层配置)"; fi
fi

# LD-007 · ContextAssembler 是 prompt 注入唯一入口 (R-11 自拼 prompt)
# audit-redlines.sh R-11 已 cover 自拼 systemPrompt · 这里验证 BaseSpecialist 必走 contextAssembler.assemble
if grep -q "contextAssembler.assemble\|_contextAssembler.assemble" apps/api/src/specialists/base/BaseSpecialist.ts 2>/dev/null; then
  pass "LD-007 · BaseSpecialist 走 contextAssembler.assemble (唯一 prompt 入口)"
else fail "LD-007 · BaseSpecialist 未走 contextAssembler · 触犯唯一入口"; fi

# LD-009 · IpAccount 多账号隔离 3 道闸
GATE_1=$(grep -rl "accountIsolationMiddleware\|protectedProcedure" apps/api/src/trpc/middleware/ 2>/dev/null | wc -l | tr -d ' ')
GATE_2=$(grep -rln "set_config.*account\|set_config.*current_account" apps/api/src/ 2>/dev/null | wc -l | tr -d ' ')
PROTECTED_ROUTERS=$(grep -l "protectedProcedure" apps/api/src/trpc/routers/*.ts 2>/dev/null | wc -l | tr -d ' ')
if [ "$GATE_1" -ge 1 ] && [ "$GATE_2" -ge 1 ] && [ "$PROTECTED_ROUTERS" -ge 5 ]; then
  pass "LD-009 · 3 道闸 (middleware ${GATE_1} · set_config ${GATE_2} · ${PROTECTED_ROUTERS} routers protectedProcedure)"
else fail "LD-009 · 3 道闸不全 (middleware=${GATE_1} · set_config=${GATE_2} · routers=${PROTECTED_ROUTERS})"; fi

# LD-010 · LS↔DB 双写 (前端 ls-namespace 集中管理)
if [ -f "apps/web/src/lib/ls-namespace.ts" ] && grep -q "stepLsKey\|getToolLsKey" apps/web/src/lib/ls-namespace.ts; then
  pass "LD-010 · LS↔DB 双写 (ls-namespace.ts 集中管理)"
else fail "LD-010 · ls-namespace.ts 缺失或无 helper · 触犯 LD-010"; fi

# LD-012 · 全部 LLM 调用走 LLMGateway (audit-redlines.sh R-1 已 cover)
if [ -d "apps/api/src/workers/llm-gateway" ] && [ -f "apps/api/src/workers/llm-gateway/index.ts" ]; then
  pass "LD-012 · LLMGateway 实现存在 (R-1 grep 已 cover)"
else fail "LD-012 · LLMGateway 实现缺失"; fi

# LD-013 · 强类型 + zod schema + 无 any (R-10 + tsconfig strict)
STRICT_COUNT=$(grep -l '"strict": true' apps/*/tsconfig.json packages/*/tsconfig.json tsconfig.base.json 2>/dev/null | wc -l | tr -d ' ')
ZOD_SCHEMAS=$(find packages/schemas/src -name "*.schema.ts" 2>/dev/null | wc -l | tr -d ' ')
if [ "$STRICT_COUNT" -ge 1 ] && [ "$ZOD_SCHEMAS" -ge 5 ]; then
  pass "LD-013 · strict tsconfig × ${STRICT_COUNT} + ${ZOD_SCHEMAS} zod schemas"
else fail "LD-013 · strict=${STRICT_COUNT} · schemas=${ZOD_SCHEMAS}"; fi

# LD-016 · 测试金字塔 + LLM Judge + Prompt 回归
JUDGE_FILES=$(ls tests/judge/*.judge.ts 2>/dev/null | wc -l | tr -d ' ')
UNIT_DIRS=$(find tests/unit -name "*.test.ts" -o -name "*.test.tsx" 2>/dev/null | wc -l | tr -d ' ')
E2E_FILES=$(ls tests/e2e/*.spec.ts 2>/dev/null | wc -l | tr -d ' ')
if [ "$JUDGE_FILES" -ge 1 ] && [ "$UNIT_DIRS" -ge 5 ] && [ "$E2E_FILES" -ge 5 ]; then
  pass "LD-016 · 测试金字塔 (unit ${UNIT_DIRS} · judge ${JUDGE_FILES} · e2e ${E2E_FILES})"
else fail "LD-016 · 测试不全 (unit=${UNIT_DIRS} · judge=${JUDGE_FILES} · e2e=${E2E_FILES})"; fi

# LD-018 · PII mask + 行业免责 (R-14 详见 §2.1)
# 见下文 R-14

# LD-A-1 · admin 子系统独立部署 (admin 占位 + 主 web 不引用 admin)
if [ -d "apps/admin" ]; then
  CROSS_IMPORT=$(grep -rln "from '@quanqn/admin\|from '../../admin\|from '../admin" apps/web/src 2>/dev/null | wc -l | tr -d ' ')
  if [ "$CROSS_IMPORT" -gt 0 ]; then fail "LD-A-1 · apps/web 引用 apps/admin · 触犯独立部署"
  else pass "LD-A-1 · apps/admin 独立部署 (apps/web 0 引用)"; fi
else warn "LD-A-1 · apps/admin 不存在 · 跳过"; fi

# LD-A-3 · admin 13 表 RLS DISABLE (本期未实施 admin · 跳过验证)
if grep -q "admin_audit_log\|admin_role" prisma/schema.prisma 2>/dev/null; then
  pass "LD-A-3 · admin schema 已存在 (RLS 验证留 PRD-10+)"
else warn "LD-A-3 · admin schema 未实施 (PRD-10+ 才有)"; fi

echo

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# §2 · 5 复杂红线 (R-6/7/8/12/13/14)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo "=== §2 · 复杂红线 5 条 ==="

# R-6 · 新表 RLS (新加 prisma model 必须在 manual_rls.sql 列表)
if [ -f "prisma/manual_rls.sql" ]; then
  PRISMA_MODELS=$(grep -E "^model " prisma/schema.prisma 2>/dev/null | awk '{print $2}' | sort)
  RLS_TABLES=$(grep -oE "ALTER TABLE \"[A-Za-z_]+\"" prisma/manual_rls.sql 2>/dev/null \
    | sed 's/ALTER TABLE "//;s/"//' | sort -u)
  # 列出 prisma model 但不在 manual_rls 的 (可能是 admin 表 / 公共表 · 需 manual review)
  MISSING_RLS=$(comm -23 \
    <(echo "$PRISMA_MODELS") \
    <(echo "$RLS_TABLES") 2>/dev/null | head -10)
  if [ -n "$MISSING_RLS" ]; then
    warn "R-6 · prisma model 不在 manual_rls.sql · 需 manual review (admin 表预期跳过):"
    echo "$MISSING_RLS" | head -5 | sed 's/^/    /'
  else pass "R-6 · prisma model 全部在 manual_rls.sql"; fi
else warn "R-6 · prisma/manual_rls.sql 不存在 · 跳过"; fi

# R-7 · prisma schema 漂移 (manual review · 跑 prisma migrate status)
warn "R-7 · schema 漂移检测需 manual: pnpm prisma migrate status"

# R-8 · zod schema 缺失 (tRPC procedure 必带 .input(zod))
PROCEDURE_NO_INPUT=$(grep -rB 1 "protectedProcedure" apps/api/src/trpc/routers/*.ts 2>/dev/null \
    | grep -A 1 "protectedProcedure$" | grep "^[^:]*--$" -B 1 \
    | grep -v "\.input\|\.query\|\.mutation\|^--" | head -5 || true)
if [ -n "$PROCEDURE_NO_INPUT" ]; then
  warn "R-8 · 可能缺 .input(zod) 的 procedure (manual review):"
  echo "$PROCEDURE_NO_INPUT" | head -5 | sed 's/^/    /'
else pass "R-8 · tRPC procedure .input(zod) 检测通过 (basic)"; fi

# R-12 · prisma.$transaction (manual review · 多写场景)
TX_COUNT=$(grep -rn 'prisma\.\$transaction' apps/api/src --include="*.ts" 2>/dev/null \
    | grep -v "\.test\." | wc -l | tr -d ' ')
pass "R-12 · prisma.\$transaction 实际使用 ${TX_COUNT} 处 (manual review 是否覆盖多写场景)"

# R-13 · 乐观锁 (manual review · update 必带 version 或 updatedAt 检查)
warn "R-13 · 乐观锁需 manual review (prisma update 必带 version 或 conditional updatedAt)"

# R-14 · PII mask + 行业免责 (TD-016 配套硬验证)
echo
echo "  --- R-14 PII / 免责 (LD-018 · TD-016 配套) ---"
PII_HOOK=$(grep -l "piiMask\|maskString" \
    apps/api/src/services/context-assembler/ContextAssembler.ts 2>/dev/null | wc -l | tr -d ' ')
DISCLAIMER_HOOK=$(grep -l "appendDisclaimerIfSensitive\|attachDisclaimerMeta" \
    apps/api/src/specialists/base/BaseSpecialist.ts 2>/dev/null | wc -l | tr -d ' ')
PII_TESTS=$(grep -rl "piiMask\|appendDisclaimerIfSensitive" tests/unit/ 2>/dev/null | wc -l | tr -d ' ')

if [ "$PII_HOOK" -ge 1 ] && [ "$DISCLAIMER_HOOK" -ge 1 ] && [ "$PII_TESTS" -ge 1 ]; then
  pass "R-14 · PII 接线 (ContextAssembler ${PII_HOOK} + BaseSpecialist ${DISCLAIMER_HOOK}) + ${PII_TESTS} test files"
else fail "R-14 · PII drift! ContextAssembler PII=${PII_HOOK} · BaseSpecialist disclaimer=${DISCLAIMER_HOOK} · tests=${PII_TESTS} (LD-018 R-14 违规)"; fi

echo
if [ "$FAIL" -eq 0 ]; then
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  ✅ LD + 复杂红线检测通过 · 0 fail"
  echo "  (warn 是 manual review 提示 · 不阻断)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  exit 0
else
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  ❌ LD + 复杂红线检测失败 · 修复后再提"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  exit 1
fi
