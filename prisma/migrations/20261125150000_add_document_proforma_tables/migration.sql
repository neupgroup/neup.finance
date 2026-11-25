CREATE TABLE "documents_proformas" (
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
  "due_date" DATE NOT NULL,
  "details" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "documents_proformas_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "documents_proformas_adjustments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "proforma_id" UUID NOT NULL,
  "adjustment_name" VARCHAR NOT NULL,
  "adjustment_value" DECIMAL(18,2) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "documents_proformas_adjustments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "documents_proformas_items" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "proforma_id" UUID NOT NULL,
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
  CONSTRAINT "documents_proformas_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "documents_proformas_customer_id_date_idx" ON "documents_proformas"("customer_id", "date");
CREATE INDEX "documents_proformas_adjustments_proforma_id_idx" ON "documents_proformas_adjustments"("proforma_id");
CREATE INDEX "documents_proformas_items_proforma_id_sort_index_idx" ON "documents_proformas_items"("proforma_id", "sort_index");

ALTER TABLE "documents_proformas" ADD CONSTRAINT "documents_proformas_id_fkey"
  FOREIGN KEY ("id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "documents_proformas" ADD CONSTRAINT "documents_proformas_customer_id_fkey"
  FOREIGN KEY ("customer_id") REFERENCES "party"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "documents_proformas_adjustments" ADD CONSTRAINT "documents_proformas_adjustments_proforma_id_fkey"
  FOREIGN KEY ("proforma_id") REFERENCES "documents_proformas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "documents_proformas_items" ADD CONSTRAINT "documents_proformas_items_proforma_id_fkey"
  FOREIGN KEY ("proforma_id") REFERENCES "documents_proformas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
