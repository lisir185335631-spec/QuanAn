-- PRD-37 US-P04: 行业两层 schema 底座
-- migration SQL 已生成 · 待 DB 环境应用
-- 向后兼容: 保留现有 industry 字段(双写过渡期 · 不删)

ALTER TABLE "ip_accounts"
  ADD COLUMN "industry_category" VARCHAR(64),
  ADD COLUMN "industry_sub" VARCHAR(64),
  ADD COLUMN "industry_sub_custom" BOOLEAN NOT NULL DEFAULT false;

-- 可选索引: 按子行业过滤统计
CREATE INDEX "ip_accounts_industry_category_idx" ON "ip_accounts"("industry_category");
CREATE INDEX "ip_accounts_industry_sub_idx" ON "ip_accounts"("industry_sub");
