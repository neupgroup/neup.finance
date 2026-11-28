import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@neup/core/database/prisma';
import { canAccess, getProjectAccess } from '@/server/access';

// Read one sales order with its document lifecycle links and events.
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const access = await getProjectAccess(request);
  if (!access || !canAccess(access, 'transactions.read')) {
    return NextResponse.json({ status: false, error: { code: 'forbidden', description: 'You do not have access to view documents in this project.' } }, { status: 403 });
  }

  const { id } = await context.params;
  const salesOrder = await prisma.salesOrder.findFirst({
    where: { id, document: { projectId: access.projectId, type: 'sales-order' } },
    include: {
      document: { include: { events: { orderBy: { createdAt: 'asc' } }, sourceRelationships: { include: { sourceDocument: true } }, targetRelationships: { include: { targetDocument: true } } } },
      customer: { select: { id: true, name: true, type: true } },
      items: { orderBy: { sortIndex: 'asc' } },
    },
  });

  if (!salesOrder) {
    return NextResponse.json({ status: false, error: { code: 'document_not_found', description: 'Sales order not found.' } }, { status: 404 });
  }
  return NextResponse.json({ status: true, result: salesOrder });
}
