CREATE TYPE "FinAccountTransactionStatus" AS ENUM ('draft', 'active', 'reviewRequired');

ALTER TABLE "fin_accounts_transactions"
ADD COLUMN "status" "FinAccountTransactionStatus" NOT NULL DEFAULT 'active';
