-- Migration: add_deep_learn_review_tables
-- Note: Tables deep_learn_review_queue and user_violation_log were included in
-- the initial schema (20260507000000_init/migration.sql lines 645-683).
-- This migration registers them formally as domain ⑧ tables (PRD-12 US-007).

-- CreateTable (IF NOT EXISTS — tables already exist from init migration)
CREATE TABLE IF NOT EXISTS "deep_learn_review_queue" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "accountId" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileMime" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "autoScanResult" JSONB NOT NULL,
    "autoVerdict" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reviewerAdminId" INTEGER,
    "reviewedAt" TIMESTAMP(3),
    "rejectReason" TEXT,
    "archiveId" INTEGER,

    CONSTRAINT "deep_learn_review_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable (IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS "user_violation_log" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "violationType" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "lastViolationAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReviewItemId" INTEGER,
    "warningCount" INTEGER NOT NULL DEFAULT 0,
    "suspendedAt" TIMESTAMP(3),
    "suspendedByAdminId" INTEGER,
    "suspendedReason" TEXT,

    CONSTRAINT "user_violation_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS "deep_learn_review_queue_status_uploadedAt_idx" ON "deep_learn_review_queue"("status", "uploadedAt" DESC);

-- CreateIndex (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS "deep_learn_review_queue_userId_status_idx" ON "deep_learn_review_queue"("userId", "status");

-- CreateIndex (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS "deep_learn_review_queue_accountId_idx" ON "deep_learn_review_queue"("accountId");

-- CreateIndex (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS "deep_learn_review_queue_autoVerdict_idx" ON "deep_learn_review_queue"("autoVerdict");

-- CreateIndex (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS "user_violation_log_userId_idx" ON "user_violation_log"("userId");

-- CreateIndex (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS "user_violation_log_violationType_count_idx" ON "user_violation_log"("violationType", "count" DESC);

-- CreateUniqueIndex (IF NOT EXISTS)
CREATE UNIQUE INDEX IF NOT EXISTS "user_violation_log_userId_violationType_key" ON "user_violation_log"("userId", "violationType");
