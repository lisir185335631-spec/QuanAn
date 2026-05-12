-- AlterTable
ALTER TABLE "ip_accounts" ADD COLUMN     "freeze_reason" VARCHAR(500),
ADD COLUMN     "frozen_at" TIMESTAMP(3),
ADD COLUMN     "frozen_by_admin_id" INTEGER;

-- AddForeignKey
ALTER TABLE "ip_account_admin_notes" ADD CONSTRAINT "ip_account_admin_notes_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "ip_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ip_account_anomaly_flags" ADD CONSTRAINT "ip_account_anomaly_flags_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "ip_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
