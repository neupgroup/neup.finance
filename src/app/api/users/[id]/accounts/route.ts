import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/db'

const CREDIT_TYPES = new Set(['sale', 'refund', 'income'])

function calculateBalance(transactions: Array<{ transaction_type: string; total_amount: unknown; status: string }>) {
  return transactions.reduce((sum, transaction) => {
    if (transaction.status === 'canceled') return sum
    const amount = Number(transaction.total_amount)
    if (Number.isNaN(amount)) return sum
    return sum + (CREDIT_TYPES.has(transaction.transaction_type) ? amount : -amount)
  }, 0)
}

function calculateLatestStockBalance(activityStock: Array<{ balance: unknown }>) {
  if (activityStock.length === 0) return 0
  const latestBalance = Number(activityStock[0]?.balance)
  return Number.isNaN(latestBalance) ? 0 : latestBalance
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const accounts = await prisma.assetGroup.findMany({
    where: { accountId: id },
    orderBy: { createdAt: 'desc' },
    include: {
      activityStock: {
        orderBy: { recordedOn: 'desc' },
        take: 1,
        select: {
          balance: true,
        },
      },
      transactions: {
        select: {
          transaction_type: true,
          total_amount: true,
          status: true,
        },
      },
    },
  })
  return NextResponse.json(
    accounts.map((a) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      balance: a.type === 'Stock' ? calculateLatestStockBalance(a.activityStock) : calculateBalance(a.transactions),
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
      accountId: id,
    },
  })
  return NextResponse.json({
    id: created.id,
    name: created.name,
    type: created.type,
    balance: 0,
    currency: created.currency,
    userId: created.accountId,
  })
}
