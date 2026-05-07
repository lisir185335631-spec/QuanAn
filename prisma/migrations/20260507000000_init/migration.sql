-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "open_id" VARCHAR(64) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "login_method" VARCHAR(32) NOT NULL DEFAULT 'google',
    "role" VARCHAR(16) NOT NULL DEFAULT 'user',
    "is_activated" BOOLEAN NOT NULL DEFAULT false,
    "industry" VARCHAR(64),
    "active_account_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_signed_in" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invite_codes" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(32) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "max_uses" INTEGER NOT NULL DEFAULT 1,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3),
    "created_by_id" INTEGER,
    "used_by_id" INTEGER,
    "used_at" TIMESTAMP(3),
    "campaign" VARCHAR(64),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invite_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trending_items" (
    "id" SERIAL NOT NULL,
    "platform" VARCHAR(32) NOT NULL,
    "source_url" VARCHAR(512),
    "source_item_id" VARCHAR(128),
    "vendor" VARCHAR(32) NOT NULL,
    "title" TEXT NOT NULL,
    "content_text" TEXT,
    "industry" VARCHAR(64),
    "present_style" VARCHAR(64),
    "author_name" VARCHAR(100),
    "author_followers" INTEGER,
    "view_count" BIGINT NOT NULL DEFAULT 0,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "share_count" INTEGER NOT NULL DEFAULT 0,
    "comment_count" INTEGER NOT NULL DEFAULT 0,
    "content_embedding" vector(1536),
    "published_at" TIMESTAMP(3),
    "crawled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trending_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ip_accounts" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "industry" VARCHAR(64) NOT NULL,
    "platform" VARCHAR(32) NOT NULL,
    "stage" VARCHAR(32) NOT NULL DEFAULT 'starter',
    "personal_info" TEXT,
    "target_audience" TEXT,
    "followers_range" VARCHAR(32) NOT NULL DEFAULT '0-1000',
    "ip_positioning" VARCHAR(255),
    "goal" VARCHAR(64),
    "current_revenue" VARCHAR(32),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "archived_at" TIMESTAMP(3),
    "trace_id" VARCHAR(64),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ip_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "step_data" (
    "id" SERIAL NOT NULL,
    "account_id" INTEGER NOT NULL,
    "step_key" VARCHAR(16) NOT NULL,
    "inputs" JSONB NOT NULL,
    "result" JSONB,
    "version" INTEGER NOT NULL DEFAULT 0,
    "schema_version" VARCHAR(8) NOT NULL DEFAULT '3.0',
    "status" VARCHAR(16) NOT NULL DEFAULT 'completed',
    "is_fallback" BOOLEAN NOT NULL DEFAULT false,
    "duration_ms" INTEGER,
    "tokens_used" INTEGER,
    "model_used" VARCHAR(64),
    "agent_id" VARCHAR(64) NOT NULL,
    "trace_id" VARCHAR(64),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "step_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "histories" (
    "id" SERIAL NOT NULL,
    "account_id" INTEGER NOT NULL,
    "agent_id" VARCHAR(64) NOT NULL,
    "agent_mode" VARCHAR(32),
    "source_type" VARCHAR(32) NOT NULL,
    "input_summary" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "content_type" VARCHAR(16) NOT NULL DEFAULT 'markdown',
    "script_type" VARCHAR(32),
    "elements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tokens_used" INTEGER,
    "model_used" VARCHAR(64),
    "duration_ms" INTEGER,
    "is_fallback" BOOLEAN NOT NULL DEFAULT false,
    "is_favorited" BOOLEAN NOT NULL DEFAULT false,
    "rating_good" INTEGER NOT NULL DEFAULT 0,
    "rating_bad" INTEGER NOT NULL DEFAULT 0,
    "trace_id" VARCHAR(64),
    "content_embedding" vector(1536),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topics" (
    "id" SERIAL NOT NULL,
    "account_id" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "hook" TEXT NOT NULL,
    "structure" TEXT,
    "formula" TEXT,
    "category" VARCHAR(32),
    "present_style" VARCHAR(32),
    "platform" VARCHAR(32),
    "difficulty" VARCHAR(16),
    "viral_potential" VARCHAR(16),
    "logic_type" VARCHAR(32),
    "source_type" VARCHAR(32) NOT NULL,
    "source_trending_id" INTEGER,
    "user_tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "used_at" TIMESTAMP(3),
    "generated_history_id" INTEGER,
    "trace_id" VARCHAR(64),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" SERIAL NOT NULL,
    "account_id" INTEGER NOT NULL,
    "asset_type" VARCHAR(32) NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "storage_provider" VARCHAR(16) NOT NULL DEFAULT 's3',
    "storage_key" VARCHAR(512) NOT NULL,
    "public_url" VARCHAR(512),
    "related_step_key" VARCHAR(16),
    "related_history_id" INTEGER,
    "generation_prompt" TEXT,
    "generation_model" VARCHAR(64),
    "parsed_text" TEXT,
    "parsing_status" VARCHAR(16) NOT NULL DEFAULT 'pending',
    "parsing_error" TEXT,
    "trace_id" VARCHAR(64),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnosis_reports" (
    "id" SERIAL NOT NULL,
    "account_id" INTEGER NOT NULL,
    "answers" JSONB NOT NULL,
    "dimensions" JSONB NOT NULL,
    "overall_score" INTEGER NOT NULL,
    "inferred_stage" VARCHAR(32) NOT NULL,
    "top_priority" TEXT NOT NULL,
    "recommended_steps" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "agent_id" VARCHAR(64) NOT NULL DEFAULT 'DiagnosisAgent',
    "model_used" VARCHAR(64),
    "tokens_used" INTEGER,
    "duration_ms" INTEGER,
    "is_fallback" BOOLEAN NOT NULL DEFAULT false,
    "trace_id" VARCHAR(64),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "diagnosis_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback_logs" (
    "id" SERIAL NOT NULL,
    "account_id" INTEGER NOT NULL,
    "user_id" INTEGER,
    "history_id" INTEGER,
    "rateable_type" VARCHAR(32) NOT NULL,
    "rateable_id" INTEGER NOT NULL,
    "rating" VARCHAR(8) NOT NULL,
    "comment" TEXT,
    "agent_id" VARCHAR(64) NOT NULL,
    "agent_mode" VARCHAR(32),
    "script_type" VARCHAR(32),
    "elements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "consumed_by_evolution" BOOLEAN NOT NULL DEFAULT false,
    "consumed_at" TIMESTAMP(3),
    "consumed_by_insight_id" INTEGER,
    "trace_id" VARCHAR(64),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evolution_profiles" (
    "id" SERIAL NOT NULL,
    "account_id" INTEGER NOT NULL,
    "level" VARCHAR(4) NOT NULL DEFAULT 'L1',
    "feedback_count_good" INTEGER NOT NULL DEFAULT 0,
    "feedback_count_bad" INTEGER NOT NULL DEFAULT 0,
    "feedback_count_total" INTEGER NOT NULL DEFAULT 0,
    "satisfaction_rate" DOUBLE PRECISION,
    "current_direction" VARCHAR(32) NOT NULL DEFAULT '综合',
    "auto_evolution_enabled" BOOLEAN NOT NULL DEFAULT false,
    "latest_insight_id" INTEGER,
    "latest_insight" JSONB,
    "deep_learning_count" INTEGER NOT NULL DEFAULT 0,
    "last_evolved_at" TIMESTAMP(3),
    "last_upgraded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evolution_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evolution_insights" (
    "id" SERIAL NOT NULL,
    "account_id" INTEGER NOT NULL,
    "trigger_type" VARCHAR(32) NOT NULL,
    "direction" VARCHAR(32) NOT NULL,
    "content" JSONB NOT NULL,
    "source_feedback_ids" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "source_sample_ids" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "agent_id" VARCHAR(64) NOT NULL DEFAULT 'EvolutionAgent',
    "model_used" VARCHAR(64),
    "tokens_used" INTEGER,
    "duration_ms" INTEGER,
    "is_fallback" BOOLEAN NOT NULL DEFAULT false,
    "level_before" VARCHAR(4),
    "level_after" VARCHAR(4),
    "trace_id" VARCHAR(64),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evolution_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deep_learning_archives" (
    "id" SERIAL NOT NULL,
    "account_id" INTEGER NOT NULL,
    "source_type" VARCHAR(16) NOT NULL,
    "source_asset_id" INTEGER,
    "sample" TEXT NOT NULL,
    "sample_hash" VARCHAR(64) NOT NULL,
    "summary" TEXT,
    "style_vector" vector(1536),
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "style_profile" JSONB,
    "learning_status" VARCHAR(16) NOT NULL DEFAULT 'pending',
    "learning_error" TEXT,
    "user_title" VARCHAR(100),
    "user_tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "agent_id" VARCHAR(64) NOT NULL DEFAULT 'DeepLearnAgent',
    "model_used" VARCHAR(64),
    "tokens_used" INTEGER,
    "trace_id" VARCHAR(64),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deep_learning_archives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_favorites" (
    "id" SERIAL NOT NULL,
    "account_id" INTEGER NOT NULL,
    "item_type" VARCHAR(32) NOT NULL,
    "item_key" VARCHAR(128) NOT NULL,
    "user_tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "note_id" INTEGER,
    "trace_id" VARCHAR(64),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_notes" (
    "id" SERIAL NOT NULL,
    "account_id" INTEGER NOT NULL,
    "item_type" VARCHAR(32),
    "item_key" VARCHAR(128),
    "content" TEXT NOT NULL,
    "title" VARCHAR(200),
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "trace_id" VARCHAR(64),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_log" (
    "id" BIGSERIAL NOT NULL,
    "account_id" INTEGER,
    "user_id" INTEGER,
    "agent_id" VARCHAR(64) NOT NULL,
    "agent_mode" VARCHAR(32),
    "call_type" VARCHAR(32) NOT NULL,
    "model_tier" VARCHAR(16) NOT NULL,
    "model_used" VARCHAR(64) NOT NULL,
    "provider" VARCHAR(32) NOT NULL,
    "prompt_tokens" INTEGER NOT NULL DEFAULT 0,
    "completion_tokens" INTEGER NOT NULL DEFAULT 0,
    "total_tokens" INTEGER NOT NULL DEFAULT 0,
    "image_count" INTEGER,
    "audio_seconds" INTEGER,
    "characters_in" INTEGER,
    "cost_usd" DECIMAL(10,6) NOT NULL,
    "duration_ms" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "error_code" VARCHAR(32),
    "is_fallback" BOOLEAN NOT NULL DEFAULT false,
    "fallback_from" VARCHAR(64),
    "fallback_to" VARCHAR(64),
    "fallback_reason" VARCHAR(128),
    "trace_id" VARCHAR(64),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cost_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" BIGSERIAL NOT NULL,
    "user_id" INTEGER,
    "account_id" INTEGER,
    "event_type" VARCHAR(64) NOT NULL,
    "event_category" VARCHAR(32) NOT NULL,
    "resource_type" VARCHAR(32),
    "resource_id" INTEGER,
    "payload" JSONB,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "error_code" VARCHAR(32),
    "error_message" TEXT,
    "trace_id" VARCHAR(64),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_tasks" (
    "id" SERIAL NOT NULL,
    "account_id" INTEGER NOT NULL,
    "task_date" DATE NOT NULL,
    "tasks" JSONB NOT NULL,
    "completed_count" INTEGER NOT NULL DEFAULT 0,
    "total_count" INTEGER NOT NULL DEFAULT 0,
    "agent_id" VARCHAR(64) NOT NULL DEFAULT 'DailyTaskAgent',
    "model_used" VARCHAR(64),
    "is_fallback" BOOLEAN NOT NULL DEFAULT false,
    "input_snapshot" JSONB,
    "trace_id" VARCHAR(64),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_audit_log" (
    "id" SERIAL NOT NULL,
    "actorAdminId" INTEGER NOT NULL,
    "actorRole" TEXT NOT NULL,
    "actorMode" TEXT,
    "eventCategory" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "targetUserId" INTEGER,
    "targetAccountId" INTEGER,
    "targetEntity" TEXT,
    "targetEntityId" TEXT,
    "payloadHash" VARCHAR(64) NOT NULL,
    "payload" JSONB,
    "approvalRequestId" INTEGER,
    "traceId" VARCHAR(64) NOT NULL,
    "ip" VARCHAR(45) NOT NULL,
    "userAgent" VARCHAR(500) NOT NULL,
    "sessionId" VARCHAR(64) NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_requests" (
    "id" SERIAL NOT NULL,
    "requesterAdminId" INTEGER NOT NULL,
    "requesterRole" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "actionPayload" JSONB NOT NULL,
    "actionContext" JSONB,
    "riskLevel" TEXT NOT NULL,
    "requireDualApproval" BOOLEAN NOT NULL DEFAULT false,
    "isEmergency" BOOLEAN NOT NULL DEFAULT false,
    "requesterReason" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "approverAdminId" INTEGER,
    "decisionReason" TEXT,
    "secondApproverAdminId" INTEGER,
    "secondDecisionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "executedAt" TIMESTAMP(3),
    "postReviewAt" TIMESTAMP(3),

    CONSTRAINT "approval_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prompt_versions" (
    "id" SERIAL NOT NULL,
    "specialistId" TEXT NOT NULL,
    "mode" TEXT,
    "version" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "contentHash" VARCHAR(64) NOT NULL,
    "status" TEXT NOT NULL,
    "judgeScore" DECIMAL(3,2),
    "judgeRunId" TEXT,
    "judgeReportUrl" TEXT,
    "createdByAdminId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedByAdminId" INTEGER,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "prompt_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prompt_canary_config" (
    "id" SERIAL NOT NULL,
    "specialistId" TEXT NOT NULL,
    "mode" TEXT,
    "currentVersionId" INTEGER NOT NULL,
    "nextVersionId" INTEGER,
    "canaryPct" INTEGER NOT NULL DEFAULT 0,
    "strategy" TEXT NOT NULL,
    "canaryStartedAt" TIMESTAMP(3),
    "canaryEndsAt" TIMESTAMP(3),
    "updatedByAdminId" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prompt_canary_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_quota" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "plan" TEXT NOT NULL,
    "dailyQuota" INTEGER NOT NULL,
    "dailyUsed" INTEGER NOT NULL DEFAULT 0,
    "monthlyQuota" INTEGER NOT NULL,
    "monthlyUsed" INTEGER NOT NULL DEFAULT 0,
    "imageDailyQuota" INTEGER NOT NULL DEFAULT 0,
    "imageDailyUsed" INTEGER NOT NULL DEFAULT 0,
    "dailyResetAt" TIMESTAMP(3) NOT NULL,
    "monthlyResetAt" TIMESTAMP(3) NOT NULL,
    "isOnWhitelist" BOOLEAN NOT NULL DEFAULT false,
    "whitelistExpiresAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_quota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quota_adjustment_log" (
    "id" SERIAL NOT NULL,
    "userQuotaId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "adminId" INTEGER NOT NULL,
    "adminMode" TEXT,
    "field" TEXT NOT NULL,
    "oldValue" INTEGER,
    "newValue" INTEGER,
    "delta" INTEGER,
    "reason" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isExpired" BOOLEAN NOT NULL DEFAULT false,
    "expiredAt" TIMESTAMP(3),
    "approvalRequestId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quota_adjustment_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kpi_snapshots" (
    "id" SERIAL NOT NULL,
    "snapshotDate" DATE NOT NULL,
    "granularity" TEXT NOT NULL,
    "activeAccounts7d" INTEGER NOT NULL,
    "step9CompleteRate" DECIMAL(5,4) NOT NULL,
    "feedbackRate" DECIMAL(5,4) NOT NULL,
    "evolutionUpgradeRate" DECIMAL(5,4) NOT NULL,
    "d30Retention" DECIMAL(5,4) NOT NULL,
    "userPersonaDistribution" JSONB NOT NULL,
    "industryDistribution" JSONB NOT NULL,
    "platformDistribution" JSONB NOT NULL,
    "funnelData" JSONB NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kpi_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ip_account_admin_notes" (
    "id" SERIAL NOT NULL,
    "accountId" INTEGER NOT NULL,
    "adminId" INTEGER NOT NULL,
    "note" TEXT NOT NULL,
    "visibleToOtherAdmin" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ip_account_admin_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ip_account_anomaly_flags" (
    "id" SERIAL NOT NULL,
    "accountId" INTEGER NOT NULL,
    "anomalyType" TEXT NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "severity" TEXT NOT NULL,
    "evidence" JSONB NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "resolvedByAdminId" INTEGER,
    "resolution" TEXT,

    CONSTRAINT "ip_account_anomaly_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invite_campaigns" (
    "id" SERIAL NOT NULL,
    "campaignKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdByAdminId" INTEGER NOT NULL,
    "totalQuota" INTEGER NOT NULL,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invite_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trending_review_queue" (
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

-- CreateTable
CREATE TABLE "trending_takedown" (
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

-- CreateTable
CREATE TABLE "auto_review_rules" (
    "id" SERIAL NOT NULL,
    "ruleType" TEXT NOT NULL,
    "ruleKey" TEXT NOT NULL,
    "ruleValue" JSONB NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedByAdminId" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auto_review_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deep_learn_review_queue" (
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

-- CreateTable
CREATE TABLE "user_violation_log" (
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

-- CreateTable
CREATE TABLE "evolution_anomaly_flags" (
    "id" SERIAL NOT NULL,
    "accountId" INTEGER NOT NULL,
    "anomalyType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "evidence" JSONB NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,

    CONSTRAINT "evolution_anomaly_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ab_experiments" (
    "id" SERIAL NOT NULL,
    "experimentKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "variantConfig" JSONB NOT NULL,
    "trafficAllocation" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "stoppedAt" TIMESTAMP(3),
    "resultSummary" JSONB,
    "createdByAdminId" INTEGER NOT NULL,

    CONSTRAINT "ab_experiments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ab_assignments" (
    "id" SERIAL NOT NULL,
    "experimentId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "variant" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ab_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_flags" (
    "id" SERIAL NOT NULL,
    "flagKey" TEXT NOT NULL,
    "description" TEXT,
    "flagType" TEXT NOT NULL,
    "defaultValue" JSONB NOT NULL,
    "rolloutConfig" JSONB,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedByAdminId" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_config" (
    "id" SERIAL NOT NULL,
    "configKey" TEXT NOT NULL,
    "configValue" JSONB NOT NULL,
    "description" TEXT,
    "isEmergency" BOOLEAN NOT NULL DEFAULT false,
    "updatedByAdminId" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_open_id_key" ON "users"("open_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_open_id_idx" ON "users"("open_id");

-- CreateIndex
CREATE INDEX "users_active_account_id_idx" ON "users"("active_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "invite_codes_code_key" ON "invite_codes"("code");

-- CreateIndex
CREATE INDEX "invite_codes_code_idx" ON "invite_codes"("code");

-- CreateIndex
CREATE INDEX "invite_codes_campaign_idx" ON "invite_codes"("campaign");

-- CreateIndex
CREATE INDEX "invite_codes_created_by_id_idx" ON "invite_codes"("created_by_id");

-- CreateIndex
CREATE INDEX "invite_codes_is_active_expires_at_idx" ON "invite_codes"("is_active", "expires_at");

-- CreateIndex
CREATE INDEX "trending_items_platform_industry_idx" ON "trending_items"("platform", "industry");

-- CreateIndex
CREATE INDEX "trending_items_platform_present_style_idx" ON "trending_items"("platform", "present_style");

-- CreateIndex
CREATE INDEX "trending_items_crawled_at_idx" ON "trending_items"("crawled_at" DESC);

-- CreateIndex
CREATE INDEX "trending_items_view_count_idx" ON "trending_items"("view_count" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "trending_items_platform_source_item_id_key" ON "trending_items"("platform", "source_item_id");

-- CreateIndex
CREATE INDEX "ip_accounts_user_id_idx" ON "ip_accounts"("user_id");

-- CreateIndex
CREATE INDEX "ip_accounts_user_id_is_active_idx" ON "ip_accounts"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "ip_accounts_industry_idx" ON "ip_accounts"("industry");

-- CreateIndex
CREATE INDEX "ip_accounts_platform_idx" ON "ip_accounts"("platform");

-- CreateIndex
CREATE INDEX "step_data_account_id_idx" ON "step_data"("account_id");

-- CreateIndex
CREATE INDEX "step_data_account_id_status_idx" ON "step_data"("account_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "step_data_account_id_step_key_key" ON "step_data"("account_id", "step_key");

-- CreateIndex
CREATE INDEX "histories_account_id_idx" ON "histories"("account_id");

-- CreateIndex
CREATE INDEX "histories_account_id_agent_id_idx" ON "histories"("account_id", "agent_id");

-- CreateIndex
CREATE INDEX "histories_account_id_script_type_idx" ON "histories"("account_id", "script_type");

-- CreateIndex
CREATE INDEX "histories_account_id_created_at_idx" ON "histories"("account_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "histories_account_id_is_favorited_idx" ON "histories"("account_id", "is_favorited");

-- CreateIndex
CREATE INDEX "histories_trace_id_idx" ON "histories"("trace_id");

-- CreateIndex
CREATE INDEX "topics_account_id_idx" ON "topics"("account_id");

-- CreateIndex
CREATE INDEX "topics_account_id_category_idx" ON "topics"("account_id", "category");

-- CreateIndex
CREATE INDEX "topics_account_id_is_used_idx" ON "topics"("account_id", "is_used");

-- CreateIndex
CREATE INDEX "topics_account_id_created_at_idx" ON "topics"("account_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "assets_account_id_idx" ON "assets"("account_id");

-- CreateIndex
CREATE INDEX "assets_account_id_asset_type_idx" ON "assets"("account_id", "asset_type");

-- CreateIndex
CREATE INDEX "assets_account_id_related_step_key_idx" ON "assets"("account_id", "related_step_key");

-- CreateIndex
CREATE INDEX "assets_parsing_status_idx" ON "assets"("parsing_status");

-- CreateIndex
CREATE INDEX "diagnosis_reports_account_id_idx" ON "diagnosis_reports"("account_id");

-- CreateIndex
CREATE INDEX "diagnosis_reports_account_id_created_at_idx" ON "diagnosis_reports"("account_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "feedback_logs_account_id_idx" ON "feedback_logs"("account_id");

-- CreateIndex
CREATE INDEX "feedback_logs_account_id_rating_idx" ON "feedback_logs"("account_id", "rating");

-- CreateIndex
CREATE INDEX "feedback_logs_account_id_consumed_by_evolution_idx" ON "feedback_logs"("account_id", "consumed_by_evolution");

-- CreateIndex
CREATE INDEX "feedback_logs_account_id_agent_id_idx" ON "feedback_logs"("account_id", "agent_id");

-- CreateIndex
CREATE INDEX "feedback_logs_account_id_created_at_idx" ON "feedback_logs"("account_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "feedback_logs_trace_id_idx" ON "feedback_logs"("trace_id");

-- CreateIndex
CREATE INDEX "feedback_logs_user_id_idx" ON "feedback_logs"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "evolution_profiles_account_id_key" ON "evolution_profiles"("account_id");

-- CreateIndex
CREATE INDEX "evolution_profiles_level_idx" ON "evolution_profiles"("level");

-- CreateIndex
CREATE INDEX "evolution_profiles_account_id_level_idx" ON "evolution_profiles"("account_id", "level");

-- CreateIndex
CREATE INDEX "evolution_insights_account_id_idx" ON "evolution_insights"("account_id");

-- CreateIndex
CREATE INDEX "evolution_insights_account_id_created_at_idx" ON "evolution_insights"("account_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "evolution_insights_account_id_level_after_idx" ON "evolution_insights"("account_id", "level_after");

-- CreateIndex
CREATE INDEX "deep_learning_archives_account_id_idx" ON "deep_learning_archives"("account_id");

-- CreateIndex
CREATE INDEX "deep_learning_archives_account_id_learning_status_idx" ON "deep_learning_archives"("account_id", "learning_status");

-- CreateIndex
CREATE INDEX "deep_learning_archives_account_id_is_active_idx" ON "deep_learning_archives"("account_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "deep_learning_archives_account_id_sample_hash_key" ON "deep_learning_archives"("account_id", "sample_hash");

-- CreateIndex
CREATE INDEX "knowledge_favorites_account_id_idx" ON "knowledge_favorites"("account_id");

-- CreateIndex
CREATE INDEX "knowledge_favorites_account_id_item_type_idx" ON "knowledge_favorites"("account_id", "item_type");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_favorites_account_id_item_type_item_key_key" ON "knowledge_favorites"("account_id", "item_type", "item_key");

-- CreateIndex
CREATE INDEX "knowledge_notes_account_id_idx" ON "knowledge_notes"("account_id");

-- CreateIndex
CREATE INDEX "knowledge_notes_account_id_item_type_item_key_idx" ON "knowledge_notes"("account_id", "item_type", "item_key");

-- CreateIndex
CREATE INDEX "knowledge_notes_account_id_updated_at_idx" ON "knowledge_notes"("account_id", "updated_at" DESC);

-- CreateIndex
CREATE INDEX "cost_log_user_id_created_at_idx" ON "cost_log"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "cost_log_account_id_created_at_idx" ON "cost_log"("account_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "cost_log_agent_id_created_at_idx" ON "cost_log"("agent_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "cost_log_model_used_created_at_idx" ON "cost_log"("model_used", "created_at" DESC);

-- CreateIndex
CREATE INDEX "cost_log_provider_success_created_at_idx" ON "cost_log"("provider", "success", "created_at" DESC);

-- CreateIndex
CREATE INDEX "cost_log_trace_id_idx" ON "cost_log"("trace_id");

-- CreateIndex
CREATE INDEX "cost_log_created_at_idx" ON "cost_log"("created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_log_user_id_created_at_idx" ON "audit_log"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_log_account_id_created_at_idx" ON "audit_log"("account_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_log_event_type_created_at_idx" ON "audit_log"("event_type", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_log_trace_id_idx" ON "audit_log"("trace_id");

-- CreateIndex
CREATE INDEX "audit_log_created_at_idx" ON "audit_log"("created_at" DESC);

-- CreateIndex
CREATE INDEX "daily_tasks_account_id_idx" ON "daily_tasks"("account_id");

-- CreateIndex
CREATE INDEX "daily_tasks_task_date_idx" ON "daily_tasks"("task_date");

-- CreateIndex
CREATE INDEX "daily_tasks_account_id_task_date_idx" ON "daily_tasks"("account_id", "task_date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "daily_tasks_account_id_task_date_key" ON "daily_tasks"("account_id", "task_date");

-- CreateIndex
CREATE INDEX "admin_audit_log_actorAdminId_createdAt_idx" ON "admin_audit_log"("actorAdminId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "admin_audit_log_eventCategory_createdAt_idx" ON "admin_audit_log"("eventCategory", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "admin_audit_log_eventType_createdAt_idx" ON "admin_audit_log"("eventType", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "admin_audit_log_targetUserId_createdAt_idx" ON "admin_audit_log"("targetUserId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "admin_audit_log_targetAccountId_createdAt_idx" ON "admin_audit_log"("targetAccountId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "admin_audit_log_traceId_idx" ON "admin_audit_log"("traceId");

-- CreateIndex
CREATE INDEX "admin_audit_log_approvalRequestId_idx" ON "admin_audit_log"("approvalRequestId");

-- CreateIndex
CREATE INDEX "admin_audit_log_createdAt_idx" ON "admin_audit_log"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "approval_requests_status_createdAt_idx" ON "approval_requests"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "approval_requests_requesterAdminId_createdAt_idx" ON "approval_requests"("requesterAdminId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "approval_requests_approverAdminId_idx" ON "approval_requests"("approverAdminId");

-- CreateIndex
CREATE INDEX "approval_requests_riskLevel_status_idx" ON "approval_requests"("riskLevel", "status");

-- CreateIndex
CREATE INDEX "approval_requests_expiresAt_idx" ON "approval_requests"("expiresAt");

-- CreateIndex
CREATE INDEX "prompt_versions_specialistId_mode_status_idx" ON "prompt_versions"("specialistId", "mode", "status");

-- CreateIndex
CREATE INDEX "prompt_versions_status_createdAt_idx" ON "prompt_versions"("status", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "prompt_versions_specialistId_mode_version_key" ON "prompt_versions"("specialistId", "mode", "version");

-- CreateIndex
CREATE INDEX "prompt_canary_config_canaryPct_idx" ON "prompt_canary_config"("canaryPct");

-- CreateIndex
CREATE UNIQUE INDEX "prompt_canary_config_specialistId_mode_key" ON "prompt_canary_config"("specialistId", "mode");

-- CreateIndex
CREATE UNIQUE INDEX "user_quota_userId_key" ON "user_quota"("userId");

-- CreateIndex
CREATE INDEX "user_quota_plan_idx" ON "user_quota"("plan");

-- CreateIndex
CREATE INDEX "user_quota_dailyResetAt_idx" ON "user_quota"("dailyResetAt");

-- CreateIndex
CREATE INDEX "user_quota_whitelistExpiresAt_idx" ON "user_quota"("whitelistExpiresAt");

-- CreateIndex
CREATE INDEX "quota_adjustment_log_userId_createdAt_idx" ON "quota_adjustment_log"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "quota_adjustment_log_adminId_createdAt_idx" ON "quota_adjustment_log"("adminId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "quota_adjustment_log_expiresAt_isExpired_idx" ON "quota_adjustment_log"("expiresAt", "isExpired");

-- CreateIndex
CREATE INDEX "quota_adjustment_log_approvalRequestId_idx" ON "quota_adjustment_log"("approvalRequestId");

-- CreateIndex
CREATE INDEX "kpi_snapshots_granularity_snapshotDate_idx" ON "kpi_snapshots"("granularity", "snapshotDate" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "kpi_snapshots_snapshotDate_granularity_key" ON "kpi_snapshots"("snapshotDate", "granularity");

-- CreateIndex
CREATE INDEX "ip_account_admin_notes_accountId_createdAt_idx" ON "ip_account_admin_notes"("accountId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ip_account_admin_notes_adminId_idx" ON "ip_account_admin_notes"("adminId");

-- CreateIndex
CREATE INDEX "ip_account_anomaly_flags_accountId_idx" ON "ip_account_anomaly_flags"("accountId");

-- CreateIndex
CREATE INDEX "ip_account_anomaly_flags_anomalyType_detectedAt_idx" ON "ip_account_anomaly_flags"("anomalyType", "detectedAt" DESC);

-- CreateIndex
CREATE INDEX "ip_account_anomaly_flags_severity_resolvedAt_idx" ON "ip_account_anomaly_flags"("severity", "resolvedAt");

-- CreateIndex
CREATE UNIQUE INDEX "invite_campaigns_campaignKey_key" ON "invite_campaigns"("campaignKey");

-- CreateIndex
CREATE INDEX "invite_campaigns_status_startsAt_idx" ON "invite_campaigns"("status", "startsAt");

-- CreateIndex
CREATE INDEX "invite_campaigns_createdByAdminId_idx" ON "invite_campaigns"("createdByAdminId");

-- CreateIndex
CREATE INDEX "trending_review_queue_status_fetchedAt_idx" ON "trending_review_queue"("status", "fetchedAt" DESC);

-- CreateIndex
CREATE INDEX "trending_review_queue_sourcePlatform_status_idx" ON "trending_review_queue"("sourcePlatform", "status");

-- CreateIndex
CREATE INDEX "trending_review_queue_autoVerdict_idx" ON "trending_review_queue"("autoVerdict");

-- CreateIndex
CREATE INDEX "trending_review_queue_reviewerAdminId_idx" ON "trending_review_queue"("reviewerAdminId");

-- CreateIndex
CREATE UNIQUE INDEX "trending_review_queue_sourcePlatform_sourceItemId_key" ON "trending_review_queue"("sourcePlatform", "sourceItemId");

-- CreateIndex
CREATE INDEX "trending_takedown_trendingItemId_idx" ON "trending_takedown"("trendingItemId");

-- CreateIndex
CREATE INDEX "trending_takedown_takedownAt_idx" ON "trending_takedown"("takedownAt" DESC);

-- CreateIndex
CREATE INDEX "auto_review_rules_ruleType_enabled_idx" ON "auto_review_rules"("ruleType", "enabled");

-- CreateIndex
CREATE UNIQUE INDEX "auto_review_rules_ruleType_ruleKey_key" ON "auto_review_rules"("ruleType", "ruleKey");

-- CreateIndex
CREATE INDEX "deep_learn_review_queue_status_uploadedAt_idx" ON "deep_learn_review_queue"("status", "uploadedAt" DESC);

-- CreateIndex
CREATE INDEX "deep_learn_review_queue_userId_status_idx" ON "deep_learn_review_queue"("userId", "status");

-- CreateIndex
CREATE INDEX "deep_learn_review_queue_accountId_idx" ON "deep_learn_review_queue"("accountId");

-- CreateIndex
CREATE INDEX "deep_learn_review_queue_autoVerdict_idx" ON "deep_learn_review_queue"("autoVerdict");

-- CreateIndex
CREATE INDEX "user_violation_log_userId_idx" ON "user_violation_log"("userId");

-- CreateIndex
CREATE INDEX "user_violation_log_violationType_count_idx" ON "user_violation_log"("violationType", "count" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "user_violation_log_userId_violationType_key" ON "user_violation_log"("userId", "violationType");

-- CreateIndex
CREATE INDEX "evolution_anomaly_flags_accountId_idx" ON "evolution_anomaly_flags"("accountId");

-- CreateIndex
CREATE INDEX "evolution_anomaly_flags_anomalyType_detectedAt_idx" ON "evolution_anomaly_flags"("anomalyType", "detectedAt" DESC);

-- CreateIndex
CREATE INDEX "evolution_anomaly_flags_severity_resolvedAt_idx" ON "evolution_anomaly_flags"("severity", "resolvedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ab_experiments_experimentKey_key" ON "ab_experiments"("experimentKey");

-- CreateIndex
CREATE INDEX "ab_experiments_status_idx" ON "ab_experiments"("status");

-- CreateIndex
CREATE INDEX "ab_assignments_userId_experimentId_idx" ON "ab_assignments"("userId", "experimentId");

-- CreateIndex
CREATE UNIQUE INDEX "ab_assignments_experimentId_userId_key" ON "ab_assignments"("experimentId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "feature_flags_flagKey_key" ON "feature_flags"("flagKey");

-- CreateIndex
CREATE INDEX "feature_flags_enabled_idx" ON "feature_flags"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "system_config_configKey_key" ON "system_config"("configKey");

-- CreateIndex
CREATE INDEX "system_config_isEmergency_idx" ON "system_config"("isEmergency");

-- AddForeignKey
ALTER TABLE "invite_codes" ADD CONSTRAINT "invite_codes_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invite_codes" ADD CONSTRAINT "invite_codes_used_by_id_fkey" FOREIGN KEY ("used_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ip_accounts" ADD CONSTRAINT "ip_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "step_data" ADD CONSTRAINT "step_data_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "ip_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "histories" ADD CONSTRAINT "histories_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "ip_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topics" ADD CONSTRAINT "topics_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "ip_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "ip_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnosis_reports" ADD CONSTRAINT "diagnosis_reports_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "ip_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_logs" ADD CONSTRAINT "feedback_logs_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "ip_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_logs" ADD CONSTRAINT "feedback_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_logs" ADD CONSTRAINT "feedback_logs_history_id_fkey" FOREIGN KEY ("history_id") REFERENCES "histories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evolution_profiles" ADD CONSTRAINT "evolution_profiles_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "ip_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evolution_insights" ADD CONSTRAINT "evolution_insights_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "ip_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deep_learning_archives" ADD CONSTRAINT "deep_learning_archives_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "ip_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_favorites" ADD CONSTRAINT "knowledge_favorites_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "ip_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_favorites" ADD CONSTRAINT "knowledge_favorites_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "knowledge_notes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_notes" ADD CONSTRAINT "knowledge_notes_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "ip_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_log" ADD CONSTRAINT "cost_log_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "ip_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_log" ADD CONSTRAINT "cost_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_tasks" ADD CONSTRAINT "daily_tasks_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "ip_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_audit_log" ADD CONSTRAINT "admin_audit_log_approvalRequestId_fkey" FOREIGN KEY ("approvalRequestId") REFERENCES "approval_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompt_canary_config" ADD CONSTRAINT "prompt_canary_config_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "prompt_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompt_canary_config" ADD CONSTRAINT "prompt_canary_config_nextVersionId_fkey" FOREIGN KEY ("nextVersionId") REFERENCES "prompt_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quota_adjustment_log" ADD CONSTRAINT "quota_adjustment_log_userQuotaId_fkey" FOREIGN KEY ("userQuotaId") REFERENCES "user_quota"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

