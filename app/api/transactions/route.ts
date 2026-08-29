import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import {
  serializeTransactionRecord,
} from '@/services/transactions/records';
import {
  createTransactionForOwner,
  getConnectionIdFromTransactionRequestCookies,
  getPartyMapForTransactions,
  getTransactionOwnerByConnectionId,
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
  const connectionId = getConnectionIdFromTransactionRequestCookies(req.cookies);
  if (!connectionId) {
    return NextResponse.json({ error: 'connection_id cookie required' }, { status: 401 });
  }

  const owner = await prisma.account.findUnique({
    where: { connection_id: connectionId },
    select: { id: true },
  });
  if (!owner) {
    return NextResponse.json({ error: 'connection_id not registered' }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const assetGroupId = searchParams.get('assetGroupId');
  const limit = searchParams.get('limit');
  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  const items = await prisma.transaction.findMany({
    where: {
      organizationId: owner.id,
      ...(userId ? { createdBy: userId } : {}),
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

  const partyMap = await getPartyMapForTransactions(items);

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
  const connectionId = getConnectionIdFromTransactionRequestCookies(req.cookies);
  if (!connectionId) {
    return NextResponse.json({ error: 'connection_id cookie required' }, { status: 401 });
  }

  const body = await req.json();
  const validation = validateTransactionPayload(body);
  if (!validation.isValid) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const owner = await getTransactionOwnerByConnectionId(connectionId);
  if (!owner) {
    return NextResponse.json({ error: 'connection_id not registered' }, { status: 404 });
  }

  return NextResponse.json(
    await createTransactionForOwner(owner, body),
    { status: 201 }
  );
}
