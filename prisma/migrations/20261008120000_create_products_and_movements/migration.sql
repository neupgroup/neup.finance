CREATE TYPE "ProductType" AS ENUM ('goods', 'services');
CREATE TYPE "MovementType" AS ENUM ('incoming', 'outgoing', 'balancing');

CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" "ProductType" NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tax" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "moreDetails" JSONB,
    "createdOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "movements" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" "MovementType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "by" VARCHAR(12) NOT NULL,
    "referenceId" VARCHAR(128) NOT NULL,
    "on" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "movements_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "products_projectId_idx" ON "products"("projectId");
CREATE INDEX "movements_productId_idx" ON "movements"("productId");
CREATE INDEX "movements_on_idx" ON "movements"("on");

ALTER TABLE "products" ADD CONSTRAINT "products_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "movements" ADD CONSTRAINT "movements_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
