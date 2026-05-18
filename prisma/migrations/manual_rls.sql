-- QuanQn · RLS 策略集
-- 数据隔离闸 2(ADR-010 + LD-009 + R-4/5/6)
--
-- 必须在 prisma migrate 之后手动应用:
--   psql $DATABASE_URL -f prisma/migrations/manual_rls.sql
--
-- 顺序:
--   1. ENABLE RLS(12 表)
--   2. 各表用户策略(account_id 隔离)
--   3. admin bypass 策略
--   4. TrendingItem 写权限策略

-- ============================================================
-- 1. 启用 RLS(主应用 18 表 · LD-A-2 · users 包含在内)
-- ============================================================

ALTER TABLE users                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE ip_accounts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE step_data               ENABLE ROW LEVEL SECURITY;
ALTER TABLE histories               ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnosis_reports       ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_logs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE evolution_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE evolution_insights      ENABLE ROW LEVEL SECURITY;
ALTER TABLE deep_learning_archives  ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_favorites     ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_notes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tasks             ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_log                ENABLE ROW LEVEL SECURITY;

-- 全局表 + 运维表显式不启用(invite_codes / trending_items / audit_log)
-- users は主应用 18 表の一部として RLS 有効化済み(US-005)

-- ============================================================
-- 2. IpAccount · 按 user_id 隔离
-- ============================================================

CREATE POLICY ip_account_user_isolation ON ip_accounts
  FOR ALL
  USING (user_id = NULLIF(current_setting('app.current_user_id', true), '')::int)
  WITH CHECK (user_id = NULLIF(current_setting('app.current_user_id', true), '')::int);

-- ============================================================
-- 3. 11 张子表 · 按 account_id 隔离(通用模板)
-- ============================================================

CREATE POLICY step_data_account_isolation ON step_data
  FOR ALL USING (account_id = NULLIF(current_setting('app.current_account_id', true), '')::int)
  WITH CHECK (account_id = NULLIF(current_setting('app.current_account_id', true), '')::int);

CREATE POLICY histories_account_isolation ON histories
  FOR ALL USING (account_id = NULLIF(current_setting('app.current_account_id', true), '')::int)
  WITH CHECK (account_id = NULLIF(current_setting('app.current_account_id', true), '')::int);

CREATE POLICY topics_account_isolation ON topics
  FOR ALL USING (account_id = NULLIF(current_setting('app.current_account_id', true), '')::int)
  WITH CHECK (account_id = NULLIF(current_setting('app.current_account_id', true), '')::int);

CREATE POLICY assets_account_isolation ON assets
  FOR ALL USING (account_id = NULLIF(current_setting('app.current_account_id', true), '')::int)
  WITH CHECK (account_id = NULLIF(current_setting('app.current_account_id', true), '')::int);

CREATE POLICY diagnosis_reports_account_isolation ON diagnosis_reports
  FOR ALL USING (account_id = NULLIF(current_setting('app.current_account_id', true), '')::int)
  WITH CHECK (account_id = NULLIF(current_setting('app.current_account_id', true), '')::int);

CREATE POLICY feedback_logs_account_isolation ON feedback_logs
  FOR ALL USING (account_id = NULLIF(current_setting('app.current_account_id', true), '')::int)
  WITH CHECK (account_id = NULLIF(current_setting('app.current_account_id', true), '')::int);

CREATE POLICY evolution_profiles_account_isolation ON evolution_profiles
  FOR ALL USING (account_id = NULLIF(current_setting('app.current_account_id', true), '')::int)
  WITH CHECK (account_id = NULLIF(current_setting('app.current_account_id', true), '')::int);

CREATE POLICY evolution_insights_account_isolation ON evolution_insights
  FOR ALL USING (account_id = NULLIF(current_setting('app.current_account_id', true), '')::int)
  WITH CHECK (account_id = NULLIF(current_setting('app.current_account_id', true), '')::int);

CREATE POLICY deep_learning_archives_account_isolation ON deep_learning_archives
  FOR ALL USING (account_id = NULLIF(current_setting('app.current_account_id', true), '')::int)
  WITH CHECK (account_id = NULLIF(current_setting('app.current_account_id', true), '')::int);

CREATE POLICY knowledge_favorites_account_isolation ON knowledge_favorites
  FOR ALL USING (account_id = NULLIF(current_setting('app.current_account_id', true), '')::int)
  WITH CHECK (account_id = NULLIF(current_setting('app.current_account_id', true), '')::int);

CREATE POLICY knowledge_notes_account_isolation ON knowledge_notes
  FOR ALL USING (account_id = NULLIF(current_setting('app.current_account_id', true), '')::int)
  WITH CHECK (account_id = NULLIF(current_setting('app.current_account_id', true), '')::int);

