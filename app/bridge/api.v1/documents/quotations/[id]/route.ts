import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@neup/core/database/prisma';
import { canAccess, getProjectAccess } from '@/server/access';

// Read a quotation only when it belongs to the caller's active project.
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const access = await getProjectAccess(request);
  if (!access || !canAccess(access, 'transactions.read')) {
    return NextResponse.json({ status: false, error: { code: 'forbidden', description: 'You do not have access to view documents in this project.' } }, { status: 403 });
  }

  const { id } = await context.params;
  const quotation = await prisma.documentQuotation.findFirst({
    where: { id, document: { projectId: access.projectId, type: 'quotation' } },
    include: {
      document: { include: {
        events: { orderBy: { createdAt: 'asc' } },
        sourceRelationships: { include: { sourceDocument: { select: { id: true, type: true } } } },
        targetRelationships: { include: { targetDocument: { include: { events: true } } } },
      } },
      customer: { select: { id: true, name: true, type: true } },
      items: { orderBy: { sortIndex: 'asc' } },
      adjustments: true,
    },
  });

  if (!quotation) {
    return NextResponse.json({ status: false, error: { code: 'document_not_found', description: 'Quotation not found.' } }, { status: 404 });
  }

  return NextResponse.json({ status: true, result: quotation });
}
