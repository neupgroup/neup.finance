import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@neup/core/database/prisma';
import { canAccess, getProjectAccess } from '@/server/access';
import { getFinAccountTransactionHistory } from '@/services/fin-account-transactions';

// Return all account transactions in the active project for project-level cash flow charts.
export async function GET(request: NextRequest) {
  const access = await getProjectAccess(request);
  if (!access || !canAccess(access, 'books.read')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const accounts = await prisma.assetGroup.findMany({
    where: { projectId: access.projectId },
    select: { id: true },
  });
  const histories = await Promise.all(accounts.map(({ id }) => getFinAccountTransactionHistory(access.projectId, id)));
  return NextResponse.json(histories.flatMap((history) => history ?? []));
}
