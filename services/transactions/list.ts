import { prisma } from '@neup/core/database/prisma';
import { serializeTransactionRecord } from '@/services/transactions/records';
import { getPartyMapForTransactions } from '@/services/transactions/create';

export type TransactionListOptions = {
  assetGroupId?: string | null;
  limit?: number;
};

// List project transactions in the shared API and MCP response format.
export async function getTransactionsForProject(projectId: string, options: TransactionListOptions = {}) {
  const items = await prisma.transaction.findMany({
    where: {
      projectId,
      ...(options.assetGroupId ? { lines: { some: { finBook: options.assetGroupId } } } : {}),
    },
    orderBy: { transactionDate: 'desc' },
    include: { lines: { orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] } },
    take: options.limit,
  });
  const partyMap = await getPartyMapForTransactions(projectId, items);
  return items.map((transaction) => {
    const details = transaction.details;
    const partyId = details && typeof details === 'object' && !Array.isArray(details)
      ? (details as Record<string, unknown>).partyId
      : undefined;
    return serializeTransactionRecord(transaction, {
      party: typeof partyId === 'string' ? (partyMap.get(partyId) ?? null) : null,
    });
  });
}
