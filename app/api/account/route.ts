import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { ensureRecord } from '@neup/shared/account/self';
import { createHash } from 'node:crypto';
import { OWNER_ROLE_ID } from '@/server/roles';

function defaultId(accountId: string, kind: string) {
  const hex = createHash('md5').update(`${accountId}:finance-${kind}`).digest('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export async function GET(req: NextRequest) {
  const account = await ensureRecord(req.cookies.get('auth_account')?.value);
  if (!account) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json(account);
}

export async function PUT(req: NextRequest) {
  const token = req.cookies.get('auth_account')?.value;
  const account = await ensureRecord(token);
  if (!account || !token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const id = account.id;
  const profile = account;

  const selectedProjectId = req.cookies.get('project_id')?.value;
  let grant = selectedProjectId ? await prisma.access.findFirst({
    where: { accountId: id, projectId: selectedProjectId, status: 'active', project: { status: 'active' } },
    include: { project: true },
  }) : null;
  grant ??= await prisma.access.findFirst({
    where: { accountId: id, status: 'active', project: { status: 'active' } },
    orderBy: { permittedOn: 'asc' },
    include: { project: true },
  });

  if (!grant) {
    grant = await prisma.$transaction(async (tx) => {
      const role = await tx.role.upsert({
        where: { id: OWNER_ROLE_ID },
        create: { id: OWNER_ROLE_ID, name: 'Owner', description: 'Full project access', permissions: ['*'] },
        update: {},
      });
      const projectId = defaultId(id, 'default-project');
      const project = await tx.project.upsert({
        where: { id: projectId },
        create: { id: projectId, name: `${profile.displayName || 'My'} Project`, status: 'active' },
        update: {},
      });
      const accessId = defaultId(id, 'owner-access');
      return tx.access.upsert({
        where: { id: accessId },
        create: { id: accessId, accountId: id, roleId: role.id, projectId: project.id, status: 'active', permittedOn: new Date() },
        update: {},
        include: { project: true },
      });
    });
  }

  const response = NextResponse.json({ ...profile, project: grant.project, roleId: grant.roleId });
  response.cookies.set('project_id', grant.projectId, { httpOnly: true, sameSite: 'lax', secure: req.nextUrl.protocol === 'https:' });
  return response;
}
