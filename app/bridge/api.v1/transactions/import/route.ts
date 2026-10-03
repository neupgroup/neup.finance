import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { getProjectAccess, canAccess } from '@/server/access';
import {
  importTransactionsForOwner,
  type TransactionImportFormat,
} from '@/services/transactions/import';

/*
::neup.documentation::transactions-import-route
::api POST /api/transactions/import

Imports CSV or JSON transaction rows for the current organization and returns
created transactions plus row-level failures.

::end
*/

type ImportRequestBody = {
  format?: TransactionImportFormat;
  content?: string;
};

export async function POST(req: NextRequest) {
  const access = await getProjectAccess(req);
  if (!access || !canAccess(access, 'transactions.write')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json() as ImportRequestBody;
  const format = body.format;
  const content = typeof body.content === 'string' ? body.content : '';
  const userId = access.accountId;

  if ((format !== 'csv' && format !== 'json') || !content.trim()) {
    return NextResponse.json({ error: 'Invalid import payload' }, { status: 400 });
  }

  const owner = await prisma.account.findUnique({ where: { id: access.accountId }, select: { id: true, displayName: true } });
  if (!owner) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 });
  }

  try {
    const result = await importTransactionsForOwner({ ...owner, projectId: access.projectId }, { format, content, userId });
    return NextResponse.json(result, { status: result.created.length > 0 ? 201 : 422 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Import failed' },
      { status: 400 }
    );
  }
}
