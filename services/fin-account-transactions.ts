import { Prisma, prisma } from '@neup/core/database/prisma';

export type FinAccountTransactionInput = {
  title: string;
  description?: string | null;
  currency: string;
  amount: number;
  direction: 'in' | 'out';
  activityOn: string;
  partyId?: string | null;
  details?: unknown;
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
  details: unknown;
  activityOn: Date;
}, party: { id: string; name: string; type: string } | null = null) {
  return {
    id: transaction.id,
    title: transaction.title,
    description: transaction.description,
    finAccountId: transaction.finAccountId,
    currency: transaction.currency,
    amount: Number(transaction.amount),
    direction: transaction.direction,
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
    include: { party: { select: { id: true, name: true, type: true } } },
  });
  return transactions.map((transaction) => serializeFinAccountTransaction(transaction, transaction.party));
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
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(input.activityOn);
    const activityOn = new Date(isDateOnly ? `${input.activityOn}T00:00:00.000Z` : input.activityOn);
    if (
      !title
      || !currency
      || !Number.isFinite(amount)
      || amount <= 0
      || !['in', 'out'].includes(input.direction)
      || Number.isNaN(activityOn.getTime())
      || (isDateOnly && activityOn.toISOString().slice(0, 10) !== input.activityOn)
    ) {
      throw new Error('Invalid transaction details');
    }
    return { ...input, title, currency, amount, activityOn };
  });

  const account = await prisma.assetGroup.findFirst({ where: { id: accountId, projectId }, select: { id: true } });
  if (!account) return null;
  const partyIds = [...new Set(normalizedInputs.map((input) => input.partyId).filter((partyId): partyId is string => Boolean(partyId)))];
  if (partyIds.length > 0) {
    const parties = await prisma.party.findMany({ where: { id: { in: partyIds }, projectId }, select: { id: true } });
    if (parties.length !== partyIds.length) throw new Error('Recipient party is outside the current project');
  }

  const transactions = await prisma.$transaction(async (tx) => Promise.all(normalizedInputs.map((input) => tx.finAccountTransaction.create({
    data: {
      title: input.title,
      description: input.description?.trim() || null,
      finAccountId: accountId,
      currency: input.currency,
      amount: input.amount,
      direction: input.direction,
      partyId: input.partyId ?? null,
      details: input.details == null ? undefined : JSON.parse(JSON.stringify(input.details)) as Prisma.InputJsonValue,
      activityOn: input.activityOn,
    }, include: { party: { select: { id: true, name: true, type: true } } },
  }))));
  return transactions.map((transaction) => serializeFinAccountTransaction(transaction, transaction.party));
}
