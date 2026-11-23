import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@neup/core/database/prisma';
import { canAccess, getProjectAccess } from '@/server/access';

export async function GET(req: NextRequest) {
  const access = await getProjectAccess(req);
  if (!access || !canAccess(access, 'movements.read')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const movements = await prisma.movement.findMany({
    where: { product: { projectId: access.projectId } },
    orderBy: { on: 'desc' },
    include: { product: { select: { id: true, name: true, code: true, unit: true } } },
  });
  return NextResponse.json(movements);
}
