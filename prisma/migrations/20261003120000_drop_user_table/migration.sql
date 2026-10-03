-- Remove dependencies on the User table while preserving external user IDs.
ALTER TABLE "transaction" DROP CONSTRAINT IF EXISTS "transaction_created_by_fkey";
ALTER TABLE "Projection" DROP CONSTRAINT IF EXISTS "Projection_userId_fkey";

DROP TABLE IF EXISTS "User" CASCADE;
