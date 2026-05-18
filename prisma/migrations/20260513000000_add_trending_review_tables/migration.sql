-- Migration: add_trending_review_tables
-- Note: Tables trending_review_queue, trending_takedown, auto_review_rules were
-- included in the initial schema (20260507000000_init/migration.sql lines 599-641).
-- This migration registers them formally as domain ⑦ tables (PRD-12 US-001).

-- CreateTable (IF NOT EXISTS — tables already exist from init migration)
CREATE TABLE IF NOT EXISTS "trending_review_queue" (
    "id" SERIAL NOT NULL,
    "sourcePlatform" TEXT NOT NULL,
    "sourceItemId" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "rawContent" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "autoScanResult" JSONB NOT NULL,
    "autoVerdict" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reviewerAdminId" INTEGER,
    "reviewedAt" TIMESTAMP(3),
    "rejectReason" TEXT,
    "trendingItemId" INTEGER,

    CONSTRAINT "trending_review_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable (IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS "trending_takedown" (
    "id" SERIAL NOT NULL,
    "trendingItemId" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "takedownByAdminId" INTEGER,
    "takedownAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hasAppeal" BOOLEAN NOT NULL DEFAULT false,
    "appealResolution" TEXT,
    "appealResolvedAt" TIMESTAMP(3),

    CONSTRAINT "trending_takedown_pkey" PRIMARY KEY ("id")
);

-- CreateTable (IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS "auto_review_rules" (
    "id" SERIAL NOT NULL,
    "ruleType" TEXT NOT NULL,
    "ruleKey" TEXT NOT NULL,
    "ruleValue" JSONB NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedByAdminId" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auto_review_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS "trending_review_queue_status_fetchedAt_idx" ON "trending_review_queue"("status", "fetchedAt" DESC);

-- CreateIndex (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS "trending_review_queue_sourcePlatform_status_idx" ON "trending_review_queue"("sourcePlatform", "status");

-- CreateIndex (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS "trending_review_queue_autoVerdict_idx" ON "trending_review_queue"("autoVerdict");

-- CreateIndex (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS "trending_review_queue_reviewerAdminId_idx" ON "trending_review_queue"("reviewerAdminId");

-- CreateIndex (IF NOT EXISTS)
CREATE UNIQUE INDEX IF NOT EXISTS "trending_review_queue_sourcePlatform_sourceItemId_key" ON "trending_review_queue"("sourcePlatform", "sourceItemId");

-- CreateIndex (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS "trending_takedown_trendingItemId_idx" ON "trending_takedown"("trendingItemId");

-- CreateIndex (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS "trending_takedown_takedownAt_idx" ON "trending_takedown"("takedownAt" DESC);

-- CreateIndex (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS "auto_review_rules_ruleType_enabled_idx" ON "auto_review_rules"("ruleType", "enabled");

-- CreateIndex (IF NOT EXISTS)
CREATE UNIQUE INDEX IF NOT EXISTS "auto_review_rules_ruleType_ruleKey_key" ON "auto_review_rules"("ruleType", "ruleKey");
