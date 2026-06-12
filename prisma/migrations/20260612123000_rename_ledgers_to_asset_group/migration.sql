-- RenameTable
ALTER TABLE "ledgers" RENAME TO "asset_group";

-- RenameColumn
ALTER TABLE "Transaction" RENAME COLUMN "ledgerId" TO "assetGroupId";

-- RenameIndex
ALTER INDEX "ledgers_accountId_idx" RENAME TO "asset_group_accountId_idx";

-- RenameIndex
ALTER INDEX "Transaction_ledgerId_idx" RENAME TO "Transaction_assetGroupId_idx";

-- RenameForeignKey
ALTER TABLE "asset_group" RENAME CONSTRAINT "ledgers_accountId_fkey" TO "asset_group_accountId_fkey";

-- RenameForeignKey
ALTER TABLE "Transaction" RENAME CONSTRAINT "Transaction_ledgerId_fkey" TO "Transaction_assetGroupId_fkey";
