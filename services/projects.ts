import { prisma } from '@neup/core/database/prisma';

// List the active projects and roles available to one account.
export async function getProjectsForAccount(accountId: string) {
  const grants = await prisma.access.findMany({
    where: { accountId, status: 'active', project: { status: 'active' } },
    include: { project: true, role: true },
    orderBy: { permittedOn: 'asc' },
  });
  const projects = new Map<string, { id: string; name: string; status: string; roles: string[]; selected?: boolean }>();
  for (const grant of grants) {
    const project = projects.get(grant.projectId);
    if (project) project.roles.push(grant.role.name);
    else projects.set(grant.projectId, { id: grant.projectId, name: grant.project.name, status: grant.project.status, roles: [grant.role.name] });
  }
  return [...projects.values()];
}
