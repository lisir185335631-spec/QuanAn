-- CreateTable
CREATE TABLE "evaluation_runs" (
    "id" SERIAL NOT NULL,
    "runId" VARCHAR(36) NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3),
    "totalSamples" INTEGER NOT NULL,
    "passedSamples" INTEGER NOT NULL,
    "failedSamples" INTEGER NOT NULL,
    "skippedSamples" INTEGER NOT NULL,
    "avgScore" DECIMAL(3,2),
    "modelTier" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "totalTokens" INTEGER NOT NULL,
    "totalCostUsd" DECIMAL(8,4) NOT NULL,
    "status" TEXT NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "evaluation_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_samples" (
    "id" SERIAL NOT NULL,
    "runId" VARCHAR(36) NOT NULL,
    "goldenId" VARCHAR(20) NOT NULL,
    "specialistId" TEXT NOT NULL,
    "mode" TEXT,
    "input" JSONB NOT NULL,
    "actualOutput" JSONB NOT NULL,
    "judgeScore" SMALLINT NOT NULL,
    "judgePass" BOOLEAN NOT NULL,
    "judgeReason" TEXT NOT NULL,
    "structurePass" BOOLEAN NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "tokensUsed" INTEGER NOT NULL,
    "costUsd" DECIMAL(8,6) NOT NULL,
    "humanScore" SMALLINT,
    "humanScoreBy" TEXT,
    "humanScoredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evaluation_samples_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "evaluation_runs_runId_key" ON "evaluation_runs"("runId");

-- CreateIndex
CREATE INDEX "evaluation_runs_startedAt_idx" ON "evaluation_runs"("startedAt" DESC);

-- CreateIndex
CREATE INDEX "evaluation_samples_runId_idx" ON "evaluation_samples"("runId");

-- CreateIndex
CREATE INDEX "evaluation_samples_specialistId_idx" ON "evaluation_samples"("specialistId");

-- CreateIndex
CREATE INDEX "evaluation_samples_createdAt_idx" ON "evaluation_samples"("createdAt" DESC);

-- AddForeignKey
ALTER TABLE "evaluation_samples" ADD CONSTRAINT "evaluation_samples_runId_fkey" FOREIGN KEY ("runId") REFERENCES "evaluation_runs"("runId") ON DELETE CASCADE ON UPDATE CASCADE;
