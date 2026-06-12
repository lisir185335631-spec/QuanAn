#!/usr/bin/env bash
# scripts/audit-redlines-admin.sh
# QuanAn admin 子系统 · 11 LD-A + 6 R-A 一键 grep 检测
# AC-1(US-007): exit 0 · AC-9(US-009): 8 LD-A + 6 R-A · PRD-14 US-001: +LD-A9 · PRD-14 US-006: +LD-A10 · PRD-14 US-011: +LD-A11
# 派生自 .claude/rules/admin-subsystem.md §10.4

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

FAIL=0
fail() { echo "❌ $1"; FAIL=1; }
pass() { echo "✅ $1"; }

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  QuanAn Admin · 11 LD-A + 6 R-A 红线检测"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo
echo "【LD-A Locked Decision 检测 · 11 条】"
echo

# ── LD-A1 · admin OAuth 独立(不复用主应用 OAuth client) ──────────────────────
echo "  LD-A1: admin OAuth 独立检测"
if grep -rn "QUANQN_WEB_CLIENT" apps/admin/ --include="*.ts" --include="*.tsx" --include="*.env*" 2>/dev/null | grep -v ".test." ; then
  fail "LD-A1 · apps/admin 引用 QUANQN_WEB_CLIENT · 触犯独立 OAuth 约定 (ADR-021)"
else
  pass "LD-A1 · admin OAuth 独立 · 无 QUANQN_WEB_CLIENT 引用"
fi

# 额外: mock OAuth 不可进 prod(anti-pattern REJ-D061)
if [ -f "apps/api/.env.production" ]; then
  if grep -q "OAUTH_PROVIDER.*mock" apps/api/.env.production 2>/dev/null; then
    fail "LD-A1+: .env.production 含 OAUTH_PROVIDER=mock · mock OAuth 不可进 prod"
  else
    pass "LD-A1+: .env.production 无 mock OAuth"
  fi
else
  pass "LD-A1+: apps/api/.env.production 不存在(dev 环境 · skip)"
fi

# ── LD-A2 · adminRouter / appRouter 严格分离 ────────────────────────────────
echo
echo "  LD-A2: adminRouter / appRouter 分离检测"
if grep -rn "from.*routers/app" apps/api/src/trpc/routers/admin/ --include="*.ts" 2>/dev/null | grep -v ".test." ; then
  fail "LD-A2a · admin router 引入 app router · 触犯 LD-A2(ADR-021)"
else
  pass "LD-A2a · admin router 未引入 app router"
fi
if grep -rn "from.*routers/admin" apps/api/src/trpc/routers/ --include="*.ts" 2>/dev/null \
    | grep -v "routers/admin/" | grep -v ".test." ; then
  fail "LD-A2b · app router 引入 admin router · 触犯 LD-A2"
else
  pass "LD-A2b · app router 未引入 admin router"
fi

# ── LD-A3 · admin procedure 必经 adminRLS (AST 检测) ──────────────────────────
echo
echo "  LD-A3: admin procedure adminRLS middleware 检测(AST)"
if node_modules/.bin/tsx scripts/audit-admin-rls.ts 2>&1; then
  pass "LD-A3 · 所有 admin procedure 经过 adminRLS(例外 auth.login/logout/me/health)"
else
  fail "LD-A3 · admin procedure 存在未经 adminRLS 的情形"
fi

# ── LD-A4 · 高风险 procedure 必带 meta.requiresApproval (AST stub 验证) ─────
echo
echo "  LD-A4: Approval Gates 机制验证(AST stub)"
if node_modules/.bin/tsx scripts/audit-approval-gates.ts 2>&1; then
  pass "LD-A4 · Approval Gates 机制就位(PRD-13 将补全真实 14 高风险动作)"
else
  fail "LD-A4 · Approval Gates 机制未就位"
fi

# ── LD-A5 · TrendingScraper / FileParser 不直接写主表 ────────────────────────
echo
echo "  LD-A5: 内容审核队列守护检测"
TRENDING_SCRAPER_DIR="apps/api/src/workers/trending-scraper"
FILE_PARSER_DIR="apps/api/src/workers/file-parser"
TS_FAIL=0
if [ -d "$TRENDING_SCRAPER_DIR" ]; then
  if grep -rn "prisma\.trendingItem\.create" "$TRENDING_SCRAPER_DIR" --include="*.ts" 2>/dev/null | grep -v ".test." ; then
    fail "LD-A5a · TrendingScraper 直接写 trending_items · 触犯 LD-A5"
    TS_FAIL=1
  fi
