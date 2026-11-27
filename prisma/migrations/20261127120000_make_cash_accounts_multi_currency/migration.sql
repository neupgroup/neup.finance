ALTER TABLE "fin_book"
ALTER COLUMN "currency" DROP NOT NULL;

UPDATE "fin_book"
SET "currency" = 'ALL'
WHERE "type" = 'Cash' AND "currency" IS NULL;
