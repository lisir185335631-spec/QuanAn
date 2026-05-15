-- CreateTable
CREATE TABLE "trending_favorites" (
    "id" SERIAL NOT NULL,
    "account_id" INTEGER NOT NULL,
    "trending_item_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trending_favorites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trending_favorites_account_id_idx" ON "trending_favorites"("account_id");

-- CreateIndex
CREATE INDEX "trending_favorites_account_id_created_at_idx" ON "trending_favorites"("account_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "trending_favorites_account_id_trending_item_id_key" ON "trending_favorites"("account_id", "trending_item_id");

-- AddForeignKey
ALTER TABLE "trending_favorites" ADD CONSTRAINT "trending_favorites_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "ip_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
