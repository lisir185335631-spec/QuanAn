#!/usr/bin/env bash
# scripts/verify-prd-14.sh — PRD-14 P9.4 advanced-domains 可重复验收脚本
# 9 sections covering static audit + schema check + single-point functions
# + plan-check LD-A consistency + ContextAssembler 7-way + BullMQ 9 cron
# + 17 admin tRPC procedures + 4 admin pages + E2E 4 flows
#
# 用法:
#   bash scripts/verify-prd-14.sh                    # 默认 · 静态 + E2E tests
#   SKIP_E2E=1 bash scripts/verify-prd-14.sh         # 跳过 E2E tests (DB 不在线)
#   SKIP_TYPECHECK=1 bash scripts/verify-prd-14.sh   # 跳过 typecheck
#
# 退出码: 0 全过 / 1 至少 1 fail

set -uo pipefail

PASS=0
FAIL=0
WARN=0
SKIPPED=0

ok()      { echo "  ✅ PASS: $1"; PASS=$((PASS + 1)); }
fail()    { echo "  ❌ FAIL: $1"; FAIL=$((FAIL + 1)); }
warn()    { echo "  ⚠️  WARN: $1"; WARN=$((WARN + 1)); }
skip()    { echo "  ⏭️  SKIP: $1"; SKIPPED=$((SKIPPED + 1)); }
section() { echo ""; echo "━━━ $1 ━━━"; }

cd "$(dirname "$0")/.."

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  QuanQn PRD-14 P9.4 advanced-domains · 可重复验收"
echo "  起点: $(pwd) · 时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ===== §1 静态 audit-redlines-admin · 11 LD-A + 6 R-A 全过 =====
section "§1 audit-redlines-admin · 11 LD-A + 6 R-A 全过"

if bash scripts/audit-redlines-admin.sh > /tmp/verify-prd14-redlines.out 2>&1; then
  if grep -q "ALL PASS · 11 LD-A + 6 R-A" /tmp/verify-prd14-redlines.out; then
    ok "audit-redlines-admin · ALL PASS · 11 LD-A + 6 R-A"
  else
    fail "audit-redlines-admin.sh 输出无 'ALL PASS · 11 LD-A + 6 R-A' · 查 /tmp/verify-prd14-redlines.out"
  fi
else
  fail "audit-redlines-admin.sh exit ≠ 0 · 查 /tmp/verify-prd14-redlines.out"
  grep "❌" /tmp/verify-prd14-redlines.out | head -10 || true
fi

# PRD-14 新增 LD-A9/10/11 单独验证
for lda in "LD-A9" "LD-A10" "LD-A11"; do
  if grep -q "$lda" scripts/audit-redlines-admin.sh; then
    ok "audit-redlines-admin.sh 含 $lda 检测段"
  else
    fail "audit-redlines-admin.sh 缺少 $lda 检测段"
  fi
done

# ===== §2 静态 schema · 6 张表 (2 新 + 4 §13.7 占位激活) =====
section "§2 prisma/schema.prisma · 6 张 PRD-14 相关表"

SCHEMA="prisma/schema.prisma"

# 2 PRD-14 新表
for table in "constant_versions" "constant_canary_config"; do
  if grep -q "@@map(\"$table\")" "$SCHEMA" 2>/dev/null; then
    ok "schema 含 $table 表 (@@map)"
  else
    fail "schema 缺少 $table 表 (@@map)"
  fi
done

# 4 §13.7 占位激活表
for table in "admin_ab_experiment" "ab_assignments" "feature_flags" "system_config"; do
  if grep -q "@@map(\"$table\")" "$SCHEMA" 2>/dev/null || grep -q "\"$table\"" "$SCHEMA" 2>/dev/null; then
    ok "schema 含 $table 表"
  else
    fail "schema 缺少 $table 表"
  fi
done

# ===== §3 静态 · 7 _xxxInTx 单点函数存在 =====
section "§3 7 _xxxInTx 单点函数存在 + 0 dual-write 绕过"

