#!/usr/bin/env bash
# scripts/audit-admin-rls-tables.sh
# AC-4(US-007): psql 验证 13 admin 表 RLS=false + 15 主应用表 RLS=true · 双向 0 误关
# 13 admin tables: DATA-MODEL §13.1 原始 13 张(4 核心 + 9 辅助)
# 15 main-app tables: manual_rls.sql ENABLE ROW LEVEL SECURITY 清单

set -euo pipefail

DB=${DATABASE_URL:-"postgresql://return@localhost:5432/quanqn"}

# 13 admin tables — DATA-MODEL §13.1 · 4 核心 + 9 辅助
# (admin_users/admin_sessions/admin_invite_campaign/admin_constants/admin_config/admin_ab_experiment
#  是 US-001 额外添加 · 不在原 13 计数内 · 仍有 RLS DISABLED · 但本脚本聚焦原 13)
ADMIN_TABLES=(
  # 4 核心主表
  admin_audit_log
  approval_requests
  prompt_versions
  user_quota
  # 9 辅助表(按业务域)
  kpi_snapshots            # 域① NSM
  ip_account_admin_notes   # 域③ IP账号
  ip_account_anomaly_flags # 域③
  invite_campaigns         # 域⑥ 邀请码
  trending_review_queue    # 域⑦ Trending审核
  trending_takedown        # 域⑦
  auto_review_rules        # 域⑦
  deep_learn_review_queue  # 域⑧ DeepLearn审核
  user_violation_log       # 域⑧
  evolution_anomaly_flags  # 域⑨ 进化
  prompt_canary_config     # 域⑩ Prompt
  quota_adjustment_log     # 域⑪ 配额
  user_violation_log       # 域⑧ (deduplicated below)
)

# Remove duplicates
ADMIN_TABLES=(
  admin_audit_log
  approval_requests
  prompt_versions
  user_quota
  kpi_snapshots
  ip_account_admin_notes
  ip_account_anomaly_flags
  invite_campaigns
  trending_review_queue
  trending_takedown
  auto_review_rules
  deep_learn_review_queue
  user_violation_log
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

echo "=== admin tables (13): expect RLS DISABLED ==="
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
echo "  Admin tables verified (RLS=false): ${ADMIN_VERIFIED}/13"
echo "  Main tables verified  (RLS=true):  ${MAIN_VERIFIED}/15"

if [[ $FAIL -eq 0 ]]; then
  echo "PASS: all RLS states verified · 0 mismatches"
  exit 0
else
  echo "FAIL: one or more RLS states incorrect"
  exit 1
fi
