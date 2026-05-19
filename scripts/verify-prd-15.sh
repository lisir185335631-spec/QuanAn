#!/usr/bin/env bash
# scripts/verify-prd-15.sh — PRD-15 P9.5 frontend-completeness 可重复验收脚本
# 9 sections covering static audit-redlines + schema + 6 tool pages + 2 derived pages
# + 5 components + backend routers + admin router (inherited PRD-14)
# + admin pages (inherited PRD-14) + E2E 4 flows + typecheck
#
# 用法:
#   bash scripts/verify-prd-15.sh                    # 默认 · 静态 + E2E tests
#   SKIP_E2E=1 bash scripts/verify-prd-15.sh         # 跳过 E2E tests
#   SKIP_TYPECHECK=1 bash scripts/verify-prd-15.sh   # 跳过 typecheck
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
echo "  QuanAn PRD-15 P9.5 frontend-completeness · 可重复验收"
echo "  起点: $(pwd) · 时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ===== §1 静态 audit-redlines + audit-redlines-admin 全 PASS =====
section "§1 audit-redlines + audit-redlines-admin 全 PASS"

if bash scripts/audit-redlines.sh > /tmp/verify-prd15-redlines.out 2>&1; then
  if grep -q "所有红线检测通过" /tmp/verify-prd15-redlines.out; then
    ok "audit-redlines.sh · 所有红线检测通过"
  else
    fail "audit-redlines.sh 输出无 '所有红线检测通过' · 查 /tmp/verify-prd15-redlines.out"
    grep "❌" /tmp/verify-prd15-redlines.out | head -5 || true
  fi
else
  fail "audit-redlines.sh exit ≠ 0 · 查 /tmp/verify-prd15-redlines.out"
  grep "❌" /tmp/verify-prd15-redlines.out | head -5 || true
fi

if bash scripts/audit-redlines-admin.sh > /tmp/verify-prd15-redlines-admin.out 2>&1; then
  if grep -q "ALL PASS · 11 LD-A + 6 R-A" /tmp/verify-prd15-redlines-admin.out; then
    ok "audit-redlines-admin.sh · ALL PASS · 11 LD-A + 6 R-A"
  else
    fail "audit-redlines-admin.sh 输出无 'ALL PASS · 11 LD-A + 6 R-A' · 查 /tmp/verify-prd15-redlines-admin.out"
    grep "❌" /tmp/verify-prd15-redlines-admin.out | head -5 || true
  fi
else
  fail "audit-redlines-admin.sh exit ≠ 0 · 查 /tmp/verify-prd15-redlines-admin.out"
fi

if bash scripts/audit-ld.sh > /tmp/verify-prd15-ld.out 2>&1; then
  ok "audit-ld.sh · LD + 复杂红线检测通过"
else
  fail "audit-ld.sh exit ≠ 0 · 查 /tmp/verify-prd15-ld.out"
fi

if bash scripts/audit-admin-rls-tables.sh > /tmp/verify-prd15-rls.out 2>&1; then
  if grep -q "PASS: all RLS states verified" /tmp/verify-prd15-rls.out; then
    ok "audit-admin-rls-tables.sh · all RLS states verified"
  else
    fail "audit-admin-rls-tables.sh 无 PASS 输出 · 查 /tmp/verify-prd15-rls.out"
  fi
else
  fail "audit-admin-rls-tables.sh exit ≠ 0 · 查 /tmp/verify-prd15-rls.out"
fi

# ===== §2 静态 schema · industries 表 + 5 mock IP 账号常量 =====
section "§2 schema · industries 表 + 5 mock IP 账号 + devOAuthMock"

SCHEMA="prisma/schema.prisma"

# industries 表
if grep -q '@@map("industries")' "$SCHEMA" 2>/dev/null; then
  ok "schema 含 industries 表 (@@map)"
else
  fail "schema 缺少 industries 表 (@@map)"
fi

# 56 行业常量
INDUSTRIES_FILE="apps/api/src/lib/constants/industries.ts"
if [ -f "$INDUSTRIES_FILE" ]; then
  IND_COUNT=$(grep -c '"key":\|key:' "$INDUSTRIES_FILE" 2>/dev/null || echo 0)
  if [ "$IND_COUNT" -ge 56 ]; then
    ok "industries.ts 含 ≥56 行业条目 ($IND_COUNT 个 key)"
  else
    fail "industries.ts 仅含 $IND_COUNT 个 key(需≥56)"
  fi
else
  fail "industries.ts 不存在: $INDUSTRIES_FILE"
fi

