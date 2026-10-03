import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { getProjectAccess, canAccess } from '@/server/access';
import {
  serializeTransactionRecord,
} from '@/services/transactions/records';
import {
  createTransactionForOwner,
  getPartyMapForTransactions,
  validateTransactionPayload,
} from '@/services/transactions/create';

/*
::neup.documentation::transactions-route
::api GET /api/transactions
::api POST /api/transactions

Lists organization-scoped transactions and creates new transactions using the
replacement `transaction` and `transaction_line` tables.

::private

The POST flow persists line rows in the same database transaction and computes
`final_amount` from the saved line amounts instead of trusting a client total.

::private end
::end
*/

export async function GET(req: NextRequest) {
  const access = await getProjectAccess(req);
  if (!access || !canAccess(access, 'transactions.read')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const assetGroupId = searchParams.get('assetGroupId');
  const limit = searchParams.get('limit');

  const items = await prisma.transaction.findMany({
    where: {
      projectId: access.projectId,
      ...(assetGroupId
        ? {
            lines: {
              some: {
                finBook: assetGroupId,
              },
            },
          }
        : {}),
    },
    orderBy: { transactionDate: 'desc' },
    include: {
      lines: {
        orderBy: [
          { sortOrder: 'asc' },
          { id: 'asc' },
        ],
      },
    },
    take: limit ? Number(limit) : undefined,
  });

  const partyMap = await getPartyMapForTransactions(access.projectId, items);

  return NextResponse.json(
    items.map((transaction) => {
      const details = transaction.details;
      const partyId = details && typeof details === 'object' && !Array.isArray(details)
        ? (details as Record<string, unknown>).partyId
        : undefined;

      return serializeTransactionRecord(transaction, {
        party: typeof partyId === 'string' ? (partyMap.get(partyId) ?? null) : null,
      });
    }),
    { status: 200 }
  );
}

export async function POST(req: NextRequest) {
  const access = await getProjectAccess(req);
  if (!access || !canAccess(access, 'transactions.write')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const validation = validateTransactionPayload(body);
  if (!validation.isValid) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const owner = await prisma.account.findUnique({ where: { id: access.accountId }, select: { id: true, displayName: true } });
  if (!owner) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 });
  }

  try {
    return NextResponse.json(
      await createTransactionForOwner({ ...owner, projectId: access.projectId }, body),
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Transaction creation failed' }, { status: 400 });
  }
}
