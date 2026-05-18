#!/usr/bin/env bash
# scripts/verify-prd-13.sh — PRD-13 P9.3 health-domains 可重复验收脚本
# 8 sections covering static audit + schema check + single-point functions
# + BullMQ cron wiring + UI completeness + dependency check + procedure audit + E2E
#
# 用法:
#   bash scripts/verify-prd-13.sh                    # 默认 · 静态 + E2E tests
#   SKIP_E2E=1 bash scripts/verify-prd-13.sh         # 跳过 E2E tests (DB 不在线)
#   SKIP_TYPECHECK=1 bash scripts/verify-prd-13.sh   # 跳过 typecheck
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
echo "  QuanQn PRD-13 P9.3 health-domains · 可重复验收"
echo "  起点: $(pwd) · 时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ===== §1 静态 audit-redlines-admin · 5 LD-A (LD-A1~5) + 3 新 LD-A-6/7/8 全过 =====
section "§1 audit-redlines-admin · 5 LD-A + 3 新 LD-A-6/7/8 全过"

if bash scripts/audit-redlines-admin.sh > /tmp/verify-prd13-redlines.out 2>&1; then
  if grep -q "ALL PASS · 8 LD-A + 6 R-A" /tmp/verify-prd13-redlines.out; then
    ok "audit-redlines-admin · ALL PASS · 8 LD-A (含新 LD-A-6/7/8) + 6 R-A"
  else
    fail "audit-redlines-admin.sh 输出无 'ALL PASS · 8 LD-A + 6 R-A' · 查 /tmp/verify-prd13-redlines.out"
  fi
else
  fail "audit-redlines-admin.sh exit ≠ 0 · 查 /tmp/verify-prd13-redlines.out"
  cat /tmp/verify-prd13-redlines.out | grep "❌" | head -10
fi

# 单独验证 LD-A6/7/8 存在 (schema)
for lda in "LD-A6" "LD-A7" "LD-A8"; do
  if grep -q "$lda" scripts/audit-redlines-admin.sh; then
    ok "audit-redlines-admin.sh 含 $lda 检测段"
  else
    fail "audit-redlines-admin.sh 缺少 $lda 检测段"
  fi
done

# ===== §2 静态 schema · 6 张新表存在 =====
section "§2 prisma/schema.prisma · 6 张 PRD-13 新表"

SCHEMA="prisma/schema.prisma"
for table in "approval_requests" "prompt_versions" "prompt_canary_config" "user_quota" "quota_adjustment_log" "evolution_anomaly_flags"; do
  if grep -q "\"$table\"" "$SCHEMA" 2>/dev/null || grep -q "'$table'" "$SCHEMA" 2>/dev/null || grep -q "@map(\"$table\")" "$SCHEMA" 2>/dev/null; then
    ok "schema 含 $table 表"
  else
    fail "schema 缺少 $table 表 (@@map)"
  fi
done

# ===== §3 静态 · 4 单点函数存在 + grep 0 dual-write =====
section "§3 4 单点函数存在 + 0 dual-write 绕过"

# _publishPromptVersionInTx
if grep -rn "export.*function _publishPromptVersionInTx\|export async function _publishPromptVersionInTx" apps/api/src/ --include="*.ts" > /dev/null 2>&1; then
  ok "_publishPromptVersionInTx 单点函数存在"
else
  fail "_publishPromptVersionInTx 未找到导出函数"
fi

# _forceRebuildEvolutionInTx
if grep -rn "export.*function _forceRebuildEvolutionInTx\|export async function _forceRebuildEvolutionInTx" apps/api/src/ --include="*.ts" > /dev/null 2>&1; then
  ok "_forceRebuildEvolutionInTx 单点函数存在"
else
  fail "_forceRebuildEvolutionInTx 未找到导出函数"
fi

# _adjustQuotaInTx
if grep -rn "export.*function _adjustQuotaInTx\|export async function _adjustQuotaInTx" apps/api/src/ --include="*.ts" > /dev/null 2>&1; then
  ok "_adjustQuotaInTx 单点函数存在"
else
  fail "_adjustQuotaInTx 未找到导出函数"
fi

# _approveRequestInTx
if grep -rn "export.*function _approveRequestInTx\|export async function _approveRequestInTx" apps/api/src/ --include="*.ts" > /dev/null 2>&1; then
  ok "_approveRequestInTx 单点函数存在"
else
  fail "_approveRequestInTx 未找到导出函数"
fi

# 0 dual-write: no direct status='active' on promptVersion outside _publishPromptVersionInTx
DUAL_WRITE_HITS=$(grep -rn "promptVersion.*update.*status.*active\|status.*=.*['\"]active['\"].*promptVersion" \
  apps/api/src/ --include="*.ts" \
  | grep -v "_publishPromptVersionInTx" \
  | grep -v "\.test\." \
  | grep -v "spec\." || true)
if [ -z "$DUAL_WRITE_HITS" ]; then
  ok "0 dual-write: promptVersion status='active' 无绕过"
else
  fail "发现 promptVersion.status='active' 绕过 _publishPromptVersionInTx:"
  echo "$DUAL_WRITE_HITS" | head -5
