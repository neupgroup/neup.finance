DROP TABLE IF EXISTS "TransactionLine";
DROP TABLE IF EXISTS "Transaction";

CREATE TABLE "transaction" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "transaction_type_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "transaction_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "reference_number" TEXT,
    "external_reference" TEXT,
    "currency" TEXT NOT NULL,
    "final_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tags" JSONB,
    "notes" JSONB,
    "details" JSONB,

    CONSTRAINT "transaction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "transaction_line" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "line_type_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "reference_type" TEXT,
    "reference_id" TEXT,
    "currency" TEXT NOT NULL,
    "base_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "fin_book" TEXT,
    "fin_account" TEXT,
    "tags" JSONB,
    "details" JSONB,

    CONSTRAINT "transaction_line_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "transaction_organization_id_idx" ON "transaction"("organization_id");
CREATE INDEX "transaction_created_by_idx" ON "transaction"("created_by");
CREATE INDEX "transaction_transaction_date_idx" ON "transaction"("transaction_date");

CREATE INDEX "transaction_line_transaction_id_idx" ON "transaction_line"("transaction_id");
CREATE INDEX "transaction_line_reference_type_reference_id_idx" ON "transaction_line"("reference_type", "reference_id");
CREATE INDEX "transaction_line_fin_book_idx" ON "transaction_line"("fin_book");

ALTER TABLE "transaction"
    ADD CONSTRAINT "transaction_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "accounts"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "transaction"
    ADD CONSTRAINT "transaction_created_by_fkey"
    FOREIGN KEY ("created_by") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "transaction_line"
    ADD CONSTRAINT "transaction_line_transaction_id_fkey"
    FOREIGN KEY ("transaction_id") REFERENCES "transaction"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "transaction_line"
    ADD CONSTRAINT "transaction_line_fin_book_fkey"
    FOREIGN KEY ("fin_book") REFERENCES "book"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
