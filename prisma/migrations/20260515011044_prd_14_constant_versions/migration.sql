-- CreateTable
CREATE TABLE "constant_versions" (
    "id" SERIAL NOT NULL,
    "constantType" VARCHAR(32) NOT NULL,
    "constantKey" VARCHAR(255) NOT NULL,
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

    CONSTRAINT "constant_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "constant_canary_config" (
    "id" SERIAL NOT NULL,
    "constantType" VARCHAR(32) NOT NULL,
    "constantKey" VARCHAR(255) NOT NULL,
    "currentVersionId" INTEGER NOT NULL,
    "nextVersionId" INTEGER,
    "canaryPct" INTEGER NOT NULL DEFAULT 0,
    "strategy" TEXT NOT NULL DEFAULT 'user_id_hash',
    "canaryStartedAt" TIMESTAMP(3),
    "canaryEndsAt" TIMESTAMP(3),
    "updatedByAdminId" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "constant_canary_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "constant_versions_constantType_constantKey_status_idx" ON "constant_versions"("constantType", "constantKey", "status");

-- CreateIndex
CREATE INDEX "constant_versions_status_createdAt_idx" ON "constant_versions"("status", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "constant_versions_constantType_constantKey_version_key" ON "constant_versions"("constantType", "constantKey", "version");

-- CreateIndex
CREATE UNIQUE INDEX "constant_canary_config_constantType_constantKey_key" ON "constant_canary_config"("constantType", "constantKey");

-- AddForeignKey
ALTER TABLE "constant_canary_config" ADD CONSTRAINT "constant_canary_config_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "constant_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "constant_canary_config" ADD CONSTRAINT "constant_canary_config_nextVersionId_fkey" FOREIGN KEY ("nextVersionId") REFERENCES "constant_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
