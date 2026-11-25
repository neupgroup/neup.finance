import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@neup/core/database/prisma';
import { OWNER_ROLE_ID } from '@/server/roles';
import { ensureAccountRecord } from '@/server/account';
import { getProjectsForAccount } from '@/services/projects';

export async function GET(req: NextRequest) {
  const account = await ensureAccountRecord(req.cookies.get('auth')?.value);
  if (!account) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const selectedProjectId = req.nextUrl.searchParams.get('project');
  const projects = await getProjectsForAccount(account.id);
  return NextResponse.json(projects.map((project) => ({
    ...project,
    selected: project.id === selectedProjectId,
  })));
}

export async function POST(req: NextRequest) {
  const account = await ensureAccountRecord(req.cookies.get('auth')?.value);
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

  return NextResponse.json(project, { status: 201 });
}
