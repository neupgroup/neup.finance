-- AlterEnum
ALTER TYPE "AccountType" ADD VALUE IF NOT EXISTS 'Stock';

-- CreateEnum
CREATE TYPE "ActivityStockType" AS ENUM ('purchase_in', 'sale_out', 'transfer_in', 'transfer_out', 'dividend_in', 'calculation');

-- CreateTable
CREATE TABLE "activity_stock" (
    "id" TEXT NOT NULL,
    "asset_group_id" TEXT NOT NULL,
    "stock_name" TEXT NOT NULL,
    "activity_type" "ActivityStockType" NOT NULL,
    "balance" DECIMAL(65,30) NOT NULL,
    "recorded_on" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_stock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activity_stock_asset_group_id_idx" ON "activity_stock"("asset_group_id");

-- CreateIndex
CREATE INDEX "activity_stock_recorded_on_idx" ON "activity_stock"("recorded_on");

-- AddForeignKey
ALTER TABLE "activity_stock" ADD CONSTRAINT "activity_stock_asset_group_id_fkey" FOREIGN KEY ("asset_group_id") REFERENCES "asset_group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
