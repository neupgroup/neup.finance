import { NextRequest, NextResponse } from 'next/server';
import { createPartyForAccount, getPartiesForAccount } from '@/services/parties';
import { getProjectAccess, canAccess } from '@/server/access';

/*
::neup.documentation::api-parties-route
::api GET /api/parties

Lists the current account's parties with contacts, payment methods, and
received or sent payment totals derived from linked transactions.

::api POST /api/parties

Creates a party for the current account and returns the created party record for the id detail route.

::end
*/

export async function GET(req: NextRequest) {
  const access = await getProjectAccess(req);
  if (!access || !canAccess(access, 'parties.read')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json(await getPartiesForAccount(access.projectId), { status: 200 });
}

export async function POST(req: NextRequest) {
  const access = await getProjectAccess(req);
  if (!access || !canAccess(access, 'parties.write')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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

  return NextResponse.json(await createPartyForAccount(access.accountId, access.projectId, {
    name: String(name).trim(),
    type: String(type).trim(),
    taxinfo,
    contacts,
    paymentMethods,
  }), { status: 201 });
}
