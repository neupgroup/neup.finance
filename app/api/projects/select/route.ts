import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { ensureRecord } from '@neup/shared/account/self';

export async function POST(req: NextRequest) {
  const account = await ensureRecord(req.cookies.get('auth_account')?.value);
  if (!account) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const projectId = typeof body?.projectId === 'string' ? body.projectId.trim() : '';
  const grant = projectId ? await prisma.access.findFirst({
    where: { accountId: account.id, projectId, status: 'active', project: { status: 'active' } },
  }) : null;
  if (!grant) return NextResponse.json({ error: 'Project access denied' }, { status: 403 });

  const response = NextResponse.json({ projectId });
  response.cookies.set('project_id', projectId, { httpOnly: true, sameSite: 'lax', secure: req.nextUrl.protocol === 'https:' });
  return response;
}
