import type { NextRequest } from 'next/server';

// Read authentication credentials supported by browser and MCP clients.
export function getMcpAuthToken(request: NextRequest) {
  const authorization = request.headers.get('authorization');
  const bearer = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  return bearer || request.cookies.get('auth')?.value?.trim() || null;
}

// Reject cross-origin requests to reduce DNS rebinding risks for local clients.
export function hasTrustedMcpOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  return !origin || origin === new URL(request.url).origin;
}
