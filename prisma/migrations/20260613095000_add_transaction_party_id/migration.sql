-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN "party_id" TEXT;

-- CreateIndex
CREATE INDEX "Transaction_party_id_idx" ON "Transaction"("party_id");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_party_id_fkey" FOREIGN KEY ("party_id") REFERENCES "party"("id") ON DELETE SET NULL ON UPDATE CASCADE;
