#!/usr/bin/env bash
# scripts/audit-admin-rls-tables.sh
# AC-4(US-007): psql 验证 admin 表 RLS=false + 15 主应用表 RLS=true · 双向 0 误关
# Admin tables: manual_admin_rls.sql DISABLE ROW LEVEL SECURITY 全清单(26 张)
# 15 main-app tables: manual_rls.sql ENABLE ROW LEVEL SECURITY 清单
# US-022 更新: 补全 PRD-10 新增 13 张表 (TD-039 覆盖缺口修复)

set -euo pipefail

DB=${DATABASE_URL:-"postgresql://return@localhost:5432/quanqn"}

# 26 admin/system tables — all with DISABLE ROW LEVEL SECURITY in manual_admin_rls.sql
# 4 核心主表 + 9 辅助(原 13) + 6 PRD-10 新增 admin + 4 PRD-10/14 system + 3 PRD-14 AB
ADMIN_TABLES=(
  # 4 核心主表
  admin_audit_log
  approval_requests
  prompt_versions
  user_quota
  # 辅助表(按业务域)
  kpi_snapshots
  ip_account_admin_notes
  ip_account_anomaly_flags
  invite_campaigns
  # 域⑦ TrendingItem 审核
  trending_review_queue
  trending_takedown
  auto_review_rules
  deep_learn_review_queue
  user_violation_log
  evolution_anomaly_flags
  prompt_canary_config
  quota_adjustment_log
  # 6 PRD-10 新增 admin 表
  admin_users
  admin_sessions
  admin_invite_campaign
  admin_constants
  admin_config
  admin_ab_experiment
  # 4 系统 / 特性标志表
  feature_flags
  system_config
  # 2 PRD-14 AB 测试表
  ab_experiments
  ab_assignments
)

# 15 main-app account-isolation tables (manual_rls.sql ENABLE ROW LEVEL SECURITY 清单)
MAIN_TABLES=(
  ip_accounts
  step_data
  histories
  topics
  assets
  diagnosis_reports
  feedback_logs
  evolution_profiles
  evolution_insights
  deep_learning_archives
  knowledge_favorites
  knowledge_notes
  daily_tasks
  cost_log
  trending_items
)

FAIL=0

echo "=== admin tables (26): expect RLS DISABLED ==="
ADMIN_VERIFIED=0
for tbl in "${ADMIN_TABLES[@]}"; do
  result=$(psql "$DB" -tAc "SELECT relrowsecurity FROM pg_class WHERE relname='${tbl}'" 2>/dev/null || echo "ERROR")
  if [[ "$result" == "f" ]]; then
    echo "  ✓ ${tbl} RLS DISABLED"
    ADMIN_VERIFIED=$((ADMIN_VERIFIED + 1))
  elif [[ "$result" == "ERROR" || -z "$result" ]]; then
    echo "  ? ${tbl} NOT FOUND (table may not exist yet)"
  else
    echo "  ✗ ${tbl} RLS ENABLED (expected DISABLED)"
    FAIL=1
  fi
done

echo ""
echo "=== main-app account tables (15): expect RLS ENABLED ==="
MAIN_VERIFIED=0
for tbl in "${MAIN_TABLES[@]}"; do
  result=$(psql "$DB" -tAc "SELECT relrowsecurity FROM pg_class WHERE relname='${tbl}'" 2>/dev/null || echo "ERROR")
  if [[ "$result" == "t" ]]; then
    echo "  ✓ ${tbl} RLS ENABLED"
    MAIN_VERIFIED=$((MAIN_VERIFIED + 1))
  elif [[ "$result" == "ERROR" || -z "$result" ]]; then
    echo "  ? ${tbl} NOT FOUND"
    FAIL=1
  else
    echo "  ✗ ${tbl} RLS DISABLED (expected ENABLED)"
    FAIL=1
  fi
done

echo ""
echo "=== Summary ==="
echo "  Admin tables verified (RLS=false): ${ADMIN_VERIFIED}/26"
echo "  Main tables verified  (RLS=true):  ${MAIN_VERIFIED}/15"

if [[ $FAIL -eq 0 ]]; then
  echo "PASS: all RLS states verified · 0 mismatches"
  exit 0
else
  echo "FAIL: one or more RLS states incorrect"
  exit 1
fi
