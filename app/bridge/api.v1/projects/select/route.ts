import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@neup/core/database/prisma';
import { ensureAccountRecord } from '@/server/account';

export async function POST(req: NextRequest) {
  const account = await ensureAccountRecord(req.cookies.get('auth')?.value);
  if (!account) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const projectId = typeof body?.projectId === 'string' ? body.projectId.trim() : '';
  const grant = projectId ? await prisma.access.findFirst({
    where: { accountId: account.id, projectId, status: 'active', project: { status: 'active' } },
  }) : null;
  if (!grant) return NextResponse.json({ error: 'Project access denied' }, { status: 403 });

  return NextResponse.json({ projectId });
}
