-- CreateTable
CREATE TABLE "party" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "taxinfo" JSONB,

    CONSTRAINT "party_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "party_contact" (
    "id" TEXT NOT NULL,
    "party_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "added_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "details" JSONB,

    CONSTRAINT "party_contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "party_payment_method" (
    "id" TEXT NOT NULL,
    "party_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "added_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "details" JSONB,

    CONSTRAINT "party_payment_method_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "party_account_id_idx" ON "party"("account_id");

-- CreateIndex
CREATE INDEX "party_contact_party_id_idx" ON "party_contact"("party_id");

-- CreateIndex
CREATE INDEX "party_payment_method_party_id_idx" ON "party_payment_method"("party_id");

-- AddForeignKey
ALTER TABLE "party" ADD CONSTRAINT "party_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_contact" ADD CONSTRAINT "party_contact_party_id_fkey" FOREIGN KEY ("party_id") REFERENCES "party"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_payment_method" ADD CONSTRAINT "party_payment_method_party_id_fkey" FOREIGN KEY ("party_id") REFERENCES "party"("id") ON DELETE CASCADE ON UPDATE CASCADE;
