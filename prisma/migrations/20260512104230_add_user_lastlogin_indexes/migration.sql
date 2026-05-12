-- AlterTable
ALTER TABLE "users" ADD COLUMN     "last_login_at" TIMESTAMP(3),
ADD COLUMN     "last_login_ip" VARCHAR(45),
ADD COLUMN     "plan" VARCHAR(32) NOT NULL DEFAULT 'free';

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_plan_idx" ON "users"("plan");

-- CreateIndex
CREATE INDEX "users_industry_idx" ON "users"("industry");

-- CreateIndex
CREATE INDEX "users_last_login_at_idx" ON "users"("last_login_at" DESC);
