-- prisma/migrations/manual_admin_rls.sql
-- admin 子系统 13(+ P2 后续 4)张新表的 RLS 策略
--
-- 派生 · DATA-MODEL.md §13.8 RLS 策略扩展
-- 关联 · ADR-021 admin 独立部署 · ARCHITECTURE.md §1.4b 主/admin 边界
--
-- 设计原则 ·
--   · 13 admin 新表全部 DISABLE ROW LEVEL SECURITY(不开 RLS)
--   · 走应用层 admin role check(adminRLS middleware 设 app.role='admin')
--   · 普通用户 procedure 不允许 query 这些表(grep 检测 + 测试用例验证)
--   · 测试用例必含"普通用户 query admin_audit_log → 401"验证
--
-- 关联文档 ·
--   · AGENTS.md §10 R-A4(应用层硬约束)
--   · DATA-MODEL.md §9 主应用 RLS 策略
--   · DATA-MODEL.md §13.2-§13.7 admin 13 表 schema
--
-- 应用顺序 ·
--   1. prisma migrate deploy(应用 13 admin 表的 schema migration)
--   2. psql $DATABASE_URL -f prisma/migrations/manual_admin_rls.sql(应用本文件)
--   3. 测试 · 普通用户 procedure query 应返 401(参 AGENTS §10 R-A4)

-- ========================================================================
-- 13 admin 表(P0-P9 实施期使用)
-- ========================================================================

ALTER TABLE admin_audit_log         DISABLE ROW LEVEL SECURITY;
ALTER TABLE approval_requests        DISABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_versions          DISABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_canary_config     DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_quota               DISABLE ROW LEVEL SECURITY;
ALTER TABLE quota_adjustment_log     DISABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_snapshots            DISABLE ROW LEVEL SECURITY;
ALTER TABLE ip_account_admin_notes   DISABLE ROW LEVEL SECURITY;
ALTER TABLE ip_account_anomaly_flags DISABLE ROW LEVEL SECURITY;
ALTER TABLE invite_campaigns         DISABLE ROW LEVEL SECURITY;
ALTER TABLE trending_review_queue    DISABLE ROW LEVEL SECURITY;
ALTER TABLE trending_takedown        DISABLE ROW LEVEL SECURITY;
ALTER TABLE auto_review_rules        DISABLE ROW LEVEL SECURITY;
ALTER TABLE deep_learn_review_queue  DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_violation_log       DISABLE ROW LEVEL SECURITY;
ALTER TABLE evolution_anomaly_flags  DISABLE ROW LEVEL SECURITY;

-- ========================================================================
-- PRD-10 US-001 新增 6 张 admin 鉴权 + 配置表
-- ========================================================================

ALTER TABLE admin_users              DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions           DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_invite_campaign    DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_constants          DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_config             DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_ab_experiment      DISABLE ROW LEVEL SECURITY;

-- ========================================================================
-- P2 后续 4 张表(P9.4 实施)
-- ========================================================================

ALTER TABLE ab_experiments           DISABLE ROW LEVEL SECURITY;
ALTER TABLE ab_assignments           DISABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags            DISABLE ROW LEVEL SECURITY;
ALTER TABLE system_config            DISABLE ROW LEVEL SECURITY;

-- ========================================================================
-- Helper functions(调试用 · super_admin only)
-- ========================================================================

CREATE OR REPLACE FUNCTION enable_admin_rls(tablename TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tablename);
END;
$$;

CREATE OR REPLACE FUNCTION disable_admin_rls(tablename TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', tablename);
END;
$$;

-- ========================================================================
-- 验证 · 跑完后查 RLS 状态
-- ========================================================================

-- SELECT tablename, rowsecurity FROM pg_tables
--   WHERE tablename IN (
--     'admin_audit_log','approval_requests','admin_users','admin_sessions',
--     'prompt_versions','prompt_canary_config','user_quota','quota_adjustment_log',
--     'trending_review_queue','deep_learn_review_queue',
--     'admin_invite_campaign','admin_constants','admin_config','admin_ab_experiment'
--   ) ORDER BY tablename;
-- 期望 · 全部 rowsecurity = false
