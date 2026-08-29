import { NextRequest, NextResponse } from 'next/server';
import {
  getConnectionIdFromTransactionRequestCookies,
  getTransactionOwnerByConnectionId,
} from '@/services/transactions/create';
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
  userId?: string;
};

export async function POST(req: NextRequest) {
  const connectionId = getConnectionIdFromTransactionRequestCookies(req.cookies);
  if (!connectionId) {
    return NextResponse.json({ error: 'connection_id cookie required' }, { status: 401 });
  }

  const body = await req.json() as ImportRequestBody;
  const format = body.format;
  const content = typeof body.content === 'string' ? body.content : '';
  const userId = typeof body.userId === 'string' ? body.userId.trim() : '';

  if ((format !== 'csv' && format !== 'json') || !content.trim() || !userId) {
    return NextResponse.json({ error: 'Invalid import payload' }, { status: 400 });
  }

  const owner = await getTransactionOwnerByConnectionId(connectionId);
  if (!owner) {
    return NextResponse.json({ error: 'connection_id not registered' }, { status: 404 });
  }

  try {
    const result = await importTransactionsForOwner(owner, { format, content, userId });
    return NextResponse.json(result, { status: result.created.length > 0 ? 201 : 422 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Import failed' },
      { status: 400 }
    );
  }
}
