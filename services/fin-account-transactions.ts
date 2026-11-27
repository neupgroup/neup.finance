import { Prisma, prisma } from '@neup/core/database/prisma';

export type FinAccountTransactionInput = {
  title: string;
  description?: string | null;
  currency: string;
  amount: number;
  direction: 'in' | 'out';
  status?: 'draft' | 'active' | 'reviewRequired';
  activityOn: string;
  partyId?: string | null;
  tags?: unknown;
  details?: unknown;
  exchangeRate?: number;
};

// Convert database values to the API shape used by account transaction history.
export function serializeFinAccountTransaction(transaction: {
  id: string;
  title: string;
  description: string | null;
  finAccountId: string;
  currency: string;
  amount: unknown;
  direction: string;
  status: string;
  tags: unknown;
  details: unknown;
  activityOn: Date;
}, party: { id: string; name: string; type: string; taxinfo?: unknown } | null = null) {
  return {
    id: transaction.id,
    title: transaction.title,
    description: transaction.description,
    finAccountId: transaction.finAccountId,
    currency: transaction.currency,
    amount: Number(transaction.amount),
    direction: transaction.direction,
    status: transaction.status,
    tags: transaction.tags,
    partyId: party?.id ?? null,
    party,
    details: transaction.details,
    activityOn: transaction.activityOn.toISOString(),
  };
}

// Read an account's transaction history after checking its project ownership.
export async function getFinAccountTransactionHistory(projectId: string, accountId: string) {
  const account = await prisma.assetGroup.findFirst({ where: { id: accountId, projectId }, select: { id: true } });
  if (!account) return null;
  const transactions = await prisma.finAccountTransaction.findMany({
    where: { finAccountId: accountId },
    orderBy: [{ activityOn: 'desc' }, { id: 'desc' }],
    include: { party: { select: { id: true, name: true, type: true, taxinfo: true } } },
  });
  return transactions.map((transaction) => serializeFinAccountTransaction(transaction, transaction.party));
}

// Update one transaction only when both its account and project match the request.
export async function updateFinAccountTransactionForProject(
  projectId: string,
  accountId: string,
  transactionId: string,
  input: FinAccountTransactionInput,
) {
  const normalizedTitle = input.title.trim();
  const normalizedCurrency = input.currency.trim().toUpperCase();
  const amount = Number(input.amount);
  const exchangeRate = input.exchangeRate == null ? null : Number(input.exchangeRate);
  const activityOn = new Date(input.activityOn);
  if (!normalizedTitle || !normalizedCurrency || !Number.isFinite(amount) || amount <= 0 || (exchangeRate != null && (!Number.isFinite(exchangeRate) || exchangeRate <= 0)) || !['in', 'out'].includes(input.direction) || Number.isNaN(activityOn.getTime())) {
    throw new Error('Invalid transaction details');
  }
  if (input.partyId) {
    const party = await prisma.party.findFirst({ where: { id: input.partyId, projectId }, select: { id: true } });
    if (!party) throw new Error('Recipient party is outside the current project');
  }
  const appliedExchangeRate = exchangeRate ?? 1;
  const updated = await prisma.finAccountTransaction.updateMany({
    where: { id: transactionId, finAccountId: accountId, finAccount: { projectId } },
    data: {
      title: normalizedTitle,
      description: input.description?.trim() || null,
      currency: normalizedCurrency,
      amount,
      direction: input.direction,
      ...(input.status ? { status: input.status } : {}),
      activityOn,
      partyId: input.partyId ?? null,
      ...(input.tags == null ? {} : { tags: JSON.parse(JSON.stringify(input.tags)) as Prisma.InputJsonValue }),
      details: {
        ...(input.details && typeof input.details === 'object' && !Array.isArray(input.details) ? input.details as Record<string, unknown> : {}),
        exchangeRate: appliedExchangeRate,
        accountAmount: amount * appliedExchangeRate,
      } as Prisma.InputJsonValue,
    },
  });
  if (!updated.count) return null;
  const transaction = await prisma.finAccountTransaction.findFirst({
    where: { id: transactionId, finAccountId: accountId },
    include: { party: { select: { id: true, name: true, type: true, taxinfo: true } } },
  });
  return transaction ? serializeFinAccountTransaction(transaction, transaction.party) : null;
}