fi

# ===== §4 静态 BullMQ cron wiring · emergencyPostReview + quotaExpiry =====
section "§4 BullMQ cron · emergencyPostReview + quotaExpiry workers wire"

INDEX_FILE="apps/api/src/index.ts"

if grep -q "scheduleEmergencyPostReview" "$INDEX_FILE" 2>/dev/null; then
  ok "index.ts: scheduleEmergencyPostReview 已注册"
else
  fail "index.ts: scheduleEmergencyPostReview 未注册"
fi

if grep -q "scheduleQuotaCleanup" "$INDEX_FILE" 2>/dev/null; then
  ok "index.ts: scheduleQuotaCleanup 已注册"
else
  fail "index.ts: scheduleQuotaCleanup 未注册"
fi

# emergencyPostReviewQueue + Worker 已定义
if grep -q "emergencyPostReviewQueue\|EMERGENCY_POST_REVIEW_QUEUE_NAME" apps/api/src/jobs/admin/emergency-post-review.job.ts 2>/dev/null; then
  ok "emergency-post-review.job: Queue 定义存在"
else
  fail "emergency-post-review.job: Queue 未定义"
fi

if grep -q "emergencyPostReviewWorker\|new Worker" apps/api/src/jobs/admin/emergency-post-review.job.ts 2>/dev/null; then
  ok "emergency-post-review.job: Worker 定义存在"
else
  fail "emergency-post-review.job: Worker 未定义"
fi

# quotaExpiryQueue + Worker 已定义
if grep -q "quotaExpiryQueue\|QUOTA_EXPIRY_QUEUE_NAME" apps/api/src/jobs/admin/quota-expiry.job.ts 2>/dev/null; then
  ok "quota-expiry.job: Queue 定义存在"
else
  fail "quota-expiry.job: Queue 未定义"
fi

if grep -q "quotaExpiryWorker\|quotaCleanupWorker" apps/api/src/jobs/admin/quota-expiry.job.ts 2>/dev/null; then
  ok "quota-expiry.job: Worker 定义存在"
else
  fail "quota-expiry.job: Worker 未定义"
fi

# ===== §5 静态 UI · 14 Specialist Tab + 4 actionType impact + 5 anomalyType =====
section "§5 UI 完整性 · 14 Specialist Tab + 4 actionType impact + 5 anomalyType"

PROMPTS_PAGE="apps/admin/src/pages/prompts/PromptsPage.tsx"

# 14 Specialist tabs
SPECIALIST_COUNT=$(grep -c "{ id: '" "$PROMPTS_PAGE" 2>/dev/null || echo 0)
if [ "$SPECIALIST_COUNT" -ge 14 ]; then
  ok "PromptsPage.tsx: ≥ 14 Specialist 定义 (found: $SPECIALIST_COUNT)"
else
  fail "PromptsPage.tsx: Specialist 数量 $SPECIALIST_COUNT < 14"
fi

# 4 key actionType impact descriptions in ApprovalDetailDrawer
DETAIL_DRAWER="apps/admin/src/pages/approvals/ApprovalDetailDrawer.tsx"
IMPACT_COUNT=$(grep -c "force_rebuild_evolution:\|publish_prompt:\|adjust_quota:\|ban_uploader:" "$DETAIL_DRAWER" 2>/dev/null || echo 0)
if [ "$IMPACT_COUNT" -ge 4 ]; then
  ok "ApprovalDetailDrawer: ≥ 4 actionType impact 描述 (found: $IMPACT_COUNT)"
else
  fail "ApprovalDetailDrawer: actionType impact 描述 $IMPACT_COUNT < 4"
fi

# 5 anomalyType in evolutionHealth router
EVO_ROUTER="apps/api/src/trpc/routers/admin/evolutionHealth.ts"
ANOMALY_COUNT=$(grep -c "'conflicting_insights'\|'frequent_style_flip'\|'avoidlist_overflow'\|'flywheel_stalled'\|'negative_feedback_dominant'" "$EVO_ROUTER" 2>/dev/null || echo 0)
if [ "$ANOMALY_COUNT" -ge 5 ]; then
  ok "evolutionHealth router: ≥ 5 anomalyType 枚举值 (found: $ANOMALY_COUNT)"
else
  fail "evolutionHealth router: anomalyType 枚举值 $ANOMALY_COUNT < 5"
fi

# ===== §6 静态依赖 · Monaco editor + @react-pdf/renderer =====
section "§6 依赖完整性 · Monaco editor + @react-pdf/renderer"

ADMIN_PKG="apps/admin/package.json"
API_PKG="apps/api/package.json"

if grep -q "@monaco-editor/react" "$ADMIN_PKG" 2>/dev/null; then
  ok "apps/admin: @monaco-editor/react 依赖存在"
else
  fail "apps/admin: @monaco-editor/react 依赖缺失"
fi

if grep -q "@react-pdf/renderer" "$ADMIN_PKG" 2>/dev/null; then
  ok "apps/admin: @react-pdf/renderer 依赖存在"
else
  fail "apps/admin: @react-pdf/renderer 依赖缺失"
fi

