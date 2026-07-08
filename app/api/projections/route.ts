import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { Prisma, ProjectionCertainty, ProjectionRecurrence, ProjectionStatus, ProjectionType } from '@prisma/client'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId') || undefined
  const status = searchParams.get('status') as ProjectionStatus | null
  const where: any = {}
  if (userId) where.userId = userId
  if (status) where.status = status
  const items = await prisma.projection.findMany({
    where,
    orderBy: { date: 'asc' },
  })
  return NextResponse.json(
    items.map(( pipelines ) => ({
      id: pipelines.id,
      title: pipelines.title,
      type: pipelines.type,
      certainty: pipelines.certainty,
      amount: Number(pipelines.amount),
      currency: pipelines.currency,
      date: pipelines.date.toISOString(),
      userId: pipelines.userId,
      status: pipelines.status,
      recipient: pipelines.recipient,
      isRecurring: pipelines.isRecurring,
      recurrence: pipelines.recurrence,
      endsOn: pipelines.endsOn ? pipelines.endsOn.toISOString() : undefined,
    }))
  )
}

export async function POST(req: Request) {
  const body = await req.json()
  const {
    title,
    type,
    certainty,
    amount,
    currency,
    date,
    userId,
    status,
    recipient,
    isRecurring,
    recurrence,
    endsOn,
  } = body || {}
  if (!title || !type || !certainty || !amount || !currency || !date || !userId || !status || recurrence == null) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
  const created = await prisma.projection.create({
    data: {
      title,
      type,
      certainty,
      amount: new Prisma.Decimal(amount),
      currency,
      date: new Date(date),
      userId,
      status,
      recipient: recipient ?? null,
      isRecurring: !!isRecurring,
      recurrence,
      endsOn: endsOn ? new Date(endsOn) : null,
    },
  })
  return NextResponse.json({
    id: created.id,
    title: created.title,
    type: created.type,
    certainty: created.certainty,
    amount: Number(created.amount),
    currency: created.currency,
    date: created.date.toISOString(),
    userId: created.userId,
    status: created.status,
    recipient: created.recipient,
    isRecurring: created.isRecurring,
    recurrence: created.recurrence,
    endsOn: created.endsOn ? created.endsOn.toISOString() : undefined,
  })
}