fi
if [ -d "$FILE_PARSER_DIR" ]; then
  if grep -rn "prisma\.deepLearningArchive\.create" "$FILE_PARSER_DIR" --include="*.ts" 2>/dev/null | grep -v ".test." ; then
    fail "LD-A5b · FileParser 直接写 deep_learning_archives · 触犯 LD-A5"
    TS_FAIL=1
  fi
fi
if [ "$TS_FAIL" -eq 0 ]; then
  pass "LD-A5 · TrendingScraper/FileParser 不直接写主表(workers 目录已验证)"
fi

# ── LD-A6 · prompt_versions.status='active' 仅由 _publishPromptVersionInTx 改 ──
echo
echo "  LD-A6: prompt status='active' 单点函数守护检测"
LDA6_FAIL=0
# Look for any code outside prompt-version.service.ts that sets prompt status to active
LDA6_HITS=$(grep -rn "promptVersion.*update.*status.*active\|status.*['\"]active['\"].*prompt\|prompt_versions.*status.*active" \
  apps/api/src --include="*.ts" 2>/dev/null \
  | grep -v "_publishPromptVersionInTx" \
  | grep -v "prompt-version.service.ts" \
  | grep -v "\.test\." \
  | grep -v "spec\." || true)
if [ -n "$LDA6_HITS" ]; then
  echo "$LDA6_HITS"
  fail "LD-A6 · 发现绕过 _publishPromptVersionInTx 直接设 status='active' 的代码"
  LDA6_FAIL=1
fi
if [ "$LDA6_FAIL" -eq 0 ]; then
  pass "LD-A6 · prompt_versions.status='active' 仅由 _publishPromptVersionInTx 修改"
fi

# ── LD-A7 · evolution_profile clear / evolution_insight resolved 仅由 _forceRebuildEvolutionInTx 修改 ──
# 2026-05-14 PRD-13 retro M-2 修正(TD-058) · 加 isFallback/levelAfter 字段 + (prisma|db|tx) prefix
# 跟 evolution-rebuild.service.ts:53-58 实际写法对齐:
#   tx.evolutionInsight.updateMany({data:{isFallback:true, levelAfter:'rebuild'}})
echo
echo "  LD-A7: evolution_profile/insight 清空单点函数守护检测"
LDA7_FAIL=0
LDA7_HITS=$(grep -rnE \
  "(prisma|db|tx)\.evolutionProfile\.update.*(latestInsight|null)|(prisma|db|tx)\.evolutionInsight\.updateMany.*(isFallback|levelAfter|resolved)" \
  apps/api/src --include="*.ts" 2>/dev/null \
  | grep -v "_forceRebuildEvolutionInTx" \
  | grep -v "evolution-rebuild\.service\.ts" \
  | grep -v "\.test\." \
  | grep -v "spec\." \
  | grep -v "Parameters<typeof" || true)
if [ -n "$LDA7_HITS" ]; then
  echo "$LDA7_HITS"
  fail "LD-A7 违反 _forceRebuildEvolutionInTx 单点 · 发现绕过函数直接改 evolution_profile/insight 的代码"
  LDA7_FAIL=1
fi
if [ "$LDA7_FAIL" -eq 0 ]; then
  pass "LD-A7 · evolution_profile/insight 仅由 _forceRebuildEvolutionInTx 修改"
fi

# ── LD-A8 · user_quota 写操作仅由 _adjustQuotaInTx 发起 ────────────────────
echo
echo "  LD-A8: user_quota 写操作单点函数守护检测"
LDA8_FAIL=0
LDA8_HITS=$(grep -rn \
  "userQuota\.update\|userQuota\.updateMany\|userQuota\.create\b" \
  apps/api/src --include="*.ts" 2>/dev/null \
  | grep -v "quota-adjustment\.service\.ts" \
  | grep -v "quota-expiry\.job\.ts" \
  | grep -v "\.test\." \
  | grep -v "spec\." || true)
