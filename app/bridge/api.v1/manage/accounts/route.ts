import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@neup/core/database/prisma';
import { ensureAccountRecord } from '@/server/account';

export async function GET(req: NextRequest) {
  const account = await ensureAccountRecord(req.cookies.get('auth')?.value);
  if (!account) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const accounts = await prisma.account.findMany({
    select: { id: true, displayName: true, neupid: true, displayImage: true, connection_id: true },
    orderBy: { displayName: 'asc' },
  });

  return NextResponse.json(accounts);
}