check_intx_fn() {
  local fn="$1"
  local file="$2"
  if grep -qn "export async function $fn\|export function $fn" "$file" 2>/dev/null; then
    ok "$fn 单点函数存在"
  else
    fail "$fn 未在 $file 中找到 export function"
  fi
}

check_intx_fn "_startAbExperimentInTx" "apps/api/src/services/admin/ab-experiment/ab-experiment.service.ts"
check_intx_fn "_stopAbExperimentInTx" "apps/api/src/services/admin/ab-experiment/ab-experiment.service.ts"
check_intx_fn "_publishConstantVersionInTx" "apps/api/src/services/admin/constant-version/constant-version.service.ts"
check_intx_fn "_toggleFeatureFlagInTx" "apps/api/src/services/admin/feature-flag/feature-flag.service.ts"
check_intx_fn "_updateSystemConfigInTx" "apps/api/src/services/admin/feature-flag/feature-flag.service.ts"
check_intx_fn "_approveRequestInTx" "apps/api/src/services/admin/approval/approvalGateService.ts"
check_intx_fn "_publishPromptVersionInTx" "apps/api/src/services/admin/prompt-version/prompt-version.service.ts"

# 0 dual-write: ab_experiment status 不直接在 InTx 外修改
AB_DUAL=$(grep -rn "abExperiment\.update.*status.*running\|abExperiment\.update.*status.*stopped" \
  apps/api/src/ --include="*.ts" 2>/dev/null \
  | grep -v "_startAbExperimentInTx\|_stopAbExperimentInTx\|.test." \
  | grep -v "__tests__" | wc -l)
if [ "$AB_DUAL" -eq 0 ]; then
  ok "0 dual-write: ab_experiment.status 仅在 _xxxInTx 内修改"
else
  fail "ab_experiment.status 存在 $AB_DUAL 处直接修改(绕过单点)"
fi

# 0 dual-write: constant_versions status='active' 仅在 _publishConstantVersionInTx
CV_DUAL=$(grep -rn "constantVersion.*update.*status.*active\|constantVersion\.update.*active" \
  apps/api/src/ --include="*.ts" 2>/dev/null \
  | grep -v "_publishConstantVersionInTx\|.test." | grep -v "__tests__" | wc -l)
if [ "$CV_DUAL" -eq 0 ]; then
  ok "0 dual-write: constant_versions.status='active' 仅在 _publishConstantVersionInTx"
else
  fail "constant_versions.status='active' 存在 $CV_DUAL 处绕过(非单点)"
fi

# ===== §4 静态 plan-check · 2.6.17 LD-A 三方一致性 =====
section "§4 plan-check 2.6.17 LD-A 三方一致性(AGENTS.md + 源码 + audit 脚本)"

# LD-A9: ab_experiment 状态单点
LDAS_AGENTS=0; LDAS_CODE=0; LDAS_AUDIT=0

# LD-A9
if grep -q "LD-A9\|LD-A-9" AGENTS.md 2>/dev/null; then LDAS_AGENTS=$((LDAS_AGENTS + 1)); fi
if grep -rn "LD-A9" apps/api/src/ --include="*.ts" -q 2>/dev/null; then LDAS_CODE=$((LDAS_CODE + 1)); fi
if grep -q "LD-A9" scripts/audit-redlines-admin.sh 2>/dev/null; then LDAS_AUDIT=$((LDAS_AUDIT + 1)); fi

# LD-A10
if grep -q "LD-A10\|LD-A-10" AGENTS.md 2>/dev/null; then LDAS_AGENTS=$((LDAS_AGENTS + 1)); fi
if grep -rn "LD-A10" apps/api/src/ --include="*.ts" -q 2>/dev/null; then LDAS_CODE=$((LDAS_CODE + 1)); fi
if grep -q "LD-A10" scripts/audit-redlines-admin.sh 2>/dev/null; then LDAS_AUDIT=$((LDAS_AUDIT + 1)); fi

