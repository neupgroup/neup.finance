import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@neup/core/database/prisma';
import { getProjectAccess, canAccess } from '@/server/access';
import { serializeTransactionRecord } from '@/services/transactions/records';

/*
::neup.documentation::transaction-detail-route
::api GET /api/transactions/:id

Returns one organization-scoped transaction from the replacement transaction
tables and serializes both the new and compatibility field names.

::end
*/

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const access = await getProjectAccess(req);
  if (!access || !canAccess(access, 'transactions.read')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await context.params;
  const transaction = await prisma.transaction.findFirst({
    where: { id, projectId: access.projectId },
    include: {
      lines: {
        orderBy: [
          { sortOrder: 'asc' },
          { id: 'asc' },
        ],
      },
    },
  });
  if (!transaction) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  let party = null as { id: string; name: string; type: string } | null;
  if (transaction.details && typeof transaction.details === 'object' && !Array.isArray(transaction.details)) {
    const partyId = (transaction.details as Record<string, unknown>).partyId;
    if (typeof partyId === 'string' && partyId) {
      party = await prisma.party.findFirst({
        where: { id: partyId, projectId: access.projectId },
        select: { id: true, name: true, type: true },
      });
    }
  }

  return NextResponse.json(
    serializeTransactionRecord(transaction, { party }),
    { status: 200 }
  );
}
