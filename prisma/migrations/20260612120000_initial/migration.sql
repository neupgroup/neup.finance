-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('Bank', 'Cash', 'Investment', 'Other');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('unpaid', 'partially_paid', 'paid', 'canceled');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('sale', 'purchase', 'refund', 'expense', 'payroll', 'income', 'other');

-- CreateEnum
CREATE TYPE "ProjectionType" AS ENUM ('Income', 'Expense');

-- CreateEnum
CREATE TYPE "ProjectionCertainty" AS ENUM ('Fixed', 'Probable', 'Possible');

-- CreateEnum
CREATE TYPE "ProjectionStatus" AS ENUM ('Active', 'Canceled');

-- CreateEnum
CREATE TYPE "ProjectionRecurrence" AS ENUM ('Once', 'Daily', 'Weekly', 'Monthly', 'Yearly', 'Custom');

-- CreateEnum
CREATE TYPE "TransactionLineCategory" AS ENUM ('vat_paid', 'vat_return', 'sales', 'referral_paid', 'payable', 'receivable');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL DEFAULT '',
    "neupid" TEXT NOT NULL DEFAULT '',
    "displayImage" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledgers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AccountType" NOT NULL,
    "balance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledgers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "accountId" TEXT NOT NULL,
    "ledgerId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "transaction_type" "TransactionType" NOT NULL,
    "total_amount" DECIMAL(65,30) NOT NULL,
    "total_paid" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "balance_due" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" "TransactionStatus" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "currency" TEXT NOT NULL,
    "recipient" TEXT,
    "due_on" TIMESTAMP(3),
    "reference_document" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionLine" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "line_title" TEXT NOT NULL,
    "description" TEXT,
    "category" "TransactionLineCategory" NOT NULL,
    "account" TEXT NOT NULL,
    "debit" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "credit" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL,

    CONSTRAINT "TransactionLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Projection" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "ProjectionType" NOT NULL,
    "certainty" "ProjectionCertainty" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ProjectionStatus" NOT NULL,
    "recipient" TEXT,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrence" "ProjectionRecurrence" NOT NULL,
    "endsOn" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Projection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_connection_id_key" ON "accounts"("connection_id");

-- CreateIndex
CREATE INDEX "ledgers_accountId_idx" ON "ledgers"("accountId");

-- CreateIndex
CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");

-- CreateIndex
CREATE INDEX "Transaction_ledgerId_idx" ON "Transaction"("ledgerId");

-- CreateIndex
CREATE INDEX "Transaction_date_idx" ON "Transaction"("date");

-- CreateIndex
CREATE INDEX "TransactionLine_transactionId_idx" ON "TransactionLine"("transactionId");

-- CreateIndex
CREATE INDEX "Projection_userId_idx" ON "Projection"("userId");

-- AddForeignKey
ALTER TABLE "ledgers" ADD CONSTRAINT "ledgers_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "ledgers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionLine" ADD CONSTRAINT "TransactionLine_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Projection" ADD CONSTRAINT "Projection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
