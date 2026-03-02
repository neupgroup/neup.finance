import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { Prisma } from '@prisma/client'

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const items = await prisma.transactionLine.findMany({
    where: { transactionId: id },
    orderBy: { id: 'asc' },
  })
  return NextResponse.json(
    items.map((l) => ({
      id: l.id,
      transaction_id: l.transactionId,
      line_title: l.line_title,
      description: l.description ?? undefined,
      category: l.category,
      account: l.account,
      debit: Number(l.debit),
      credit: Number(l.credit),
      currency: l.currency,
    }))
  )
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const body = await req.json()
  const { line_title, description, category, account, debit, credit, currency } = body || {}
  if (!line_title || !category || !account || (debit == null && credit == null) || !currency) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
  const created = await prisma.transactionLine.create({
    data: {
      transactionId: id,
      line_title,
      description: description ?? null,
      category,
      account,
      debit: new Prisma.Decimal(debit ?? 0),
      credit: new Prisma.Decimal(credit ?? 0),
      currency,
    },
  })
  return NextResponse.json({
    id: created.id,
    transaction_id: created.transactionId,
    line_title: created.line_title,
    description: created.description ?? undefined,
    category: created.category,
    account: created.account,
    debit: Number(created.debit),
    credit: Number(created.credit),
    currency: created.currency,
  })
}
