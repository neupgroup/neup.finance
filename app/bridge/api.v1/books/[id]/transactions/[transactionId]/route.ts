import { NextRequest, NextResponse } from 'next/server';
import { canAccess, getProjectAccess } from '@/server/access';
import { updateFinAccountTransactionForProject } from '@/services/fin-account-transactions';

type RouteContext = { params: Promise<{ id: string; transactionId: string }> };

// Replace editable fields on one transaction within the selected project account.
export async function PUT(request: NextRequest, context: RouteContext) {
  const access = await getProjectAccess(request);
  if (!access || !canAccess(access, 'books.write')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id, transactionId } = await context.params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body.title !== 'string' || typeof body.currency !== 'string' || typeof body.activityOn !== 'string') {
    return NextResponse.json({ error: 'Invalid transaction details' }, { status: 400 });
  }
  try {
    const transaction = await updateFinAccountTransactionForProject(access.projectId, id, transactionId, {
      title: body.title,
      description: typeof body.description === 'string' ? body.description : undefined,
      currency: body.currency,
      amount: Number(body.amount),
      direction: body.direction,
      status: body.status,
      activityOn: body.activityOn,
      partyId: typeof body.partyId === 'string' && body.partyId ? body.partyId : null,
      tags: body.tags,
    });
    if (!transaction) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    return NextResponse.json(transaction);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid transaction details' }, { status: 400 });
  }
}
