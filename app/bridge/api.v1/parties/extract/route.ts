import { NextRequest, NextResponse } from 'next/server';
import { getProjectAccess, canAccess } from '@/server/access';
import { extractPartyName } from '@/services/parties/extract-name';

// Extract the party name from provided text without persisting the extra information.
export async function POST(request: NextRequest) {
  const access = await getProjectAccess(request);
  if (!access || !canAccess(access, 'parties.write')) {
    return NextResponse.json({ error: { code: 'forbidden', description: 'You cannot add parties in this project.' } }, { status: 403 });
  }

  const body = await request.json().catch(() => null) as { name?: unknown; information?: unknown } | null;
  const input = {
    ...(typeof body?.name === 'string' && body.name.trim() ? { name: body.name.trim() } : {}),
    ...(typeof body?.information === 'string' && body.information.trim() ? { information: body.information.trim() } : {}),
  };
  if (!input.name && !input.information) {
    return NextResponse.json({ error: { code: 'missing_input', description: 'Enter a name or additional information to extract.' } }, { status: 400 });
  }

  try {
    const result = await extractPartyName(input);
    return NextResponse.json({ status: true, result });
  } catch (error) {
    return NextResponse.json({ error: { code: 'extraction_failed', description: error instanceof Error ? error.message : 'Could not extract a party name.' } }, { status: 422 });
  }
}