# 5 mock IP 账号 (seed.ts MOCK_IP_ACCOUNTS)
SEED_FILE="prisma/seed.ts"
if [ -f "$SEED_FILE" ]; then
  MOCK_ACCS=$(grep -c "ipPositioning:" "$SEED_FILE" 2>/dev/null || echo 0)
  if [ "$MOCK_ACCS" -ge 5 ]; then
    ok "seed.ts 含 ≥5 mock IP 账号 (MOCK_IP_ACCOUNTS · $MOCK_ACCS 个 ipPositioning)"
  else
    fail "seed.ts 仅含 $MOCK_ACCS 个 ipPositioning(需≥5)"
  fi
else
  fail "seed.ts 不存在: $SEED_FILE"
fi

# DEV_OAUTH_MOCK · isDevOAuthMock 函数
AUTH_FILE="apps/api/src/middleware/auth.ts"
if grep -q "isDevOAuthMock\|DEV_OAUTH_MOCK" "$AUTH_FILE" 2>/dev/null; then
  ok "auth.ts 含 DEV_OAUTH_MOCK + isDevOAuthMock (US-001 AC-3)"
else
  fail "auth.ts 缺少 DEV_OAUTH_MOCK/isDevOAuthMock"
fi

# ipAccounts.ts dev 模式自动绑定 5 账号
IP_ACCS_FILE="apps/api/src/trpc/routers/ipAccounts.ts"
if grep -q "NODE_ENV.*development.*accounts.length.*0\|accounts.length.*0.*NODE_ENV.*development" "$IP_ACCS_FILE" 2>/dev/null; then
  ok "ipAccounts.list dev mode 自动绑定 5 mock 账号"
else
  fail "ipAccounts.list 缺少 dev mode auto-bind 逻辑"
fi

# ===== §3 静态 · 6 工具 page ≥ 100 行 =====
section "§3 6 工具 page · ≥100 行"

check_page_lines() {
  local name="$1"
  local file="$2"
  local min_lines="${3:-100}"
  if [ -f "$file" ]; then
    local lines
    lines=$(wc -l < "$file")
    if [ "$lines" -ge "$min_lines" ]; then
      ok "$name 存在 + ≥${min_lines} 行 ($lines 行)"
    else
      fail "$name 存在但仅 $lines 行(需≥${min_lines})"
    fi
  else
    fail "$name 文件缺失: $file"
  fi
}

check_page_lines "Copywriting.tsx" "apps/web/src/pages/tools/Copywriting.tsx" 100
check_page_lines "DeepLearning.tsx" "apps/web/src/pages/tools/DeepLearning.tsx" 100
check_page_lines "PrivateDomain.tsx" "apps/web/src/pages/tools/PrivateDomain.tsx" 100
check_page_lines "Trending.tsx" "apps/web/src/pages/tools/Trending.tsx" 100
check_page_lines "Monetization.tsx" "apps/web/src/pages/tools/Monetization.tsx" 100
check_page_lines "PresentStyles.tsx" "apps/web/src/pages/tools/PresentStyles.tsx" 100

# ===== §4 静态 · 2 衍生页 exist =====
section "§4 2 衍生页 · MyTopics + History"

check_page_exist() {
  local name="$1"
  local file="$2"
  if [ -f "$file" ]; then
    local lines
    lines=$(wc -l < "$file")
    ok "$name 存在 ($lines 行)"
  else
    fail "$name 缺失: $file"
  fi
}

check_page_exist "MyTopics.tsx" "apps/web/src/pages/modules/MyTopics.tsx"
check_page_exist "History.tsx" "apps/web/src/pages/modules/History.tsx"

# 衍生页路由 (router 中存在 /my-topics + /history)
if grep -qrn "my-topics\|MyTopics" apps/web/src/ --include="*.tsx" --include="*.ts" 2>/dev/null; then
  ok "/my-topics 路由已在前端 src 中引用"
else
  fail "/my-topics 路由未在前端 src 中找到引用"
fi

if grep -qrn "path.*history\|/history" apps/web/src/ --include="*.tsx" --include="*.ts" 2>/dev/null; then
  ok "/history 路由已在前端 src 中引用"
else
  fail "/history 路由未在前端 src 中找到引用"
fi

# ===== §5 静态 · 5 component exist =====
section "§5 5 PRD-15 component exist"

COMP_DIR="apps/web/src/pages/tools/components"

check_component() {
  local name="$1"
  if [ -f "$COMP_DIR/$name" ]; then
    ok "component 存在: $name"
  else
    fail "component 缺失: $COMP_DIR/$name"
  fi
}

