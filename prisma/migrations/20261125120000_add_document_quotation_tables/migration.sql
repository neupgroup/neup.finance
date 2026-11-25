-- The document project and customer references use native PostgreSQL UUIDs.
-- Convert the existing UUID-valued text keys before adding those references.
ALTER TABLE "access" DROP CONSTRAINT "access_projectId_fkey";
ALTER TABLE "party" DROP CONSTRAINT "party_projectId_fkey";
ALTER TABLE "fin_book" DROP CONSTRAINT "fin_book_projectId_fkey";
ALTER TABLE "fin_account" DROP CONSTRAINT "fin_account_projectId_fkey";
ALTER TABLE "transaction" DROP CONSTRAINT "transaction_projectId_fkey";
ALTER TABLE "Projection" DROP CONSTRAINT "Projection_projectId_fkey";
ALTER TABLE "party_contact" DROP CONSTRAINT "party_contact_party_id_fkey";
ALTER TABLE "party_payment_method" DROP CONSTRAINT "party_payment_method_party_id_fkey";

ALTER TABLE "projects" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "projects" ALTER COLUMN "id" TYPE UUID USING "id"::uuid;
ALTER TABLE "projects" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "access" ALTER COLUMN "projectId" TYPE UUID USING "projectId"::uuid;
ALTER TABLE "party" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "party" ALTER COLUMN "id" TYPE UUID USING "id"::uuid;
ALTER TABLE "party" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "party" ALTER COLUMN "projectId" TYPE UUID USING "projectId"::uuid;
ALTER TABLE "party_contact" ALTER COLUMN "party_id" TYPE UUID USING "party_id"::uuid;
ALTER TABLE "party_payment_method" ALTER COLUMN "party_id" TYPE UUID USING "party_id"::uuid;
ALTER TABLE "fin_book" ALTER COLUMN "projectId" TYPE UUID USING "projectId"::uuid;
ALTER TABLE "fin_account" ALTER COLUMN "projectId" TYPE UUID USING "projectId"::uuid;
ALTER TABLE "transaction" ALTER COLUMN "projectId" TYPE UUID USING "projectId"::uuid;
ALTER TABLE "Projection" ALTER COLUMN "projectId" TYPE UUID USING "projectId"::uuid;

ALTER TABLE "access" ADD CONSTRAINT "access_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "party" ADD CONSTRAINT "party_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "fin_book" ADD CONSTRAINT "fin_book_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "fin_account" ADD CONSTRAINT "fin_account_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Projection" ADD CONSTRAINT "Projection_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "party_contact" ADD CONSTRAINT "party_contact_party_id_fkey"
  FOREIGN KEY ("party_id") REFERENCES "party"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "party_payment_method" ADD CONSTRAINT "party_payment_method_party_id_fkey"
  FOREIGN KEY ("party_id") REFERENCES "party"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "documents" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "project_id" UUID NOT NULL,
  "type" VARCHAR NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "documents_quotations" (
  "id" UUID NOT NULL,
  "customer_id" UUID NOT NULL,
  "counter" INTEGER NOT NULL,
  "reference_number" VARCHAR NOT NULL,
  "subject" VARCHAR NOT NULL,
  "currency" VARCHAR NOT NULL,
  "exchange_rate" DECIMAL(18,6) NOT NULL,
  "subtotal" DECIMAL(18,2) NOT NULL,
  "discount_type" VARCHAR NOT NULL,
  "discount_value" DECIMAL(18,2) NOT NULL,
  "discount_amount" DECIMAL(18,2) NOT NULL,
  "tax_total" DECIMAL(18,2) NOT NULL,
  "has_adjustments" BOOLEAN NOT NULL DEFAULT false,
  "total" DECIMAL(18,2) NOT NULL,
  "status" VARCHAR NOT NULL,
  "date" DATE NOT NULL,
  "expires" DATE NOT NULL,
  "details" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "documents_quotations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "documents_quotations_adjustments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "quotation_id" UUID NOT NULL,
  "adjustment_name" VARCHAR NOT NULL,
  "adjustment_value" DECIMAL(18,2) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "documents_quotations_adjustments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "documents_adjustments_items" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "quotation_id" UUID NOT NULL,
  "product_id" UUID,
  "name" VARCHAR NOT NULL,
  "description" VARCHAR(128),
  "quantity" DECIMAL(18,2) NOT NULL,
  "unit" VARCHAR NOT NULL,
  "rate" DECIMAL(18,2) NOT NULL,
  "discount_type" VARCHAR NOT NULL,
  "discount_value" DECIMAL(18,2) NOT NULL,
  "discount_amount" DECIMAL(18,2) NOT NULL,
  "tax_rate" DECIMAL(8,4) NOT NULL,
  "tax_amount" DECIMAL(18,2) NOT NULL,
  "amount" DECIMAL(18,2) NOT NULL,
  "sort_index" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "documents_adjustments_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "documents_project_id_type_idx" ON "documents"("project_id", "type");
CREATE INDEX "documents_quotations_customer_id_date_idx" ON "documents_quotations"("customer_id", "date");
CREATE INDEX "documents_quotations_adjustments_quotation_id_idx" ON "documents_quotations_adjustments"("quotation_id");
CREATE INDEX "documents_adjustments_items_quotation_id_sort_index_idx" ON "documents_adjustments_items"("quotation_id", "sort_index");

ALTER TABLE "documents" ADD CONSTRAINT "documents_project_id_fkey"
  FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "documents_quotations" ADD CONSTRAINT "documents_quotations_id_fkey"
  FOREIGN KEY ("id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "documents_quotations" ADD CONSTRAINT "documents_quotations_customer_id_fkey"
  FOREIGN KEY ("customer_id") REFERENCES "party"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "documents_quotations_adjustments" ADD CONSTRAINT "documents_quotations_adjustments_quotation_id_fkey"
  FOREIGN KEY ("quotation_id") REFERENCES "documents_quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "documents_adjustments_items" ADD CONSTRAINT "documents_adjustments_items_quotation_id_fkey"
  FOREIGN KEY ("quotation_id") REFERENCES "documents_quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
