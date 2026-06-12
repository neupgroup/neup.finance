import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { Prisma } from '@prisma/client'

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const accounts = await prisma.assetGroup.findMany({
    where: { accountId: id },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(
    accounts.map((a) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      balance: Number(a.balance),
      currency: a.currency,
      userId: a.accountId,
    }))
  )
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const body = await req.json()
  const { name, type, currency } = body || {}
  if (!name || !type || !currency) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
  const created = await prisma.assetGroup.create({
    data: {
      name,
      type,
      currency,
      balance: new Prisma.Decimal(0),
      accountId: id,
    },
  })
  return NextResponse.json({
    id: created.id,
    name: created.name,
    type: created.type,
    balance: Number(created.balance),
    currency: created.currency,
    userId: created.accountId,
  })
}