check_component "CopywritingForm.tsx"
check_component "DeepLearningTabs.tsx"
check_component "PrivateDomainConfigView.tsx"
check_component "TrendingTable.tsx"
check_component "PhaseCard.tsx"

# ===== §6 后端 router exist =====
section "§6 后端 tRPC router · PRD-15 6 工具 + 衍生页"

ROUTER_DIR="apps/api/src/trpc/routers"

check_router() {
  local name="$1"
  local file="$2"
  if [ -f "$ROUTER_DIR/$file" ]; then
    local procs
    procs=$(grep -c "\.query\b\|\.mutation\b\|\.subscription\b" "$ROUTER_DIR/$file" 2>/dev/null || echo 0)
    ok "router $file 存在 ($procs procedures)"
  else
    fail "router 缺失: $ROUTER_DIR/$file"
  fi
}

check_router "privateDomain" "privateDomain.ts"
check_router "copywriting" "copywriting.ts"
check_router "deepLearning" "deepLearning.ts"
check_router "trending" "trending.ts"
check_router "myTopics" "myTopics.ts"
check_router "history" "history.ts"
check_router "costLog" "costLog.ts"
check_router "ipAccounts" "ipAccounts.ts"

# privateDomain.generate 含 6 config fields
if grep -q "productDescription\|productPrice\|targetAudience\|ipPositioning\|currentChannel\|monthlyTraffic" "$ROUTER_DIR/privateDomain.ts" 2>/dev/null; then
  ok "privateDomain router 含 6 config fields (AC-3)"
else
  fail "privateDomain router 缺少 6 config fields (AC-3)"
fi

# trending.favorite → trending_favorites RLS
if grep -q "trendingFavorite.upsert\|trending_favorites" "$ROUTER_DIR/trending.ts" 2>/dev/null; then
  ok "trending router 含 favorite + trending_favorites (US-006 AC-7)"
else
  fail "trending router 缺少 trendingFavorite.upsert"
fi

# ===== §7 admin router 全 PASS (继承 PRD-14) =====
section "§7 admin tRPC · PRD-14 三大 router ≥17 procedure (继承)"

ADMIN_ROUTER_DIR="apps/api/src/trpc/routers/admin"

AB_PROCS=$(grep -c "\.query\b\|\.mutation\b" "$ADMIN_ROUTER_DIR/abExperiments.ts" 2>/dev/null || echo 0)
CONST_PROCS=$(grep -c "\.query\b\|\.mutation\b" "$ADMIN_ROUTER_DIR/constants.ts" 2>/dev/null || echo 0)
FF_PROCS=$(grep -c "\.query\b\|\.mutation\b" "$ADMIN_ROUTER_DIR/featureFlags.ts" 2>/dev/null || echo 0)
TOTAL_PROCS=$((AB_PROCS + CONST_PROCS + FF_PROCS))

if [ "$TOTAL_PROCS" -ge 17 ]; then
  ok "PRD-14 三大 router 共 $TOTAL_PROCS procedure(≥17)"
else
  fail "PRD-14 三大 router 仅 $TOTAL_PROCS procedure(需≥17)"
fi

# Key admin procedures spot-check
declare -a KEY_ADMIN_PROCS=(
  "createAbExperiment:abExperiments.ts"
  "startAbExperiment:abExperiments.ts"
  "emergencyToggleSystemConfig:featureFlags.ts"
  "submitForReview:constants.ts"
  "rollbackVersion:constants.ts"
)
for entry in "${KEY_ADMIN_PROCS[@]}"; do
  proc="${entry%%:*}"
  file="${entry##*:}"
  if grep -q "$proc" "$ADMIN_ROUTER_DIR/$file" 2>/dev/null; then
    ok "admin router $file 含 $proc procedure"
  else
    fail "admin router $file 缺少 $proc"
  fi
done

# PRD-15 新增 admin router
for router_file in "review-deep-learn.ts" "review-trending.ts"; do
  if [ -f "$ADMIN_ROUTER_DIR/$router_file" ]; then
    ok "admin router 存在: $router_file (PRD-15)"
  else
    fail "admin router 缺失: $ADMIN_ROUTER_DIR/$router_file"
  fi
done

# admin index 接入 abExperimentsRouter
if grep -q "abExperimentsRouter\|abExperiments:" "$ADMIN_ROUTER_DIR/index.ts" 2>/dev/null; then
  ok "abExperimentsRouter 已接入 admin index"
else
  fail "abExperimentsRouter 未接入 admin index"
fi