CREATE POLICY daily_tasks_account_isolation ON daily_tasks
  FOR ALL USING (account_id = NULLIF(current_setting('app.current_account_id', true), '')::int)
  WITH CHECK (account_id = NULLIF(current_setting('app.current_account_id', true), '')::int);

CREATE POLICY cost_log_account_isolation ON cost_log
  FOR ALL USING (account_id = NULLIF(current_setting('app.current_account_id', true), '')::int)
  WITH CHECK (account_id = NULLIF(current_setting('app.current_account_id', true), '')::int);

-- ============================================================
-- 4. users 表策略(全局身份表 · auth lookup 需 SELECT open · US-005)
-- ============================================================

-- auth 需要按 email SELECT · current_user_id 尚未设置时也须可查
CREATE POLICY users_select_open ON users
  FOR SELECT USING (true);

-- 用户可更新自己的记录(lastLoginAt / lastLoginIp 等)
CREATE POLICY users_update_own ON users
  FOR UPDATE
  USING (id = NULLIF(current_setting('app.current_user_id', true), '')::int);

-- 注册时 INSERT(无 user_id 上下文)
CREATE POLICY users_insert_open ON users
  FOR INSERT WITH CHECK (true);

-- admin 全量访问(跨用户 · US-006/007/008)
CREATE POLICY admin_full_access_users ON users
  FOR ALL USING (current_setting('app.role', true) = 'admin');

-- ============================================================
-- 5. admin role · 跨账号查询(白名单 bypass)
-- ============================================================

CREATE POLICY admin_full_access_ip_accounts ON ip_accounts
  FOR ALL USING (current_setting('app.role', true) = 'admin');

CREATE POLICY admin_full_access_step_data ON step_data
  FOR ALL USING (current_setting('app.role', true) = 'admin');

CREATE POLICY admin_full_access_histories ON histories
  FOR ALL USING (current_setting('app.role', true) = 'admin');

CREATE POLICY admin_full_access_feedback_logs ON feedback_logs
  FOR ALL USING (current_setting('app.role', true) = 'admin');

CREATE POLICY admin_full_access_topics ON topics
  FOR ALL USING (current_setting('app.role', true) = 'admin');

CREATE POLICY admin_full_access_assets ON assets
  FOR ALL USING (current_setting('app.role', true) = 'admin');

CREATE POLICY admin_full_access_diagnosis_reports ON diagnosis_reports
  FOR ALL USING (current_setting('app.role', true) = 'admin');

CREATE POLICY admin_full_access_evolution_profiles ON evolution_profiles
  FOR ALL USING (current_setting('app.role', true) = 'admin');

CREATE POLICY admin_full_access_evolution_insights ON evolution_insights
  FOR ALL USING (current_setting('app.role', true) = 'admin');

CREATE POLICY admin_full_access_deep_learning_archives ON deep_learning_archives
  FOR ALL USING (current_setting('app.role', true) = 'admin');

CREATE POLICY admin_full_access_knowledge_favorites ON knowledge_favorites
  FOR ALL USING (current_setting('app.role', true) = 'admin');

CREATE POLICY admin_full_access_knowledge_notes ON knowledge_notes
  FOR ALL USING (current_setting('app.role', true) = 'admin');

CREATE POLICY admin_full_access_daily_tasks ON daily_tasks
  FOR ALL USING (current_setting('app.role', true) = 'admin');

CREATE POLICY admin_full_access_cost_log ON cost_log
  FOR ALL USING (current_setting('app.role', true) = 'admin');

-- ============================================================
-- 5. TrendingItem 写权限(仅 worker role)
-- ============================================================

ALTER TABLE trending_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY trending_item_read_all ON trending_items
  FOR SELECT
  USING (true);

CREATE POLICY trending_item_write_only_worker ON trending_items
  FOR INSERT
  WITH CHECK (current_setting('app.role', true) = 'worker');

CREATE POLICY trending_item_update_only_worker ON trending_items
  FOR UPDATE
  USING (current_setting('app.role', true) = 'worker');

CREATE POLICY admin_full_access_trending_items ON trending_items
  FOR ALL
  USING (current_setting('app.role', true) = 'admin');

-- ============================================================
-- 6. 验证(手动跑)
-- ============================================================

-- 看哪些表启用了 RLS:
--   SELECT schemaname, tablename, rowsecurity
--     FROM pg_tables
--     WHERE schemaname = 'public' AND rowsecurity = true;

-- 看策略列表:
--   SELECT * FROM pg_policies WHERE schemaname = 'public';
