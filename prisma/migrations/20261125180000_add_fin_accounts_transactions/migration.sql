CREATE TABLE "fin_accounts_transactions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "title" TEXT NOT NULL,
  "description" TEXT,
  "fin_account_id" TEXT NOT NULL,
  "currency" TEXT NOT NULL,
  "amount" DECIMAL(18,2) NOT NULL,
  "direction" TEXT NOT NULL,
  "details" JSONB,
  "activity_on" DATE NOT NULL,
  CONSTRAINT "fin_accounts_transactions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "fin_accounts_transactions_direction_check" CHECK ("direction" IN ('in', 'out')),
  CONSTRAINT "fin_accounts_transactions_fin_account_id_fkey"
    FOREIGN KEY ("fin_account_id") REFERENCES "fin_book"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "fin_accounts_transactions_fin_account_id_activity_on_idx"
  ON "fin_accounts_transactions"("fin_account_id", "activity_on");
