ALTER TABLE "fin_accounts_transactions"
  ADD COLUMN "party_id" UUID,
  ALTER COLUMN "activity_on" TYPE TIMESTAMPTZ(3)
    USING "activity_on"::TIMESTAMP AT TIME ZONE 'UTC';

CREATE INDEX "fin_accounts_transactions_party_id_idx"
  ON "fin_accounts_transactions"("party_id");

ALTER TABLE "fin_accounts_transactions"
  ADD CONSTRAINT "fin_accounts_transactions_party_id_fkey"
    FOREIGN KEY ("party_id") REFERENCES "party"("id") ON DELETE SET NULL ON UPDATE CASCADE;
