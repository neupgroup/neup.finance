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
};

export type TransactionCreateResult = ReturnType<typeof serializeTransactionRecord>;

export function getConnectionIdFromTransactionRequestCookies(cookies: {
  get(name: string): { value?: string } | undefined;
}) {
  const connectionId = cookies.get('connection_id')?.value?.trim()
    || cookies.get('accountId')?.value?.trim();
  return connectionId || null;
}

export async function getTransactionOwnerByConnectionId(connectionId: string): Promise<TransactionOwner | null> {
  return prisma.account.findUnique({
    where: { connection_id: connectionId },
    select: { id: true, displayName: true },
  });
}

export async function ensureTransactionUser(userId: string | undefined, owner: TransactionOwner) {
  if (!userId) {
    return null;
  }

  return prisma.user.upsert({
    where: { id: userId },
    create: {
      id: userId,
      displayName: owner.displayName || 'Ledger User',
      accountId: owner.id,
    },
    update: {
      accountId: owner.id,
      displayName: owner.displayName || 'Ledger User',
    },
    select: { id: true },
  });
}

export function validateTransactionPayload(payload: TransactionPayload) {
  const title = typeof payload.title === 'string' ? payload.title.trim() : '';
  const transactionTypeId = String(payload.transaction_type_id ?? payload.transaction_type ?? '').trim();
  const transactionDate = String(payload.transaction_date ?? payload.date ?? '').trim();
  const status = typeof payload.status === 'string' ? payload.status.trim() : '';
  const currency = typeof payload.currency === 'string' ? payload.currency.trim().toUpperCase() : '';
  const createdBy = typeof payload.created_by === 'string'
    ? payload.created_by.trim()
    : (typeof payload.userId === 'string' ? payload.userId.trim() : '');

  return {
    title,
    transactionTypeId,
    transactionDate,
    status,
    currency,
    createdBy,
    isValid: Boolean(title && transactionTypeId && transactionDate && status && currency && createdBy),
  };
}

export async function getPartyMapForTransactions(transactions: Array<{ details: unknown }>) {
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
    where: { id: { in: partyIds } },
    select: { id: true, name: true, type: true },
  });

  return new Map(parties.map((party) => [party.id, party]));
}

export async function createTransactionForOwner(owner: TransactionOwner, payload: TransactionPayload) {
  const validation = validateTransactionPayload(payload);
  if (!validation.isValid) {
    throw new Error('Invalid payload');
  }

  const persistedUser = await ensureTransactionUser(validation.createdBy, owner);
  const normalizedLines = normalizeTransactionLines(payload, validation.currency);

  const created = await prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.create({
      data: {
        organizationId: owner.id,
        transactionTypeId: validation.transactionTypeId,
        title: validation.title,
        description: payload.description ? String(payload.description) : null,
        transactionDate: new Date(validation.transactionDate),
        status: validation.status,
        referenceNumber: payload.reference_number ? String(payload.reference_number) : null,
        externalReference: payload.external_reference ? String(payload.external_reference) : null,
        currency: validation.currency,
        finalAmount: new Prisma.Decimal(0),
        createdBy: persistedUser?.id ?? validation.createdBy,
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
      where: { id: payload.partyId, accountId: owner.id },
      select: { id: true, name: true, type: true },
    });
  }

  return serializeTransactionRecord(created, { party });
}