if [ -n "$LDA8_HITS" ]; then
  echo "$LDA8_HITS"
  fail "LD-A8 违反 _adjustQuotaInTx 单点 · 发现绕过函数直接写 user_quota 的代码"
  LDA8_FAIL=1
fi
if [ "$LDA8_FAIL" -eq 0 ]; then
  pass "LD-A8 · user_quota 写操作仅由 _adjustQuotaInTx / quota-expiry.job 单点修改"
fi

# ── LD-A9 · ab_experiments status/startedAt/stoppedAt 仅由 _startAbExperimentInTx / _stopAbExperimentInTx 修改 ──
echo
echo "  LD-A9: ab_experiments 状态写操作单点函数守护检测"
LDA9_FAIL=0
LDA9_HITS=$(grep -rnE \
  "(prisma|db|tx)\.abExperiment\.update.*(status|stoppedAt|startedAt)" \
  apps/api/src --include="*.ts" 2>/dev/null \
  | grep -v "ab-experiment\.service\.ts" \
  | grep -v "ab-stop-loss\.job\.ts" \
  | grep -v "\.test\." \
  | grep -v "spec\." || true)
if [ -n "$LDA9_HITS" ]; then
  echo "$LDA9_HITS"
  fail "LD-A9 违反 _startAbExperimentInTx/_stopAbExperimentInTx 单点 · 发现直接写 ab_experiments 状态字段的代码"
  LDA9_FAIL=1
fi
if [ "$LDA9_FAIL" -eq 0 ]; then
  pass "LD-A9 · ab_experiments 状态仅由 _startAbExperimentInTx / _stopAbExperimentInTx 单点修改"
fi

# ── LD-A10 · constant_versions.status='active' 仅由 _publishConstantVersionInTx 修改 ──
echo
echo "  LD-A10: constant_versions status='active' 单点函数守护检测"
LDA10_FAIL=0
LDA10_HITS=$(grep -rnE \
  "(prisma|db|tx)\.constantVersion\.update.*(status|active)" \
  apps/api/src --include="*.ts" 2>/dev/null \
  | grep -v "_publishConstantVersionInTx" \
  | grep -v "constant-version\.service\.ts" \
  | grep -v "\.test\." \
  | grep -v "spec\." || true)
if [ -n "$LDA10_HITS" ]; then
  echo "$LDA10_HITS"
  fail "LD-A10 · 发现绕过 _publishConstantVersionInTx 直接设 constant_versions.status='active' 的代码"
  LDA10_FAIL=1
fi
if [ "$LDA10_FAIL" -eq 0 ]; then
  pass "LD-A10 · constant_versions.status='active' 仅由 _publishConstantVersionInTx 修改"
fi

# ── LD-A11 · feature_flags / system_config 写操作仅由 _toggleFeatureFlagInTx / _updateSystemConfigInTx 修改 ──
echo
echo "  LD-A11: feature_flags / system_config 写操作单点函数守护检测"
LDA11_FAIL=0
LDA11_HITS=$(grep -rnE \
  "(prisma|db|tx)\.(featureFlag|systemConfig)\.(update|upsert|create)" \
  apps/api/src --include="*.ts" 2>/dev/null \
  | grep -v "feature-flag\.service\.ts" \
  | grep -v "\.test\." \
  | grep -v "spec\." || true)
if [ -n "$LDA11_HITS" ]; then
  echo "$LDA11_HITS"
  fail "LD-A11 · 发现绕过 _toggleFeatureFlagInTx/_updateSystemConfigInTx 直接写 feature_flags/system_config 的代码"
  LDA11_FAIL=1
fi
if [ "$LDA11_FAIL" -eq 0 ]; then
  pass "LD-A11 · feature_flags / system_config 写操作仅由 _toggleFeatureFlagInTx / _updateSystemConfigInTx 单点修改"
fi

echo
echo "【R-A 红线检测 · 6 条】"
echo

# ── R-A1 · apps/web ↔ apps/admin 不互相 import 业务代码 ────────────────────
echo "  R-A1: web ↔ admin 跨 app import 检测"
if grep -rn "from '@quanan/admin\|from '\.\./admin'" apps/web/src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v ".test." ; then
  fail "R-A1a · apps/web 引入 admin 代码 · 触犯 R-A1"