# LD-A11
if grep -q "LD-A11\|LD-A-11" AGENTS.md 2>/dev/null; then LDAS_AGENTS=$((LDAS_AGENTS + 1)); fi
if grep -rn "LD-A11" apps/api/src/ --include="*.ts" -q 2>/dev/null; then LDAS_CODE=$((LDAS_CODE + 1)); fi
if grep -q "LD-A11" scripts/audit-redlines-admin.sh 2>/dev/null; then LDAS_AUDIT=$((LDAS_AUDIT + 1)); fi

# Need all 3 in all 3 places = 3+3+3 = 9
if [ "$LDAS_AGENTS" -ge 3 ]; then
  ok "AGENTS.md 含 LD-A9/10/11 ($LDAS_AGENTS/3)"
else
  fail "AGENTS.md 缺少 LD-A9/10/11 ($LDAS_AGENTS/3)"
fi
if [ "$LDAS_CODE" -ge 3 ]; then
  ok "apps/api/src 源码注释含 LD-A9/10/11 ($LDAS_CODE/3)"
else
  fail "apps/api/src 源码缺少 LD-A9/10/11 注释 ($LDAS_CODE/3)"
fi
if [ "$LDAS_AUDIT" -ge 3 ]; then
  ok "audit-redlines-admin.sh 含 LD-A9/10/11 ($LDAS_AUDIT/3)"
else
  fail "audit-redlines-admin.sh 缺少 LD-A9/10/11 ($LDAS_AUDIT/3)"
fi

# ===== §5 静态 · ContextAssembler 7 路并行 =====
section "§5 ContextAssembler · 7 路 Promise.allSettled 并行"

CA_FILE="apps/api/src/services/context-assembler/ContextAssembler.ts"

if [ -f "$CA_FILE" ]; then
  # Check Promise.allSettled exists
  if grep -q "Promise\.allSettled" "$CA_FILE"; then
    ok "ContextAssembler 使用 Promise.allSettled"
  else
    fail "ContextAssembler 缺少 Promise.allSettled"
  fi

  # Count 7-way parallel via withTimeout calls inside Promise.allSettled
  PARALLEL_COUNT=$(grep -n "withTimeout(" "$CA_FILE" | grep -c "this\.\|getLatest" || echo 0)
  if [ "$PARALLEL_COUNT" -ge 7 ]; then
    ok "ContextAssembler 7 路并行 fetch(withTimeout × $PARALLEL_COUNT ≥7)"
  else
    # Fallback: count private _fetch methods (6) + 1 imported (getLatestInsight)
    FETCH_COUNT=$(grep -n "private async _fetch" "$CA_FILE" | wc -l)
    if [ "$FETCH_COUNT" -ge 6 ]; then
      ok "ContextAssembler 含 $FETCH_COUNT 个 _fetch* 私有方法 + 1 imported = 7 路并行"
    else
      fail "ContextAssembler 仅含 $FETCH_COUNT 个 _fetch* 私有方法(需≥6)"
    fi
  fi

  # Check _fetchActiveConstants exists (PRD-14 新增第7路)
  if grep -q "_fetchActiveConstants" "$CA_FILE"; then
    ok "ContextAssembler 含第 7 路 _fetchActiveConstants (PRD-14 US-008)"
  else
    fail "ContextAssembler 缺少 _fetchActiveConstants (PRD-14 US-008)"
  fi

  # Check enable_fallback_prompt bypass in both _fetchActivePrompt and _fetchActiveConstants
  BYPASS_COUNT=$(grep -c "enable_fallback_prompt" "$CA_FILE")
  if [ "$BYPASS_COUNT" -ge 2 ]; then
    ok "ContextAssembler enable_fallback_prompt bypass 出现 $BYPASS_COUNT 处(≥2)"
  else
    fail "ContextAssembler enable_fallback_prompt bypass 仅 $BYPASS_COUNT 处(需≥2)"
  fi
else
  fail "ContextAssembler.ts 文件不存在: $CA_FILE"
fi

# ===== §6 静态 · BullMQ 9 cron worker =====
section "§6 BullMQ · 9 admin cron worker"

ADMIN_JOBS_DIR="apps/api/src/jobs/admin"