// Create an account transaction through the shared account transaction service.
export async function createFinAccountTransactionForProject(
  projectId: string,
  accountId: string,
  input: FinAccountTransactionInput,
) {
  const created = await createFinAccountTransactionsForProject(projectId, accountId, [input]);
  return created?.[0] ?? null;
}

// Create multiple account transactions atomically after validating the account.
export async function createFinAccountTransactionsForProject(
  projectId: string,
  accountId: string,
  inputs: FinAccountTransactionInput[],
) {
  const normalizedInputs = inputs.map((input) => {
    const title = input.title.trim();
    const currency = input.currency.trim().toUpperCase();
    const amount = Number(input.amount);
    const exchangeRate = input.exchangeRate == null ? null : Number(input.exchangeRate);
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(input.activityOn);
    const activityOn = new Date(isDateOnly ? `${input.activityOn}T00:00:00.000Z` : input.activityOn);
    if (
      !title
      || !currency
      || !Number.isFinite(amount)
      || amount <= 0
      || (exchangeRate != null && (!Number.isFinite(exchangeRate) || exchangeRate <= 0))
      || !['in', 'out'].includes(input.direction)
      || Number.isNaN(activityOn.getTime())
      || (isDateOnly && activityOn.toISOString().slice(0, 10) !== input.activityOn)
    ) {
      throw new Error('Invalid transaction details');
    }
    const details = input.details && typeof input.details === 'object' && !Array.isArray(input.details)
      ? input.details as Record<string, unknown>
      : {};
    return { ...input, title, currency, amount, activityOn, exchangeRate, details: { ...details } };
  });

  const account = await prisma.assetGroup.findFirst({ where: { id: accountId, projectId }, select: { id: true, currency: true } });
  if (!account) return null;
  const validatedInputs = normalizedInputs.map((input) => {
    const isDifferentCurrency = account.currency !== input.currency;
    if (account.currency === 'ALL') return { ...input, exchangeRate: 1, details: { ...(input.details as Record<string, unknown>), accountAmount: input.amount, exchangeRate: 1 } };
    if (isDifferentCurrency && input.exchangeRate == null) throw new Error('Enter the exchange rate into the account currency');
    const exchangeRate = input.exchangeRate ?? 1;
    return { ...input, exchangeRate, details: { ...(input.details as Record<string, unknown>), accountAmount: input.amount * exchangeRate, exchangeRate } };
  });
  const partyIds = [...new Set(normalizedInputs.map((input) => input.partyId).filter((partyId): partyId is string => Boolean(partyId)))];
  if (partyIds.length > 0) {
    const parties = await prisma.party.findMany({ where: { id: { in: partyIds }, projectId }, select: { id: true } });
    if (parties.length !== partyIds.length) throw new Error('Recipient party is outside the current project');
  }

  const transactions = await prisma.$transaction(async (tx) => Promise.all(validatedInputs.map((input) => tx.finAccountTransaction.create({
    data: {
      title: input.title,
      description: input.description?.trim() || null,
      finAccountId: accountId,
      currency: input.currency,
      amount: input.amount,
      direction: input.direction,
      ...(input.status ? { status: input.status } : {}),
      partyId: input.partyId ?? null,
      tags: input.tags == null ? undefined : JSON.parse(JSON.stringify(input.tags)) as Prisma.InputJsonValue,
      details: JSON.parse(JSON.stringify(input.details)) as Prisma.InputJsonValue,
      activityOn: input.activityOn,
    }, include: { party: { select: { id: true, name: true, type: true, taxinfo: true } } },
  }))));
  return transactions.map((transaction) => serializeFinAccountTransaction(transaction, transaction.party));
}
