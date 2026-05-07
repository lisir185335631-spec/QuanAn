-- QuanQn · pgvector ivfflat 索引
-- ADR-012(RAG 边界 + pgvector 选型)+ DATA-MODEL §10.4
--
-- 必须在 prisma migrate 后手动应用:
--   psql $DATABASE_URL -f prisma/migrations/manual_vector_indexes.sql

-- ============================================================
-- 启用扩展(若 prisma 没自动)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- TrendingItem · 全网爆款语义检索
-- ============================================================
-- 量级 · 10k+(滚动 · 30 天 TTL)
-- lists ≈ sqrt(10000) ≈ 100

CREATE INDEX IF NOT EXISTS trending_content_embedding_idx
  ON trending_items
  USING ivfflat (content_embedding vector_cosine_ops)
  WITH (lists = 100);

-- ============================================================
-- DeepLearningArchive · 用户专属风格样本
-- ============================================================
-- 量级 · per-account 平均 10-100 个 · 全用户合计可能 100k+
-- lists ≈ sqrt(100000) ≈ 316

CREATE INDEX IF NOT EXISTS deep_learning_style_vector_idx
  ON deep_learning_archives
  USING ivfflat (style_vector vector_cosine_ops)
  WITH (lists = 316);

-- ============================================================
-- History · 用户历史生成(可选 · MVP 不开)
-- ============================================================
-- 取消注释开启 · 但 MVP 阶段建议关 · 节省 embedding 成本
--
-- CREATE INDEX IF NOT EXISTS histories_content_embedding_idx
--   ON histories
--   USING ivfflat (content_embedding vector_cosine_ops)
--   WITH (lists = 200);

-- ============================================================
-- 维护命令(月度跑)
-- ============================================================

-- 看索引大小
--   SELECT relname, pg_size_pretty(pg_relation_size(oid)) AS size
--     FROM pg_class
--     WHERE relname LIKE '%_embedding_idx' OR relname LIKE '%_style_vector_idx';

-- REINDEX(月度 · 防膨胀)
--   REINDEX INDEX CONCURRENTLY trending_content_embedding_idx;
--   REINDEX INDEX CONCURRENTLY deep_learning_style_vector_idx;
