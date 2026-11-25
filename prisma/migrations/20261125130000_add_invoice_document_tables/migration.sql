CREATE TABLE "documents_invoices" (
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
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "documents_invoices_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "documents_invoices_adjustments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "invoice_id" UUID NOT NULL,
  "adjustment_name" VARCHAR NOT NULL,
  "adjustment_value" DECIMAL(18,2) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "documents_invoices_adjustments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "documents_invoices_items" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "invoice_id" UUID NOT NULL,
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
  CONSTRAINT "documents_invoices_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "documents_invoices_customer_id_date_idx" ON "documents_invoices"("customer_id", "date");
CREATE INDEX "documents_invoices_adjustments_invoice_id_idx" ON "documents_invoices_adjustments"("invoice_id");
CREATE INDEX "documents_invoices_items_invoice_id_sort_index_idx" ON "documents_invoices_items"("invoice_id", "sort_index");

ALTER TABLE "documents_invoices" ADD CONSTRAINT "documents_invoices_id_fkey"
  FOREIGN KEY ("id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "documents_invoices" ADD CONSTRAINT "documents_invoices_customer_id_fkey"
  FOREIGN KEY ("customer_id") REFERENCES "party"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "documents_invoices_adjustments" ADD CONSTRAINT "documents_invoices_adjustments_invoice_id_fkey"
  FOREIGN KEY ("invoice_id") REFERENCES "documents_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "documents_invoices_items" ADD CONSTRAINT "documents_invoices_items_invoice_id_fkey"
  FOREIGN KEY ("invoice_id") REFERENCES "documents_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