else
  pass "R-A1a · apps/web 无 admin import"
fi
if grep -rn "from '@quanan/web\|from '\.\./web'" apps/admin/src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v ".test." ; then
  fail "R-A1b · apps/admin 引入 web 代码 · 触犯 R-A1"
else
  pass "R-A1b · apps/admin 无 web import"
fi

# ── R-A2 · 主应用前端不暴露 admin 入口 ──────────────────────────────────────
echo
echo "  R-A2: 主应用无 admin 入口检测"
if grep -rn "role === 'admin'.*navigate\|navigate.*admin\|\/admin'" apps/web/src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v ".test." | grep -v "//"; then
  fail "R-A2 · apps/web 暴露 admin 入口 · 触犯 R-A2"
else
  pass "R-A2 · apps/web 无 admin 入口"
fi

# ── R-A3 · admin SPA 不含生产级 mock OAuth ─────────────────────────────────
echo
echo "  R-A3: admin SPA mock OAuth 生产防护检测"
if grep -rn "OAUTH_PROVIDER.*=.*mock" apps/admin/src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v ".test." | grep -v "env.DEV" | grep -v "process.env.NODE_ENV"; then
  fail "R-A3 · admin SPA 含硬编码 mock OAuth · 触犯 R-A3"
else
  pass "R-A3 · admin SPA 无硬编码 mock OAuth(DEV guard 正常)"
fi

# ── R-A4 · admin 无原始 SQL 绕过审计 ────────────────────────────────────────
echo
echo "  R-A4: admin raw SQL bypass 检测"
if grep -rn '\$executeRawUnsafe\|\$queryRawUnsafe' apps/api/src/trpc/routers/admin/ --include="*.ts" 2>/dev/null | grep -v ".test." ; then
  fail "R-A4 · admin router 使用 \$executeRawUnsafe/\$queryRawUnsafe · 触犯 R-A4"
else
  pass "R-A4 · admin router 无 raw SQL bypass"
fi

# ── R-A5 · admin 不直接调 LLMGateway / Specialist ───────────────────────────
echo
echo "  R-A5: admin 无 LLMGateway/Specialist 直调检测"
RA5_FAIL=0
if grep -rn "import.*LLMGateway" apps/admin/src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v ".test." ; then
  fail "R-A5a · apps/admin 直接 import LLMGateway · 触犯 R-A5"
  RA5_FAIL=1
fi
if grep -rn "import.*Specialist" apps/admin/src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v ".test." ; then
  fail "R-A5b · apps/admin 直接 import Specialist · 触犯 R-A5"
  RA5_FAIL=1
fi
if grep -rn "llmGateway\.complete\|llmGateway\.stream" apps/api/src/trpc/routers/admin/ --include="*.ts" 2>/dev/null | grep -v ".test." ; then
  fail "R-A5c · admin router 直接调 llmGateway · 触犯 R-A5"
  RA5_FAIL=1
fi
if [ "$RA5_FAIL" -eq 0 ]; then
  pass "R-A5 · admin 无 LLMGateway/Specialist 直调"
fi

# ── R-A6 · admin 无 mock approval bypass ────────────────────────────────────
echo
echo "  R-A6: admin approval bypass 检测"
RA6_FAIL=0
if grep -rn "approvalRequestId.*'mock'\|approvalRequestId.*'bypass'" apps/api/src/ --include="*.ts" 2>/dev/null | grep -v ".test." ; then
  fail "R-A6a · admin 存在 mock approval bypass · 触犯 R-A6"
  RA6_FAIL=1
fi
if grep -rn "requiresApproval.*=.*false" apps/api/src/trpc/routers/admin/ --include="*.ts" 2>/dev/null | grep -v ".test." ; then
  fail "R-A6b · admin 高风险 procedure 硬编码 requiresApproval=false · 触犯 R-A6"
  RA6_FAIL=1
fi
if [ "$RA6_FAIL" -eq 0 ]; then
  pass "R-A6 · admin 无 mock approval bypass"
fi

echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [[ $FAIL -eq 0 ]]; then
  echo "ALL PASS · 11 LD-A + 6 R-A"
  exit 0
else
  echo "FAIL · 上方红线检测未通过 · 请修复后重跑"
  exit 1
fi
