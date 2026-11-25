import { NextRequest, NextResponse } from 'next/server';
import { handleMcpPost } from './lib/protocol';

// Handle MCP JSON-RPC requests at the configured HTTP endpoint.
export async function POST(request: NextRequest) {
  return handleMcpPost(request);
}

// Advertise POST-only stateless Streamable HTTP transport to clients.
export async function GET() {
  return new NextResponse(null, { status: 405, headers: { Allow: 'POST' } });
}

// Stateless sessions do not retain anything to delete.
export async function DELETE() {
  return new NextResponse(null, { status: 405, headers: { Allow: 'POST' } });
}
