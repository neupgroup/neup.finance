import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { Prisma, TransactionStatus, TransactionType } from '@prisma/client'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  const limit = searchParams.get('limit')
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })
  const items = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    take: limit ? Number(limit) : undefined,
  })
  return NextResponse.json(
    items.map((t) => ({
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
    }))
  )
}

export async function POST(req: Request) {
  const body = await req.json()
  const {
    title,
    description,
    accountId,
    category,
    transaction_type,
    total_amount,
    total_paid,
    balance_due,
    status,
    date,
    currency,
    recipient,
    due_on,
    reference_document,
    userId,
  } = body || {}
  if (!title || !accountId || !category || !transaction_type || !total_amount || !status || !date || !currency || !userId) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
  const created = await prisma.transaction.create({
    data: {
      title,
      description: description ?? null,
      accountId,
      category,
      transaction_type,
      total_amount: new Prisma.Decimal(total_amount),
      total_paid: new Prisma.Decimal(total_paid ?? 0),
      balance_due: new Prisma.Decimal(balance_due ?? 0),
      status,
      date: new Date(date),
      currency,
      recipient: recipient ?? null,
      due_on: due_on ? new Date(due_on) : null,
      reference_document: reference_document ?? null,
      userId,
    },
  })
  return NextResponse.json({
    id: created.id,
    title: created.title,
    description: created.description ?? undefined,
    accountId: created.accountId,
    category: created.category,
    transaction_type: created.transaction_type,
    total_amount: Number(created.total_amount),
    total_paid: Number(created.total_paid),
    balance_due: Number(created.balance_due),
    status: created.status,
    date: created.date.toISOString(),
    currency: created.currency,
    recipient: created.recipient ?? undefined,
    due_on: created.due_on ? created.due_on.toISOString() : undefined,
    reference_document: created.reference_document ?? undefined,
    created_at: created.created_at.toISOString(),
    userId: created.userId,
  })
}

