import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@neup/core/database/prisma';
import { canAccess, getProjectAccess } from '@/server/access';

// Read a proforma invoice only when it belongs to the caller's active project.
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const access = await getProjectAccess(request);
  if (!access || !canAccess(access, 'transactions.read')) {
    return NextResponse.json({ status: false, error: { code: 'forbidden', description: 'You do not have access to view documents in this project.' } }, { status: 403 });
  }

  const { id } = await context.params;
  const proforma = await prisma.proforma.findFirst({
    where: { id, document: { projectId: access.projectId, type: 'proforma-invoice' } },
    include: {
      document: true,
      customer: { select: { id: true, name: true, type: true } },
      items: { orderBy: { sortIndex: 'asc' } },
      adjustments: true,
    },
  });

  if (!proforma) {
    return NextResponse.json({ status: false, error: { code: 'document_not_found', description: 'Proforma invoice not found.' } }, { status: 404 });
  }

  return NextResponse.json({ status: true, result: proforma });
}
