CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "permissions" JSONB NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "access" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "permittedOn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "access_accountId_idx" ON "access"("accountId");
CREATE INDEX "access_roleId_idx" ON "access"("roleId");
CREATE INDEX "access_projectId_idx" ON "access"("projectId");
CREATE UNIQUE INDEX "access_accountId_roleId_projectId_key" ON "access"("accountId", "roleId", "projectId");

ALTER TABLE "access" ADD CONSTRAINT "access_accountId_fkey"
    FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "access" ADD CONSTRAINT "access_roleId_fkey"
    FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "access" ADD CONSTRAINT "access_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
