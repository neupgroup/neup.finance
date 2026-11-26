import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@neup/core/database/prisma';
import { canAccess, getProjectAccess } from '@/server/access';
import { createFinAccountTransactionsForProject, getFinAccountTransactionHistory, type FinAccountTransactionInput } from '@/services/fin-account-transactions';
import { analyzeAccountTransactionFile, isDuplicateAccountTransaction, validateImportedAccountTransactions, type ExistingAccountTransaction } from '@/services/transactions/account-file-import';
import { getTransactionsForProject } from '@/services/transactions/list';

type RouteContext = { params: Promise<{ id: string }> };

// Load current account and ledger entries for AI duplicate comparison.
async function getAccountHistory(projectId: string, accountId: string, includeLedgerTransactions: boolean): Promise<{ currency: string; history: ExistingAccountTransaction[] } | null> {
  const account = await prisma.assetGroup.findFirst({ where: { id: accountId, projectId }, select: { id: true, currency: true } });
  if (!account) return null;

  const [accountTransactions, ledgerTransactions] = await Promise.all([
    getFinAccountTransactionHistory(projectId, accountId),
    includeLedgerTransactions
      ? getTransactionsForProject(projectId, { assetGroupId: accountId, limit: 200 })
      : Promise.resolve([]),
  ]);
  const history: ExistingAccountTransaction[] = [
    ...(accountTransactions ?? []).map((transaction) => ({
      title: transaction.title,
      date: transaction.activityOn,
      amount: transaction.amount,
      direction: transaction.direction as 'in' | 'out',
      currency: transaction.currency,
    })),
    ...ledgerTransactions.map((transaction) => ({
      title: transaction.title,
      date: transaction.date,
      amount: Math.abs(Number(transaction.total_amount)),
      direction: ['sale', 'refund', 'income'].includes(String(transaction.transaction_type)) ? 'in' as const : 'out' as const,
      currency: transaction.currency,
    })),
  ].sort((left, right) => right.date.localeCompare(left.date));
  return { currency: account.currency, history };
}

// Analyze a document or create the reviewed, non-duplicate account entries.
export async function POST(request: NextRequest, context: RouteContext) {
  const access = await getProjectAccess(request);
  if (!access || !canAccess(access, 'books.write')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { id } = await context.params;
  const accountHistory = await getAccountHistory(access.projectId, id, canAccess(access, 'transactions.read'));
  if (!accountHistory) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

  if (request.headers.get('content-type')?.includes('multipart/form-data')) {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) return NextResponse.json({ error: 'Choose a file to analyze.' }, { status: 400 });
    try {
      const transactions = await analyzeAccountTransactionFile(
        file.name,
        Buffer.from(await file.arrayBuffer()),
        accountHistory.currency,
        accountHistory.history,
      );
      return NextResponse.json({ transactions });
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not analyze this file.' }, { status: 422 });
    }
  }

  const body = await request.json().catch(() => null) as unknown;
  if (body && typeof body === 'object' && 'sourceText' in body) {
    const sourceText = typeof body.sourceText === 'string' ? body.sourceText.trim() : '';
    if (!sourceText) return NextResponse.json({ error: 'Paste transaction text to analyze.' }, { status: 400 });
    try {
      const transactions = await analyzeAccountTransactionFile(
        'pasted-transactions.txt',
        Buffer.from(sourceText, 'utf8'),
        accountHistory.currency,
        accountHistory.history,
      );
      return NextResponse.json({ transactions });
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not analyze the pasted text.' }, { status: 422 });
    }
  }

  const validated = validateImportedAccountTransactions(body);
  if (!validated.success || validated.data.transactions.length === 0) {
    return NextResponse.json({ error: 'Select between 1 and 500 new transactions to import.' }, { status: 400 });
  }
  const transactions = validated.data.transactions;

  let importedInputs: FinAccountTransactionInput[] = [];
  let skippedAsDuplicate = 0;
  try {
    for (const transaction of transactions) {
      if (transaction.duplicate || isDuplicateAccountTransaction(transaction, accountHistory.history)) {
        skippedAsDuplicate += 1;
        continue;
      }
      importedInputs.push({
        title: transaction.title,
        description: transaction.description ?? undefined,
        currency: transaction.currency || accountHistory.currency,
        amount: transaction.amount,
        direction: transaction.direction,
        activityOn: transaction.date,
        partyId: transaction.partyId ?? null,
        details: {
          source: 'file_import_ai',
          duplicateChecked: true,
        },
      });
      accountHistory.history.push({ title: transaction.title, date: transaction.date, amount: transaction.amount, direction: transaction.direction, currency: transaction.currency });
    }
    if (importedInputs.length === 0) return NextResponse.json({ imported: 0, skippedAsDuplicate });
    const savedTransactions = await createFinAccountTransactionsForProject(access.projectId, id, importedInputs);
    if (!savedTransactions) return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    return NextResponse.json({ imported: savedTransactions.length, skippedAsDuplicate });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not import transactions.' }, { status: 400 });
  }
}
