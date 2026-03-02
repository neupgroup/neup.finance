import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/db'

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, displayName: true, accountId: true, email: true },
  })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(user)
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const body = await req.json()
  const { displayName, accountId, email } = body || {}
  if (!displayName || !accountId) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
  const user = await prisma.user.upsert({
    where: { id },
    create: { id, displayName, accountId, email: email ?? null },
    update: { displayName, accountId, email: email ?? null },
    select: { id: true, displayName: true, accountId: true, email: true },
  })
  return NextResponse.json(user)
}
