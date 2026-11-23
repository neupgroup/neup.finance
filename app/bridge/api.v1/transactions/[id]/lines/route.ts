import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@neup/core/database/prisma';
import { getProjectAccess, canAccess } from '@/server/access';
import {
  computeTransactionFinalAmount,
  normalizeTransactionLines,
  serializeTransactionLine,
  type TransactionPayload,
} from '@/services/transactions/records';

/*
::neup.documentation::transaction-lines-route
::api GET /api/transactions/:id/lines
::api POST /api/transactions/:id/lines

Lists and appends transaction lines for the replacement `transaction_line`
table, recalculating the parent transaction final amount after writes.

::end
*/

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const access = await getProjectAccess(req);
  if (!access || !canAccess(access, 'transactions.read')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const items = await prisma.transactionLine.findMany({
    where: { transactionId: id, transaction: { projectId: access.projectId } },
    orderBy: [
      { sortOrder: 'asc' },
      { id: 'asc' },
    ],
  });

  return NextResponse.json(
    items.map(serializeTransactionLine),
    { status: 200 }
  );
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const access = await getProjectAccess(req);
  if (!access || !canAccess(access, 'transactions.write')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const transaction = await prisma.transaction.findFirst({
    where: { id, projectId: access.projectId },
    select: {
      id: true,
      currency: true,
    },
  });
  if (!transaction) {
    return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
  }

  const body = await req.json() as TransactionPayload;
  const lines = normalizeTransactionLines({ ...body, lines: [body as any] }, transaction.currency);
  const line = lines[0];
  if (!line || !line.title || !line.currency) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
  if (line.finBook) {
    const book = await prisma.assetGroup.findFirst({ where: { id: line.finBook, projectId: access.projectId }, select: { id: true } });
    if (!book) return NextResponse.json({ error: 'Book is outside the current project' }, { status: 400 });
  }

  const created = await prisma.$transaction(async (tx) => {
    const currentCount = await tx.transactionLine.count({
      where: { transactionId: id },
    });

    const savedLine = await tx.transactionLine.create({
      data: {
        transactionId: id,
        lineTypeId: line.lineTypeId,
        title: line.title,
        description: line.description,
        referenceType: line.referenceType,
        referenceId: line.referenceId,
        currency: line.currency,
        baseAmount: line.baseAmount,
        sortOrder: line.sortOrder ?? currentCount,
        metadata: line.metadata,
        finBook: line.finBook,
        finAccount: line.finAccount,
        tags: line.tags,
        details: line.details,
      },
    });

    const allLines = await tx.transactionLine.findMany({
      where: { transactionId: id },
      select: { baseAmount: true },
    });

    await tx.transaction.update({
      where: { id },
      data: {
        finalAmount: computeTransactionFinalAmount(allLines),
      },
    });

    return savedLine;
  });

  return NextResponse.json(
    serializeTransactionLine(created),
    { status: 201 }
  );
}
