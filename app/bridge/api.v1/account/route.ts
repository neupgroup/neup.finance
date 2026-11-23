import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import logica from '@neup/logica';
import { createHash } from 'node:crypto';
import { OWNER_ROLE_ID } from '@/server/roles';

function defaultId(accountId: string, kind: string) {
  const hex = createHash('md5').update(`${accountId}:finance-${kind}`).digest('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get('auth')?.value?.trim();
  const authentication = token ? await logica.account.self.isAuthenticated('local', token) : null;
  const account = authentication?.authenticated
    ? await logica.account.self.ensureRecord(token)
    : null;
  if (!account) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const payload = authentication && 'payload' in authentication ? authentication.payload : {};
  return NextResponse.json({
    ...account,
    aid: payload.aid ?? account.id,
    expiry: payload.exp ?? null,
  });
}

export async function PUT(req: NextRequest) {
  const token = req.cookies.get('auth')?.value;
  const account = await logica.account.self.ensureRecord(token);
  if (!account || !token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const id = account.id;
  const profile = account;

  const selectedProjectId = req.nextUrl.searchParams.get('project')?.trim();
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

  return NextResponse.json({ ...profile, project: grant.project, roleId: grant.roleId });
}
