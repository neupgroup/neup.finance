import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/db'

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const t = await prisma.transaction.findUnique({ where: { id } })
  if (!t) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({
    id: t.id,
    title: t.title,
    description: t.description ?? undefined,
    accountId: t.accountId,
    category: t.category,
    transaction_type: t.transaction_type,
    total_amount: Number(t.total_amount),
    total_paid: Number(t.total_paid),
    balance_due: Number(t.balance_due),
    status: t.status,
    date: t.date.toISOString(),
    currency: t.currency,
    recipient: t.recipient ?? undefined,
    due_on: t.due_on ? t.due_on.toISOString() : undefined,
    reference_document: t.reference_document ?? undefined,
    created_at: t.created_at.toISOString(),
    userId: t.userId,
  })
}