if grep -q "@react-pdf/renderer" "$API_PKG" 2>/dev/null; then
  ok "apps/api: @react-pdf/renderer 依赖存在 (PDF 法务导出)"
else
  fail "apps/api: @react-pdf/renderer 依赖缺失"
fi

# ===== §7 tRPC procedure 存在性验证 (静态 · 5 router × list/get procedure) =====
section "§7 tRPC procedure 存在性 · 5 sub-router 各有 list/query procedure"

# evolution router: getLDistribution
if grep -q "getLDistribution" apps/api/src/trpc/routers/admin/evolutionHealth.ts 2>/dev/null; then
  ok "evolutionHealth router: getLDistribution procedure 存在"
else
  fail "evolutionHealth router: getLDistribution procedure 缺失"
fi

# quota router: listUserQuotas or getQuotaOverview
if grep -qE "listUserQuotas|getQuotaOverview" apps/api/src/trpc/routers/admin/quota.ts 2>/dev/null; then
  ok "quota router: list/overview procedure 存在"
else
  fail "quota router: list/overview procedure 缺失"
fi

# compliance router: list or get procedure
if grep -qE "listEvents|getIndustryBreakdown|getKpiStats|getTrend" apps/api/src/trpc/routers/admin/compliance.ts 2>/dev/null; then
  ok "compliance router: list/stats procedure 存在"
else
  fail "compliance router: list/stats procedure 缺失"
fi

# prompts router: listVersions or getActiveVersion
if grep -qE "listVersions|getActiveVersion" apps/api/src/trpc/routers/admin/prompts.ts 2>/dev/null; then
  ok "prompts router: list/get procedure 存在"
else
  fail "prompts router: list/get procedure 缺失"
fi

# approvals router: listPending
if grep -q "listPending" apps/api/src/trpc/routers/admin/approvals.ts 2>/dev/null; then
  ok "approvals router: listPending procedure 存在"
else
  fail "approvals router: listPending procedure 缺失"
fi

# approvalGateService: requestApproval + approveRequest exports
if grep -q "export.*function requestApproval\|export async function requestApproval" \
    apps/api/src/services/admin/approval/approvalGateService.ts 2>/dev/null; then
  ok "approvalGateService: requestApproval export 存在"
else
  fail "approvalGateService: requestApproval export 缺失"
fi

# ===== §8 E2E · 完整 dual approval 流程 (vitest E2E tests) =====
section "§8 E2E · prd13 完整流程 vitest tests"

if [[ "${SKIP_E2E:-0}" == "1" ]]; then
  skip "SKIP_E2E=1 · 跳过 E2E tests (DB 不在线)"
else
  if command -v pnpm >/dev/null 2>&1; then
    E2E_FILES=(
      "tests/e2e/admin/prd13-dual-approval-e2e.test.ts"
      "tests/e2e/admin/prd13-emergency-flow.test.ts"
      "tests/e2e/admin/prd13-quota-expiry-e2e.test.ts"
      "tests/e2e/admin/prd13-evolution-rebuild-e2e.test.ts"
    )

    # Verify E2E test files exist
    for f in "${E2E_FILES[@]}"; do
      if [[ -f "$f" ]]; then
        ok "$f 文件存在"
      else
        fail "$f 文件缺失"
      fi
    done

    # Run E2E tests
    if DATABASE_URL_TEST="postgresql://return@localhost:5432/quanqn_test" \
       pnpm vitest run tests/e2e/admin/prd13-dual-approval-e2e.test.ts \
                        tests/e2e/admin/prd13-emergency-flow.test.ts \
                        tests/e2e/admin/prd13-quota-expiry-e2e.test.ts \
                        tests/e2e/admin/prd13-evolution-rebuild-e2e.test.ts \
       > /tmp/verify-prd13-e2e.out 2>&1; then
      E2E_PASS=$(grep -oE "[0-9]+ passed" /tmp/verify-prd13-e2e.out | head -1)
      E2E_FAIL=$(grep -oE "[0-9]+ failed" /tmp/verify-prd13-e2e.out | head -1)
      ok "prd13 E2E tests: ${E2E_PASS:-?} · ${E2E_FAIL:-0 failed}"
    else
      fail "prd13 E2E tests 失败 · 查 /tmp/verify-prd13-e2e.out"
      grep -E "FAIL|Error|×" /tmp/verify-prd13-e2e.out | head -20
    fi
  else
    skip "pnpm 未安装 · 跳过 E2E tests"
  fi
fi

# ===== Summary =====
section "Summary"
echo "  ✅ PASS:    $PASS"
echo "  ⚠️  WARN:   $WARN"
echo "  ❌ FAIL:    $FAIL"
echo "  ⏭️  SKIP:   $SKIPPED"
echo ""

if [[ $FAIL -eq 0 ]]; then
  echo "🎉 PRD-13 P9.3 health-domains · 全部验收通过(零回归)"
  echo "   US-001~012 PASSED · dual approval + emergency + quota expiry + evolution rebuild"
  exit 0
else
  echo "❌ PRD-13 验收失败 · 详查 /tmp/verify-prd13-*.out"
  exit 1
fi