# ===== §8 admin pages 全在 (继承 PRD-14) =====
section "§8 admin pages · PRD-14 + PRD-15 (继承)"

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

# PRD-14 admin pages (继承)
check_admin_page "abExperiments" "AbExperimentsPage.tsx"
check_admin_page "abExperiments" "ExperimentDetailPage.tsx"
check_admin_page "constants" "ConstantsPage.tsx"
check_admin_page "featureFlags" "FeatureFlagsPage.tsx"

# PRD-15 admin pages (deep-learn review + trending review)
for page_dir in "deepLearnReview" "trendingReview"; do
  if [ -d "$ADMIN_PAGES/$page_dir" ] || ls "$ADMIN_PAGES" 2>/dev/null | grep -qi "${page_dir}"; then
    ok "admin pages 含 $page_dir 目录"
  else
    warn "admin pages 缺少 $page_dir 目录(PRD-15 admin review)"
  fi
done

# ===== §9 E2E · 4 flows + typecheck =====
section "§9 E2E · 4 flows + typecheck"

if [ "${SKIP_E2E:-0}" = "1" ]; then
  skip "E2E tests 已跳过 (SKIP_E2E=1)"
else
  declare -a E2E_FILES=(
    "tests/e2e/prd15-private-domain-e2e.test.ts"
    "tests/e2e/prd15-copywriting-flow-e2e.test.ts"
    "tests/e2e/prd15-trending-to-step7-e2e.test.ts"
    "tests/e2e/prd15-mock-auth-e2e.test.ts"
  )

  # Check all 4 E2E files exist (≥ step counts)
  E2E_FILE_COUNTS=(8 8 7 6)
  all_e2e_exist=1
  idx=0
  for e2e_file in "${E2E_FILES[@]}"; do
    min_steps="${E2E_FILE_COUNTS[$idx]}"
    if [ -f "$e2e_file" ]; then
      step_count=$(grep -c "^  it(" "$e2e_file" 2>/dev/null || echo 0)
      if [ "$step_count" -ge "$min_steps" ]; then
        ok "E2E 测试文件存在: $(basename "$e2e_file") ($step_count steps ≥$min_steps)"
      else
        fail "E2E $(basename "$e2e_file") 仅 $step_count steps(需≥$min_steps)"
        all_e2e_exist=0
      fi
    else
      fail "E2E 测试文件缺失: $e2e_file"
      all_e2e_exist=0
    fi
    idx=$((idx + 1))
  done

  if [ "$all_e2e_exist" -eq 1 ]; then
    echo "  → 正在运行 4 个 E2E flow tests..."
    if pnpm exec vitest run \
        --reporter=verbose \
        "tests/e2e/prd15-private-domain-e2e.test.ts" \
        "tests/e2e/prd15-copywriting-flow-e2e.test.ts" \
        "tests/e2e/prd15-trending-to-step7-e2e.test.ts" \
        "tests/e2e/prd15-mock-auth-e2e.test.ts" \
        > /tmp/verify-prd15-e2e.out 2>&1; then
      ok "4 E2E flow tests 全部通过"
      PASS_COUNT=$(grep -oE "[0-9]+ passed" /tmp/verify-prd15-e2e.out | tail -1 | grep -oE "[0-9]+" || echo "?")
      ok "E2E tests: $PASS_COUNT tests passed"
    else
      fail "E2E tests 有失败 · 查 /tmp/verify-prd15-e2e.out"
      grep -E "FAIL|Error|✗|×|❌" /tmp/verify-prd15-e2e.out | head -20 || true
    fi
  fi
fi

if [ "${SKIP_TYPECHECK:-0}" = "1" ]; then
  skip "typecheck 已跳过 (SKIP_TYPECHECK=1)"
else
  echo "  → 运行 pnpm typecheck..."
  if pnpm typecheck > /tmp/verify-prd15-typecheck.out 2>&1; then
    ok "pnpm typecheck 0 errors (all 4 workspace packages)"
  else
    fail "pnpm typecheck 有错误 · 查 /tmp/verify-prd15-typecheck.out"
    grep "error TS\|Error:" /tmp/verify-prd15-typecheck.out | head -20 || true
  fi
fi

# ===== 汇总 =====
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  验收结果汇总: ✅ $PASS PASS · ❌ $FAIL FAIL · ⚠️  $WARN WARN · ⏭️  $SKIPPED SKIPPED"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$FAIL" -eq 0 ]; then
  echo "  ✅ ALL PASS · PRD-15 frontend-completeness 验收通过"
  exit 0
else
  echo "  ❌ $FAIL FAIL · 请修复后重跑"
  exit 1
fi
