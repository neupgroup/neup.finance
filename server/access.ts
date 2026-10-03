import type { NextRequest } from 'next/server';
import { prisma } from '@/server/db';
import { ensureRecord } from '@neup/shared/account/self';

export type ProjectAccess = {
  accountId: string;
  projectId: string;
  permissions: string[];
};

export async function getProjectAccess(req: NextRequest): Promise<ProjectAccess | null> {
  return getProjectAccessForToken(req.cookies.get('auth_account')?.value, req.cookies.get('project_id')?.value);
}

export async function getProjectAccessForToken(authToken?: string, projectId?: string): Promise<ProjectAccess | null> {
  if (!authToken || !projectId) return null;
  const account = await ensureRecord(authToken);
  if (!account) return null;

  const grants = await prisma.access.findMany({
    where: {
      accountId: account.id,
      projectId,
      status: 'active',
      project: { status: 'active' },
    },
    include: { role: true },
  });
  if (grants.length === 0) return null;

  return {
    accountId: account.id,
    projectId,
    permissions: [...new Set(grants.flatMap((grant) =>
      Array.isArray(grant.role.permissions)
        ? grant.role.permissions.filter((permission): permission is string => typeof permission === 'string')
        : []
    ))],
  };
}

export function canAccess(access: ProjectAccess, permission: string): boolean {
  return access.permissions.includes('*') || access.permissions.includes(permission);
}
