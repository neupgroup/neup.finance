import { NextRequest, NextResponse } from 'next/server';
import { canAccess, getProjectAccess } from '@/server/access';
import { createFinAccountTransactionForProject, getFinAccountTransactionHistory } from '@/services/fin-account-transactions';

type RouteContext = { params: Promise<{ id: string }> };

// List account transactions after confirming the account belongs to the active project.
export async function GET(request: NextRequest, context: RouteContext) {
  const access = await getProjectAccess(request);
  if (!access || !canAccess(access, 'books.read')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await context.params;
  const transactions = await getFinAccountTransactionHistory(access.projectId, id);
  if (!transactions) return NextResponse.json({ error: 'Account not found' }, { status: 404 });
  return NextResponse.json(transactions);
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
  const requestedAmount = Number(body?.amount);
  const direction = body?.direction;
  const activityOn = typeof body?.activityOn === 'string' ? body.activityOn : '';
  const exchangeRate = typeof body?.exchangeRate === 'number' ? body.exchangeRate : undefined;

  if (!title || !currency || currency === 'ALL' || !Number.isFinite(requestedAmount) || requestedAmount <= 0 || (exchangeRate != null && (!Number.isFinite(exchangeRate) || exchangeRate <= 0)) || !['in', 'out'].includes(direction) || !activityOn) {
    return NextResponse.json({ error: 'Invalid transaction details' }, { status: 400 });
  }

  try {
    const transaction = await createFinAccountTransactionForProject(access.projectId, id, {
      title,
      description: typeof body.description === 'string' ? body.description : undefined,
      currency,
      amount: requestedAmount,
      direction,
      activityOn,
      partyId: typeof body.partyId === 'string' && body.partyId ? body.partyId : null,
      tags: body.tags,
      details: body.details,
      ...(exchangeRate == null ? {} : { exchangeRate }),
    });
    if (!transaction) return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid transaction details' }, { status: 400 });
  }
}
