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
  const projectIds = projects.map((project) => project.id);
  const [accountProfile, projectDetails] = await Promise.all([
    prisma.account.findUnique({ where: { id: account.id }, select: { displayName: true, neupid: true } }),
    prisma.project.findMany({ where: { id: { in: projectIds } }, select: { id: true, details: true } }),
  ]);
  const detailsByProject = new Map(projectDetails.map((project) => [project.id, project.details]));
  return NextResponse.json(projects.map((project) => ({
    ...project,
    selected: project.id === selectedProjectId,
    details: detailsByProject.get(project.id) ?? null,
    account: accountProfile ? { displayName: accountProfile.displayName, neupid: accountProfile.neupid } : null,
  })));
}

export async function PATCH(req: NextRequest) {
  const account = await ensureAccountRecord(req.cookies.get('auth')?.value);
  if (!account) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const projectId = req.nextUrl.searchParams.get('project')?.trim();
  if (!projectId) return NextResponse.json({ error: 'Project is required' }, { status: 400 });
  const grant = await prisma.access.findFirst({
    where: { accountId: account.id, projectId, status: 'active', project: { status: 'active' } },
    include: { role: true },
  });
  if (!grant) return NextResponse.json({ error: 'Project access denied' }, { status: 403 });
  const rolePermissions = Array.isArray(grant.role.permissions) ? grant.role.permissions : [];
  const canManage = grant.role.name.toLowerCase() === 'owner' || rolePermissions.includes('*');
  if (!canManage) return NextResponse.json({ error: 'Project management permission required' }, { status: 403 });

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const status = body?.status === 'active' || body?.status === 'inactive' ? body.status : '';
  if (!name) return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
  if (!status) return NextResponse.json({ error: 'Project status is invalid' }, { status: 400 });

  const existing = await prisma.project.findUnique({ where: { id: projectId }, select: { details: true } });
  const existingDetails = existing?.details && typeof existing.details === 'object' && !Array.isArray(existing.details)
    ? existing.details as Record<string, unknown>
    : {};
  const inputDetails = body?.details?.branding && typeof body.details.branding === 'object' && !Array.isArray(body.details.branding)
    ? body.details.branding as Record<string, unknown>
    : {};
  const allowedFields = ['taxType', 'panNumber', 'location', 'phone', 'email', 'logo'] as const;
  const brandingDetails = Object.fromEntries(allowedFields.map((field) => [
    field,
    field === 'taxType'
      ? (inputDetails.taxType === 'VAT' ? 'VAT' : inputDetails.taxType === 'PAN' ? 'PAN' : existingDetails.taxType === 'VAT' ? 'VAT' : 'PAN')
      : typeof inputDetails[field] === 'string' ? inputDetails[field].trim() : typeof existingDetails[field] === 'string' ? existingDetails[field] : '',
  ]));
  const updated = await prisma.project.update({
    where: { id: projectId },
    data: { name, status, details: { ...existingDetails, branding: brandingDetails } },
    select: { id: true, name: true, status: true, details: true },
  });
  return NextResponse.json(updated);
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
    await tx.assetGroup.create({
      data: {
        name: 'Cash Account',
        type: 'Cash',
        currency: 'ALL',
        accountId: account.id,
        projectId: created.id,
      },
    });
    return created;
  });

  return NextResponse.json(project, { status: 201 });
}