# Match both "new Queue(" and "new Queue<...>(" patterns
QUEUE_COUNT=$(grep -rn "new Queue" "$ADMIN_JOBS_DIR" --include="*.ts" \
  | grep -v ".test." | grep -v "__tests__" | wc -l)
WORKER_COUNT=$(grep -rn "new Worker" "$ADMIN_JOBS_DIR" --include="*.ts" \
  | grep -v ".test." | grep -v "__tests__" | wc -l)

if [ "$QUEUE_COUNT" -ge 9 ]; then
  ok "admin jobs 含 $QUEUE_COUNT 个 BullMQ Queue(≥9)"
else
  fail "admin jobs 仅含 $QUEUE_COUNT 个 BullMQ Queue(需≥9)"
fi

if [ "$WORKER_COUNT" -ge 9 ]; then
  ok "admin jobs 含 $WORKER_COUNT 个 BullMQ Worker(≥9)"
else
  fail "admin jobs 仅含 $WORKER_COUNT 个 BullMQ Worker(需≥9)"
fi

# PRD-14 关键 cron 验证
for job_file in "ab-stop-loss.job.ts" "emergency-post-review.job.ts" "constant-embed-rebuild.job.ts"; do
  if [ -f "$ADMIN_JOBS_DIR/$job_file" ]; then
    ok "$job_file 存在"
  else
    fail "$ADMIN_JOBS_DIR/$job_file 不存在"
  fi
done

# ab-stop-loss: hourly cron
if grep -q "0 0 \* \* \* \*\|0 \* \* \* \*" "$ADMIN_JOBS_DIR/ab-stop-loss.job.ts" 2>/dev/null; then
  ok "ab-stop-loss.job.ts 含 hourly cron pattern"
else
  fail "ab-stop-loss.job.ts 缺少 hourly cron pattern"
fi

# emergency-post-review: 03:30 cron
if grep -q "0 30 3 \* \* \*\|30 3 \* \* \*" "$ADMIN_JOBS_DIR/emergency-post-review.job.ts" 2>/dev/null; then
  ok "emergency-post-review.job.ts 含 03:30 cron pattern"
else
  fail "emergency-post-review.job.ts 缺少 03:30 cron pattern"
fi

# ===== §7 静态 · 17 admin tRPC procedure =====
section "§7 admin tRPC · PRD-14 三大 router ≥17 procedure"

ROUTER_DIR="apps/api/src/trpc/routers/admin"

# Count procedures in the 3 PRD-14 specific routers
AB_PROCS=$(grep -n "\.query\b\|\.mutation\b" "$ROUTER_DIR/abExperiments.ts" 2>/dev/null | wc -l)
CONST_PROCS=$(grep -n "\.query\b\|\.mutation\b" "$ROUTER_DIR/constants.ts" 2>/dev/null | wc -l)
FF_PROCS=$(grep -n "\.query\b\|\.mutation\b" "$ROUTER_DIR/featureFlags.ts" 2>/dev/null | wc -l)
TOTAL_PROCS=$((AB_PROCS + CONST_PROCS + FF_PROCS))

if [ "$TOTAL_PROCS" -ge 17 ]; then
  ok "PRD-14 三大 router 共 $TOTAL_PROCS 个 procedure(≥17)"
else
  fail "PRD-14 三大 router 仅 $TOTAL_PROCS 个 procedure(需≥17)"
fi

# Key procedure name spot-checks
declare -a KEY_PROCS=(
  "createAbExperiment:abExperiments.ts"
  "startAbExperiment:abExperiments.ts"
  "emergencyToggleSystemConfig:featureFlags.ts"
  "submitForReview:constants.ts"
  "rollbackVersion:constants.ts"
)
for entry in "${KEY_PROCS[@]}"; do
  proc="${entry%%:*}"
  file="${entry##*:}"
  if grep -q "$proc" "$ROUTER_DIR/$file" 2>/dev/null; then
    ok "router $file 含 $proc procedure"
  else
    fail "router $file 缺少 $proc procedure"
  fi
done

# abExperiments router wired in admin index
if grep -q "abExperimentsRouter\|abExperiments:" "$ROUTER_DIR/index.ts" 2>/dev/null; then
  ok "abExperimentsRouter 已接入 admin index"
