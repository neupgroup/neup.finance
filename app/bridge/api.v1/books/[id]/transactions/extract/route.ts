import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@neup/core/database/prisma';
import { canAccess, getProjectAccess } from '@/server/access';
import { extractAccountTransaction } from '@/services/transactions/extract-account-transaction';

type RouteContext = { params: Promise<{ id: string }> };

// Extract possible transaction fields for an account using the shared intelligence service.
export async function POST(request: NextRequest, context: RouteContext) {
  const access = await getProjectAccess(request);
  if (!access || !canAccess(access, 'books.write')) {
    return NextResponse.json({ error: { code: 'forbidden', description: 'You cannot edit transactions in this project.' } }, { status: 403 });
  }

  const { id: accountId } = await context.params;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: { code: 'invalid_payload', description: 'Enter transaction details to extract.' } }, { status: 400 });
  }
  const enteredFields = Object.fromEntries(Object.entries(body).filter(([, value]) => typeof value === 'string' && value.trim()).map(([key, value]) => [key, (value as string).trim()]));
  if (Object.keys(enteredFields).length === 0) {
    return NextResponse.json({ error: { code: 'missing_input', description: 'Enter transaction details before extracting.' } }, { status: 400 });
  }

  const account = await prisma.assetGroup.findFirst({ where: { id: accountId, projectId: access.projectId }, select: { currency: true } });
  if (!account) return NextResponse.json({ error: { code: 'account_not_found', description: 'Account not found in this project.' } }, { status: 404 });

  try {
    const parties = await prisma.party.findMany({ where: { projectId: access.projectId }, select: { name: true } });
    const extracted = await extractAccountTransaction(enteredFields, account.currency, parties.map((party) => party.name));
    return NextResponse.json({ status: true, result: extracted });
  } catch (error) {
    return NextResponse.json({ error: { code: 'extraction_failed', description: error instanceof Error ? error.message : 'Could not extract transaction details.' } }, { status: 422 });
  }
}
