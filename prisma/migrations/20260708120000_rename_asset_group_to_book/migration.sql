-- RenameTable
ALTER TABLE "asset_group" RENAME TO "book";

-- RenameIndex
ALTER INDEX "asset_group_accountId_idx" RENAME TO "book_accountId_idx";

-- RenameForeignKey
ALTER TABLE "book" RENAME CONSTRAINT "asset_group_accountId_fkey" TO "book_accountId_fkey";
