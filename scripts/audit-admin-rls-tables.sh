#!/usr/bin/env bash
# scripts/audit-admin-rls-tables.sh
# Verify 14 admin tables have RLS DISABLED and 12 account-isolation tables have RLS ENABLED
# AC-7: exit 0 = pass · exit 1 = fail (LD-A3 双向验证)

set -euo pipefail

DB=${DATABASE_URL:-"postgresql://return@localhost:5432/quanqn"}

# 14 admin tables (PRD-10 US-001 AC-4 list)
ADMIN_TABLES=(
  admin_audit_log
  approval_requests
  admin_users
  admin_sessions
  prompt_versions
  prompt_canary_config
  user_quota
  quota_adjustment_log
  trending_review_queue
  deep_learn_review_queue
  admin_invite_campaign
  admin_constants
  admin_config
  admin_ab_experiment
)

# 12 main-app account-isolation tables (from manual_rls.sql)
# Global tables (users/sessions/invite_codes/audit_log/trending_items) intentionally excluded
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
)

FAIL=0

echo "=== admin tables: expect RLS DISABLED ==="
for tbl in "${ADMIN_TABLES[@]}"; do
  result=$(psql "$DB" -tAc "SELECT relrowsecurity FROM pg_class WHERE relname='${tbl}'" 2>/dev/null || echo "ERROR")
  if [[ "$result" == "f" ]]; then
    echo "  ✓ ${tbl} RLS DISABLED"
  elif [[ "$result" == "ERROR" || -z "$result" ]]; then
    echo "  ? ${tbl} NOT FOUND"
    FAIL=1
  else
    echo "  ✗ ${tbl} RLS ENABLED (expected DISABLED)"
    FAIL=1
  fi
done

echo ""
echo "=== main-app account tables: expect RLS ENABLED ==="
for tbl in "${MAIN_TABLES[@]}"; do
  result=$(psql "$DB" -tAc "SELECT relrowsecurity FROM pg_class WHERE relname='${tbl}'" 2>/dev/null || echo "ERROR")
  if [[ "$result" == "t" ]]; then
    echo "  ✓ ${tbl} RLS ENABLED"
  elif [[ "$result" == "ERROR" || -z "$result" ]]; then
    echo "  ? ${tbl} NOT FOUND"
    FAIL=1
  else
    echo "  ✗ ${tbl} RLS DISABLED (expected ENABLED)"
    FAIL=1
  fi
done

echo ""
if [[ $FAIL -eq 0 ]]; then
  echo "PASS: all RLS states verified"
  exit 0
else
  echo "FAIL: one or more RLS states incorrect"
  exit 1
fi
