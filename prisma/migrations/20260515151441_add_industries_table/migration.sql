-- CreateTable
CREATE TABLE "industries" (
    "id" SERIAL NOT NULL,
    "key" VARCHAR(64) NOT NULL,
    "label" VARCHAR(64) NOT NULL,
    "category" VARCHAR(32) NOT NULL,
    "emoji" VARCHAR(8) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "industries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "industries_key_key" ON "industries"("key");

-- CreateIndex
CREATE INDEX "industries_category_idx" ON "industries"("category");

-- CreateIndex
CREATE INDEX "industries_order_idx" ON "industries"("order");
