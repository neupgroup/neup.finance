import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import {
  buildTransactionCompatibilityDetails,
  computeTransactionFinalAmount,
  normalizeTransactionLines,
  serializeTransactionRecord,
  type TransactionPayload,
} from '@/services/transactions/records';

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

function getConnectionIdFromCookie(req: NextRequest): string | null {
  const connectionId = req.cookies.get('connection_id')?.value?.trim()
    || req.cookies.get('accountId')?.value?.trim();
  return connectionId || null;
}

async function ensureTransactionUser(userId: string | undefined, owner: { id: string; displayName: string }) {
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

async function getPartyMapForTransactions(transactions: Array<{ details: unknown }>) {
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

export async function GET(req: NextRequest) {
  const connectionId = getConnectionIdFromCookie(req);
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
  const connectionId = getConnectionIdFromCookie(req);
  if (!connectionId) {
    return NextResponse.json({ error: 'connection_id cookie required' }, { status: 401 });
  }

  const body = await req.json() as TransactionPayload;
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const transactionTypeId = String(body.transaction_type_id ?? body.transaction_type ?? '').trim();
  const transactionDate = String(body.transaction_date ?? body.date ?? '').trim();
  const status = typeof body.status === 'string' ? body.status.trim() : '';
  const currency = typeof body.currency === 'string' ? body.currency.trim().toUpperCase() : '';
  const createdBy = typeof body.created_by === 'string' ? body.created_by.trim() : (typeof body.userId === 'string' ? body.userId.trim() : '');

  if (!title || !transactionTypeId || !transactionDate || !status || !currency || !createdBy) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const owner = await prisma.account.findUnique({
    where: { connection_id: connectionId },
    select: { id: true, displayName: true },
  });
  if (!owner) {
    return NextResponse.json({ error: 'connection_id not registered' }, { status: 404 });
  }

  const persistedUser = await ensureTransactionUser(createdBy, owner);
  const normalizedLines = normalizeTransactionLines(body, currency);

  const created = await prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.create({
      data: {
        organizationId: owner.id,
        transactionTypeId,
        title,
        description: body.description ? String(body.description) : null,
        transactionDate: new Date(transactionDate),
        status,
        referenceNumber: body.reference_number ? String(body.reference_number) : null,
        externalReference: body.external_reference ? String(body.external_reference) : null,
        currency,
        finalAmount: 0,
        createdBy: persistedUser?.id ?? createdBy,
        tags: body.tags == null ? undefined : body.tags,
        notes: body.notes == null ? undefined : body.notes,
        details: buildTransactionCompatibilityDetails(body),
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

    const finalAmount = computeTransactionFinalAmount(savedLines);

    return tx.transaction.update({
      where: { id: transaction.id },
      data: {
        finalAmount,
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
  if (body.partyId) {
    party = await prisma.party.findFirst({
      where: { id: body.partyId, accountId: owner.id },
      select: { id: true, name: true, type: true },
    });
  }

  return NextResponse.json(
    serializeTransactionRecord(created, { party }),
    { status: 201 }
  );
}
