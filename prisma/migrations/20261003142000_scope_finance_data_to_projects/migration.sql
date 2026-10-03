ALTER TABLE "party" ADD COLUMN "projectId" TEXT;
ALTER TABLE "fin_book" ADD COLUMN "projectId" TEXT;
ALTER TABLE "fin_account" ADD COLUMN "projectId" TEXT;
ALTER TABLE "transaction" ADD COLUMN "projectId" TEXT;
ALTER TABLE "Projection" ADD COLUMN "projectId" TEXT;

CREATE INDEX "party_projectId_idx" ON "party"("projectId");
CREATE INDEX "fin_book_projectId_idx" ON "fin_book"("projectId");
CREATE INDEX "fin_account_projectId_idx" ON "fin_account"("projectId");
CREATE INDEX "transaction_projectId_idx" ON "transaction"("projectId");
CREATE INDEX "Projection_projectId_idx" ON "Projection"("projectId");

ALTER TABLE "party" ADD CONSTRAINT "party_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "fin_book" ADD CONSTRAINT "fin_book_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "fin_account" ADD CONSTRAINT "fin_account_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Projection" ADD CONSTRAINT "Projection_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "roles" ("id", "name", "description", "permissions")
VALUES ('00000000-0000-4000-8000-000000000001', 'Owner', 'Full project access', '["*"]'::jsonb)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "projects" ("id", "name", "status")
SELECT md5(a."id" || ':finance-default-project')::uuid::text,
       COALESCE(NULLIF(a."displayName", ''), 'My') || ' Project',
       'active'
FROM "accounts" a
WHERE NOT EXISTS (SELECT 1 FROM "access" x WHERE x."accountId" = a."id")
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "access" ("id", "accountId", "roleId", "projectId", "status", "permittedOn")
SELECT md5(a."id" || ':finance-owner-access')::uuid::text, a."id", '00000000-0000-4000-8000-000000000001',
       md5(a."id" || ':finance-default-project')::uuid::text, 'active', CURRENT_TIMESTAMP
FROM "accounts" a
WHERE NOT EXISTS (SELECT 1 FROM "access" x WHERE x."accountId" = a."id")
ON CONFLICT ("id") DO NOTHING;

UPDATE "party" p SET "projectId" = (
  SELECT x."projectId" FROM "access" x WHERE x."accountId" = p."account_id" ORDER BY x."permittedOn", x."id" LIMIT 1
) WHERE p."projectId" IS NULL;
UPDATE "fin_book" b SET "projectId" = (
  SELECT x."projectId" FROM "access" x WHERE x."accountId" = b."accountId" ORDER BY x."permittedOn", x."id" LIMIT 1
) WHERE b."projectId" IS NULL;
UPDATE "fin_account" f SET "projectId" = (
  SELECT x."projectId" FROM "access" x WHERE x."accountId" = f."profile_id" ORDER BY x."permittedOn", x."id" LIMIT 1
) WHERE f."projectId" IS NULL;
UPDATE "transaction" t SET "projectId" = (
  SELECT x."projectId" FROM "access" x WHERE x."accountId" = t."organization_id" ORDER BY x."permittedOn", x."id" LIMIT 1
) WHERE t."projectId" IS NULL;
UPDATE "Projection" p SET "projectId" = (
  SELECT x."projectId" FROM "access" x WHERE x."accountId" = p."userId" ORDER BY x."permittedOn", x."id" LIMIT 1
) WHERE p."projectId" IS NULL;

ALTER TABLE "party" ALTER COLUMN "projectId" SET NOT NULL;
ALTER TABLE "fin_book" ALTER COLUMN "projectId" SET NOT NULL;
ALTER TABLE "fin_account" ALTER COLUMN "projectId" SET NOT NULL;
ALTER TABLE "transaction" ALTER COLUMN "projectId" SET NOT NULL;
ALTER TABLE "Projection" ALTER COLUMN "projectId" SET NOT NULL;
