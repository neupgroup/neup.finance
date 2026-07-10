import { NextRequest, NextResponse } from 'next/server';
import { createPartyForAccount, getAccountIdByConnectionId, getPartiesForAccount } from '@/services/parties';

/*
::neup.documentation::api-parties-route
::api GET /api/parties

Lists the current account's parties with contacts, payment methods, and
received or sent payment totals derived from linked transactions.

::api POST /api/parties

Creates a party for the current account and returns the created party record for the id detail route.

::end
*/

function getConnectionIdFromCookie(req: NextRequest): string | null {
  const connectionId = req.cookies.get('connection_id')?.value?.trim()
    || req.cookies.get('accountId')?.value?.trim();
  return connectionId || null;
}

export async function GET(req: NextRequest) {
  const connectionId = getConnectionIdFromCookie(req);
  if (!connectionId) {
    return NextResponse.json({ error: 'connection_id cookie required' }, { status: 401 });
  }

  const accountId = await getAccountIdByConnectionId(connectionId);
  if (!accountId) {
    return NextResponse.json({ error: 'connection_id not registered' }, { status: 404 });
  }

  return NextResponse.json(await getPartiesForAccount(accountId), { status: 200 });
}

export async function POST(req: NextRequest) {
  const connectionId = getConnectionIdFromCookie(req);
  if (!connectionId) {
    return NextResponse.json({ error: 'connection_id cookie required' }, { status: 401 });
  }

  const accountId = await getAccountIdByConnectionId(connectionId);
  if (!accountId) {
    return NextResponse.json({ error: 'connection_id not registered' }, { status: 404 });
  }

  const body = await req.json();
  const {
    name,
    type,
    taxinfo,
    contacts = [],
    paymentMethods = [],
  } = body || {};

  if (!name || !type) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  return NextResponse.json(await createPartyForAccount(accountId, {
    name: String(name).trim(),
    type: String(type).trim(),
    taxinfo,
    contacts,
    paymentMethods,
  }), { status: 201 });
}