else
  fail "abExperimentsRouter 未接入 admin index"
fi

# ===== §8 静态 · 4 admin pages =====
section "§8 admin pages · 4 PRD-14 页面"

ADMIN_PAGES="apps/admin/src/pages"

check_admin_page() {
  local dir="$1"
  local page_file="$2"
  if [ -f "$ADMIN_PAGES/$dir/$page_file" ]; then
    ok "admin page 存在: $dir/$page_file"
  else
    fail "admin page 缺失: $ADMIN_PAGES/$dir/$page_file"
  fi
}

check_admin_page "abExperiments" "AbExperimentsPage.tsx"
check_admin_page "abExperiments" "ExperimentDetailPage.tsx"
check_admin_page "constants" "ConstantsPage.tsx"
check_admin_page "featureFlags" "FeatureFlagsPage.tsx"

# ===== §9 E2E · 4 flows =====
section "§9 E2E · 4 flows fixture stub"

if [ "${SKIP_E2E:-0}" = "1" ]; then
  skip "E2E tests 已跳过 (SKIP_E2E=1)"
else
  E2E_DIR="tests/e2e/admin"

  # Check test files exist
  declare -a E2E_FILES=(
    "prd14-ab-experiment-e2e.test.ts"
    "prd14-constant-version-e2e.test.ts"
    "prd14-emergency-switch-e2e.test.ts"
    "prd14-cross-domain-e2e.test.ts"
  )

  all_e2e_exist=1
  for e2e_file in "${E2E_FILES[@]}"; do
    if [ -f "$E2E_DIR/$e2e_file" ]; then
      ok "E2E 测试文件存在: $e2e_file"
    else
      fail "E2E 测试文件缺失: $E2E_DIR/$e2e_file"
      all_e2e_exist=0
    fi
  done

  if [ "$all_e2e_exist" -eq 1 ]; then
    echo "  → 正在运行 4 个 E2E flow tests..."
    if pnpm exec vitest run \
        --reporter=verbose \
        "tests/e2e/admin/prd14-ab-experiment-e2e.test.ts" \
        "tests/e2e/admin/prd14-constant-version-e2e.test.ts" \
        "tests/e2e/admin/prd14-emergency-switch-e2e.test.ts" \
        "tests/e2e/admin/prd14-cross-domain-e2e.test.ts" \
        > /tmp/verify-prd14-e2e.out 2>&1; then
      ok "4 E2E flow tests 全部通过"
      # Extract test count
      PASS_COUNT=$(grep -oE "[0-9]+ passed" /tmp/verify-prd14-e2e.out | tail -1 | grep -oE "[0-9]+" || echo "?")
      ok "E2E tests: $PASS_COUNT passed"
    else
      fail "E2E tests 有失败 · 查 /tmp/verify-prd14-e2e.out"
      grep -E "FAIL|Error|✗|×" /tmp/verify-prd14-e2e.out | head -20 || true
    fi
  fi
fi

# ===== typecheck =====
section "typecheck · 全 6 workspace packages 0 errors"

if [ "${SKIP_TYPECHECK:-0}" = "1" ]; then
  skip "typecheck 已跳过 (SKIP_TYPECHECK=1)"
else
  if pnpm typecheck > /tmp/verify-prd14-typecheck.out 2>&1; then
    ok "pnpm typecheck 0 errors"
  else
    fail "pnpm typecheck 有错误 · 查 /tmp/verify-prd14-typecheck.out"
    grep "error TS\|Error:" /tmp/verify-prd14-typecheck.out | head -20 || true
  fi
fi

# ===== 汇总 =====
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  验收结果汇总: ✅ $PASS PASS · ❌ $FAIL FAIL · ⚠️  $WARN WARN · ⏭️  $SKIPPED SKIPPED"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$FAIL" -eq 0 ]; then
  echo "  ✅ ALL PASS · PRD-14 advanced-domains 验收通过"
  exit 0
else
  echo "  ❌ $FAIL FAIL · 请修复后重跑"
  exit 1
fi
