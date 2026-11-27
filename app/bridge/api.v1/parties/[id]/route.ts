import { NextRequest, NextResponse } from 'next/server';
import { getProjectAccess, canAccess } from '@/server/access';
import { updatePartyForProject } from '@/services/parties';

// Update a party profile and its contact/payment details for the selected project.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await getProjectAccess(req);
  if (!access || !canAccess(access, 'parties.write')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body.name !== 'string' || !body.name.trim() || typeof body.type !== 'string' || !body.type.trim()) {
    return NextResponse.json({ error: 'A party name and type are required.' }, { status: 400 });
  }

  const party = await updatePartyForProject(access.projectId, id, {
    name: body.name,
    type: body.type,
    taxinfo: body.taxinfo ?? null,
    contacts: Array.isArray(body.contacts) ? body.contacts : [],
    paymentMethods: Array.isArray(body.paymentMethods) ? body.paymentMethods : [],
  });
  if (!party) return NextResponse.json({ error: 'Party not found.' }, { status: 404 });
  return NextResponse.json(party);
}
