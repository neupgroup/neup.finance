import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@neup/core/database/prisma';
import { canAccess, getProjectAccess } from '@/server/access';

type RouteContext = { params: Promise<{ id: string }> };

// Return database decimals and dates in a stable JSON-friendly format.
function serializeAccountTransaction(transaction: {
  id: string;
  title: string;
  description: string | null;
  finAccountId: string;
  currency: string;
  amount: unknown;
  direction: string;
  details: unknown;
  activityOn: Date;
}) {
  return {
    id: transaction.id,
    title: transaction.title,
    description: transaction.description,
    finAccountId: transaction.finAccountId,
    currency: transaction.currency,
    amount: Number(transaction.amount),
    direction: transaction.direction,
    details: transaction.details,
    activityOn: transaction.activityOn.toISOString().slice(0, 10),
  };
}

// List account transactions after confirming the account belongs to the active project.
export async function GET(request: NextRequest, context: RouteContext) {
  const access = await getProjectAccess(request);
  if (!access || !canAccess(access, 'books.read')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await context.params;
  const account = await prisma.assetGroup.findFirst({ where: { id, projectId: access.projectId }, select: { id: true } });
  if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

  const transactions = await prisma.finAccountTransaction.findMany({
    where: { finAccountId: id },
    orderBy: [{ activityOn: 'desc' }, { id: 'desc' }],
  });
  return NextResponse.json(transactions.map(serializeAccountTransaction));
}

// Create a transaction directly against the selected cash or bank account.
export async function POST(request: NextRequest, context: RouteContext) {
  const access = await getProjectAccess(request);
  if (!access || !canAccess(access, 'books.write')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const title = typeof body?.title === 'string' ? body.title.trim() : '';
  const currency = typeof body?.currency === 'string' ? body.currency.trim().toUpperCase() : '';
  const amount = Number(body?.amount);
  const direction = body?.direction;
  const activityOn = typeof body?.activityOn === 'string' ? new Date(`${body.activityOn}T00:00:00.000Z`) : null;

  if (!title || !currency || !Number.isFinite(amount) || amount <= 0 || !['in', 'out'].includes(direction) || !activityOn || Number.isNaN(activityOn.getTime())) {
    return NextResponse.json({ error: 'Invalid transaction details' }, { status: 400 });
  }

  const account = await prisma.assetGroup.findFirst({ where: { id, projectId: access.projectId }, select: { id: true } });
  if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

  const transaction = await prisma.finAccountTransaction.create({
    data: {
      title,
      description: typeof body.description === 'string' && body.description.trim() ? body.description.trim() : null,
      finAccountId: id,
      currency,
      amount,
      direction,
      details: body.details ?? undefined,
      activityOn,
    },
  });
  return NextResponse.json(serializeAccountTransaction(transaction), { status: 201 });
}
