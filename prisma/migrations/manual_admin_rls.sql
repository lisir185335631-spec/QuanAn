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
-- P2 后续 4 张表(P9.4 实施)· 此处占位 · 实际 ALTER 等表创建后再跑
-- ========================================================================

-- 注 · ab_experiments / ab_assignments / feature_flags / system_config 在 P9.4
-- 实施时通过 prisma migration 创建后,再单独追加 DISABLE 语句到本文件 + 重跑。
-- 当前 P0 阶段 · 注释占位:

-- ALTER TABLE ab_experiments           DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE ab_assignments           DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE feature_flags            DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE system_config            DISABLE ROW LEVEL SECURITY;

-- ========================================================================
-- 验证 · 跑完后查 RLS 状态
-- ========================================================================

-- SELECT tablename, rowsecurity FROM pg_tables
--   WHERE tablename IN ('admin_audit_log', 'approval_requests', ...)
--   ORDER BY tablename;
-- 期望 · 全部 rowsecurity = false
