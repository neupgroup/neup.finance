import { prisma } from '@neup/core/database/prisma';

type BookLines = Array<{ id: string; baseAmount: unknown; transaction: { status: string } | null }>;
type BookTransactions = Array<{ amount: unknown; currency: string; direction: string; details: unknown }>;

// Calculate a book balance from current ledger and legacy transaction rows.
function calculateBalance(lines: BookLines, accountTransactions: BookTransactions) {
  const mirroredLineIds = new Set(accountTransactions.flatMap((transaction) => {
    const details = transaction.details;
    if (!details || typeof details !== 'object' || Array.isArray(details)) return [];
    const sourceLineId = (details as Record<string, unknown>).sourceTransactionLineId;
    return typeof sourceLineId === 'string' ? [sourceLineId] : [];
  }));
  const legacyBalance = lines.reduce((sum, line) => {
    if (mirroredLineIds.has(line.id) || line.transaction?.status === 'canceled') return sum;
    const amount = Number(line.baseAmount);
    return Number.isNaN(amount) ? sum : sum + amount;
  }, 0);
  return accountTransactions.reduce((sum, transaction) => {
    const rawDetails = transaction.details;
    if (rawDetails && typeof rawDetails === 'object' && !Array.isArray(rawDetails) && (rawDetails as Record<string, unknown>).status === 'canceled') return sum;
    const details = rawDetails && typeof rawDetails === 'object' && !Array.isArray(rawDetails)
      ? transaction.details as Record<string, unknown>
      : {};
    const amount = Number(details.accountAmount ?? transaction.amount);
    if (!Number.isFinite(amount)) return sum;
    return sum + (transaction.direction === 'in' ? amount : -amount);
  }, legacyBalance);
}

// Recalculate one account's balance from all ledger lines and account transactions.
export async function recalculateBookBalanceFromHistory(projectId: string, accountId: string) {
  const account = await prisma.assetGroup.findFirst({
    where: { id: accountId, projectId },
    select: {
      id: true,
      type: true,
      activityStock: { orderBy: { recordedOn: 'desc' }, take: 1, select: { balance: true } },
      transactionLines: {
        where: { transaction: { projectId } },
        select: { id: true, baseAmount: true, transaction: { select: { status: true } } },
      },
      accountTransactions: { select: { amount: true, currency: true, direction: true, details: true } },
    },
  });
  if (!account) return null;
  if (account.type === 'Stock') return Number(account.activityStock[0]?.balance) || 0;
  return calculateBalance(account.transactionLines, account.accountTransactions);
}

// Read books and calculate their balances for one project.
export async function getBooksForProject(projectId: string) {
  const accounts = await prisma.assetGroup.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
    include: {
      activityStock: { orderBy: { recordedOn: 'desc' }, take: 1, select: { balance: true } },
      transactionLines: {
        where: { transaction: { projectId } },
        select: { id: true, baseAmount: true, transaction: { select: { status: true } } },
      },
      accountTransactions: { select: { amount: true, currency: true, direction: true, details: true } },
    },
  });
  return accounts.map((account) => ({
    id: account.id,
    name: account.name,
    type: account.type,
    bankName: account.bankName,
    branch: account.branch,
    accountType: account.accountType,
    balance: account.type === 'Stock'
      ? (Number(account.activityStock[0]?.balance) || 0)
      : calculateBalance(account.transactionLines, account.accountTransactions),
    currency: account.currency,
    projectId: account.projectId,
  }));
}
