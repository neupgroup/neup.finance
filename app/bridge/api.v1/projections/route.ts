import { NextRequest, NextResponse } from 'next/server'
import { Prisma, prisma, type ProjectionStatus } from '@neup/core/database/prisma'
import { getProjectAccess, canAccess } from '@/server/access'

export async function GET(req: NextRequest) {
  const access = await getProjectAccess(req)
  if (!access || !canAccess(access, 'projections.read')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') as ProjectionStatus | null
  const where: any = { projectId: access.projectId }
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

export async function POST(req: NextRequest) {
  const access = await getProjectAccess(req)
  if (!access || !canAccess(access, 'projections.write')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json()
  const {
    title,
    type,
    certainty,
    amount,
    currency,
    date,
    status,
    recipient,
    isRecurring,
    recurrence,
    endsOn,
  } = body || {}
  if (!title || !type || !certainty || !amount || !currency || !date || !status || recurrence == null) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
  const created = await prisma.projection.create({
    data: {
      projectId: access.projectId,
      title,
      type,
      certainty,
      amount: new Prisma.Decimal(amount),
      currency,
      date: new Date(date),
      userId: access.accountId,
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
