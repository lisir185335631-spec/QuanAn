-- DropIndex
DROP INDEX "knowledge_chunk_embedding_hnsw";

-- CreateTable
CREATE TABLE "admin_users" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "role" VARCHAR(32) NOT NULL,
    "isMock" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_sessions" (
    "id" TEXT NOT NULL,
    "adminUserId" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "mfaVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_invite_campaign" (
    "id" SERIAL NOT NULL,
    "campaignKey" VARCHAR(64) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "createdByAdminId" INTEGER NOT NULL,
    "totalQuota" INTEGER NOT NULL DEFAULT 0,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_invite_campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_constants" (
    "id" SERIAL NOT NULL,
    "key" VARCHAR(128) NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "updatedByAdminId" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_constants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_config" (
    "id" SERIAL NOT NULL,
    "configKey" VARCHAR(128) NOT NULL,
    "configValue" JSONB NOT NULL,
    "description" TEXT,
    "isEmergency" BOOLEAN NOT NULL DEFAULT false,
    "updatedByAdminId" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_ab_experiment" (
    "id" SERIAL NOT NULL,
    "experimentKey" VARCHAR(128) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "variantConfig" JSONB NOT NULL,
    "trafficAllocation" JSONB NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "stoppedAt" TIMESTAMP(3),
    "resultSummary" JSONB,
    "createdByAdminId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_ab_experiment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE INDEX "admin_users_email_idx" ON "admin_users"("email");

-- CreateIndex
CREATE INDEX "admin_sessions_adminUserId_expiresAt_idx" ON "admin_sessions"("adminUserId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "admin_invite_campaign_campaignKey_key" ON "admin_invite_campaign"("campaignKey");

-- CreateIndex
CREATE INDEX "admin_invite_campaign_status_startsAt_idx" ON "admin_invite_campaign"("status", "startsAt");

-- CreateIndex
CREATE INDEX "admin_invite_campaign_createdByAdminId_idx" ON "admin_invite_campaign"("createdByAdminId");

-- CreateIndex
CREATE UNIQUE INDEX "admin_constants_key_key" ON "admin_constants"("key");

-- CreateIndex
CREATE INDEX "admin_constants_key_idx" ON "admin_constants"("key");

-- CreateIndex
CREATE UNIQUE INDEX "admin_config_configKey_key" ON "admin_config"("configKey");

-- CreateIndex
CREATE INDEX "admin_config_isEmergency_idx" ON "admin_config"("isEmergency");

-- CreateIndex
CREATE UNIQUE INDEX "admin_ab_experiment_experimentKey_key" ON "admin_ab_experiment"("experimentKey");

-- CreateIndex
CREATE INDEX "admin_ab_experiment_status_idx" ON "admin_ab_experiment"("status");

-- AddForeignKey
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
