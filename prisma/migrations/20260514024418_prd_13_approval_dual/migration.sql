-- AlterTable
ALTER TABLE "approval_requests" ADD COLUMN     "emergencyIncidentId" TEXT,
ADD COLUMN     "emergencyMode" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "postReviewRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "postReviewResult" TEXT,
ADD COLUMN     "postReviewedAt" TIMESTAMP(3),
ADD COLUMN     "postReviewerAdminId" INTEGER,
ADD COLUMN     "secondApprovedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "approval_requests_requireDualApproval_status_idx" ON "approval_requests"("requireDualApproval", "status");

-- CreateIndex
CREATE INDEX "approval_requests_emergencyMode_postReviewRequired_idx" ON "approval_requests"("emergencyMode", "postReviewRequired");

-- CreateIndex
CREATE INDEX "approval_requests_postReviewRequired_postReviewedAt_idx" ON "approval_requests"("postReviewRequired", "postReviewedAt");
