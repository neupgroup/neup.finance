import { Prisma } from '@prisma/client';
import { prisma } from '@/server/db';
import {
  buildTransactionCompatibilityDetails,
  computeTransactionFinalAmount,
  normalizeTransactionLines,
  serializeTransactionRecord,
  type TransactionPayload,
} from '@/services/transactions/records';

/*
::neup.documentation::transaction-create-service
::title Transaction Create Service

Creates organization-scoped transactions and their line rows through one shared
service used by single-create and import API routes.

::end
*/

export type TransactionOwner = {
  id: string;
  displayName: string;
  projectId: string;
};

export type TransactionCreateResult = ReturnType<typeof serializeTransactionRecord>;

export function validateTransactionPayload(payload: TransactionPayload) {
  const title = typeof payload.title === 'string' ? payload.title.trim() : '';
  const transactionTypeId = String(payload.transaction_type_id ?? payload.transaction_type ?? '').trim();
  const transactionDate = String(payload.transaction_date ?? payload.date ?? '').trim();
  const status = typeof payload.status === 'string' ? payload.status.trim() : '';
  const currency = typeof payload.currency === 'string' ? payload.currency.trim().toUpperCase() : '';
  return {
    title,
    transactionTypeId,
    transactionDate,
    status,
    currency,
    isValid: Boolean(title && transactionTypeId && transactionDate && status && currency),
  };
}

export async function getPartyMapForTransactions(projectId: string, transactions: Array<{ details: unknown }>) {
  const partyIds = Array.from(new Set(
    transactions
      .map((transaction) => {
        const details = transaction.details;
        if (!details || typeof details !== 'object' || Array.isArray(details)) {
          return null;
        }

        const partyId = (details as Record<string, unknown>).partyId;
        return typeof partyId === 'string' && partyId ? partyId : null;
      })
      .filter((partyId): partyId is string => Boolean(partyId))
  ));

  if (partyIds.length === 0) {
    return new Map<string, { id: string; name: string; type: string }>();
  }

  const parties = await prisma.party.findMany({
    where: { id: { in: partyIds }, projectId },
    select: { id: true, name: true, type: true },
  });

  return new Map(parties.map((party) => [party.id, party]));
}

export async function createTransactionForOwner(owner: TransactionOwner, payload: TransactionPayload) {
  const validation = validateTransactionPayload(payload);
  if (!validation.isValid) {
    throw new Error('Invalid payload');
  }

  const normalizedLines = normalizeTransactionLines(payload, validation.currency);
  const bookIds = [...new Set(normalizedLines.map((line) => line.finBook).filter((id): id is string => Boolean(id)))];
  if (bookIds.length > 0) {
    const count = await prisma.assetGroup.count({ where: { id: { in: bookIds }, projectId: owner.projectId } });
    if (count !== bookIds.length) throw new Error('A book is outside the current project');
  }
  if (payload.partyId) {
    const party = await prisma.party.findFirst({ where: { id: payload.partyId, projectId: owner.projectId }, select: { id: true } });
    if (!party) throw new Error('Party is outside the current project');
  }

  const created = await prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.create({
      data: {
        organizationId: owner.id,
        projectId: owner.projectId,
        transactionTypeId: validation.transactionTypeId,
        title: validation.title,
        description: payload.description ? String(payload.description) : null,
        transactionDate: new Date(validation.transactionDate),
        status: validation.status,
        referenceNumber: payload.reference_number ? String(payload.reference_number) : null,
        externalReference: payload.external_reference ? String(payload.external_reference) : null,
        currency: validation.currency,
        finalAmount: new Prisma.Decimal(0),
        createdBy: owner.id,
        tags: payload.tags == null ? undefined : payload.tags,
        notes: payload.notes == null ? undefined : payload.notes,
        details: buildTransactionCompatibilityDetails(payload),
      },
    });

    if (normalizedLines.length > 0) {
      await tx.transactionLine.createMany({
        data: normalizedLines.map((line) => ({
          transactionId: transaction.id,
          lineTypeId: line.lineTypeId,
          title: line.title,
          description: line.description,
          referenceType: line.referenceType,
          referenceId: line.referenceId,
          currency: line.currency,
          baseAmount: line.baseAmount,
          sortOrder: line.sortOrder,
          metadata: line.metadata,
          finBook: line.finBook,
          finAccount: line.finAccount,
          tags: line.tags,
          details: line.details,
        })),
      });
    }

    const savedLines = await tx.transactionLine.findMany({
      where: { transactionId: transaction.id },
      orderBy: [
        { sortOrder: 'asc' },
        { id: 'asc' },
      ],
    });

    return tx.transaction.update({
      where: { id: transaction.id },
      data: {
        finalAmount: computeTransactionFinalAmount(savedLines),
      },
      include: {
        lines: {
          orderBy: [
            { sortOrder: 'asc' },
            { id: 'asc' },
          ],
        },
      },
    });
  });

  let party = null as { id: string; name: string; type: string } | null;
  if (payload.partyId) {
    party = await prisma.party.findFirst({
      where: { id: payload.partyId, projectId: owner.projectId },
      select: { id: true, name: true, type: true },
    });
  }

  return serializeTransactionRecord(created, { party });
}
