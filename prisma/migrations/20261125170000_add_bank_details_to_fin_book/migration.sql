ALTER TABLE "fin_book"
ADD COLUMN "bank_name" TEXT,
ADD COLUMN "branch" TEXT,
ADD COLUMN "account_type" TEXT;

ALTER TABLE "fin_book"
ADD CONSTRAINT "fin_book_type_bank_or_cash_check"
CHECK ("type" IN ('Bank', 'Cash')) NOT VALID;
