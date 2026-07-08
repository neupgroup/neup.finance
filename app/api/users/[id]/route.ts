import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/db'

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const account = await prisma.account.findUnique({
    where: { id },
    select: {
      id: true,
      connection_id: true,
      displayName: true,
      neupid: true,
      displayImage: true,
    },
  })
  if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(account)
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const body = await req.json()
  const { connection_id, displayName, neupid, displayImage } = body || {}
  if (!connection_id) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
  const existing = await prisma.account.findUnique({
    where: { id },
    select: {
      displayName: true,
      neupid: true,
      displayImage: true,
    },
  })
  const account = await prisma.account.upsert({
    where: { id },
    create: {
      id,
      connection_id,
      displayName: displayName ?? existing?.displayName ?? '',
      neupid: neupid ?? existing?.neupid ?? '',
      displayImage: displayImage ?? existing?.displayImage ?? '',
    },
    update: {
      connection_id,
      displayName: displayName ?? existing?.displayName ?? '',
      neupid: neupid ?? existing?.neupid ?? '',
      displayImage: displayImage ?? existing?.displayImage ?? '',
    },
    select: {
      id: true,
      connection_id: true,
      displayName: true,
      neupid: true,
      displayImage: true,
    },
  })
  return NextResponse.json(account)
}
