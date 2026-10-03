import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { ensureRecord } from '@neup/shared/account/self';
import { OWNER_ROLE_ID } from '@/server/roles';

export async function GET(req: NextRequest) {
  const account = await ensureRecord(req.cookies.get('auth_account')?.value);
  if (!account) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const grants = await prisma.access.findMany({
    where: { accountId: account.id, status: 'active', project: { status: 'active' } },
    include: { project: true, role: true },
    orderBy: { permittedOn: 'asc' },
  });
  const projects = new Map<string, { id: string; name: string; roles: string[]; selected: boolean }>();
  for (const grant of grants) {
    const current = projects.get(grant.projectId);
    if (current) current.roles.push(grant.role.name);
    else projects.set(grant.projectId, {
      id: grant.projectId,
      name: grant.project.name,
      roles: [grant.role.name],
      selected: grant.projectId === req.cookies.get('project_id')?.value,
    });
  }
  return NextResponse.json([...projects.values()]);
}

export async function POST(req: NextRequest) {
  const account = await ensureRecord(req.cookies.get('auth_account')?.value);
  if (!account) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  if (!name) return NextResponse.json({ error: 'Project name is required' }, { status: 400 });

  const project = await prisma.$transaction(async (tx) => {
    const role = await tx.role.upsert({
      where: { id: OWNER_ROLE_ID },
      create: { id: OWNER_ROLE_ID, name: 'Owner', description: 'Full project access', permissions: ['*'] },
      update: {},
    });
    const created = await tx.project.create({ data: { name, status: 'active' } });
    await tx.access.create({ data: {
      accountId: account.id,
      roleId: role.id,
      projectId: created.id,
      status: 'active',
      permittedOn: new Date(),
    } });
    return created;
  });

  const response = NextResponse.json(project, { status: 201 });
  response.cookies.set('project_id', project.id, { httpOnly: true, sameSite: 'lax', secure: req.nextUrl.protocol === 'https:' });
  return response;
}
