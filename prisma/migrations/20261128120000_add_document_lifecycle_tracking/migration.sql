CREATE TABLE "documents_relationships" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "source_document_id" UUID NOT NULL,
  "target_document_id" UUID NOT NULL,
  "type" VARCHAR NOT NULL,
  "created_by" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "documents_relationships_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "documents_events" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "document_id" UUID NOT NULL,
  "type" VARCHAR NOT NULL,
  "performed_by" UUID NOT NULL,
  "data" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "documents_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "documents_relationships_source_document_id_idx"
  ON "documents_relationships"("source_document_id");
CREATE INDEX "documents_relationships_target_document_id_idx"
  ON "documents_relationships"("target_document_id");
CREATE INDEX "documents_events_document_id_created_at_idx"
  ON "documents_events"("document_id", "created_at");

ALTER TABLE "documents_relationships"
  ADD CONSTRAINT "documents_relationships_source_document_id_fkey"
  FOREIGN KEY ("source_document_id") REFERENCES "documents"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "documents_relationships"
  ADD CONSTRAINT "documents_relationships_target_document_id_fkey"
  FOREIGN KEY ("target_document_id") REFERENCES "documents"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "documents_events"
  ADD CONSTRAINT "documents_events_document_id_fkey"
  FOREIGN KEY ("document_id") REFERENCES "documents"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
