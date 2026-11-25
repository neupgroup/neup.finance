import { NextRequest, NextResponse } from 'next/server';
import { getProjectAccessForToken, canAccess } from '@/server/access';
import { ensureAccountRecord } from '@/server/account';
import { getPartiesForAccount } from '@/services/parties';
import { getBooksForProject } from '@/services/books';
import { getTransactionsForProject } from '@/services/transactions/list';
import { getProjectsForAccount } from '@/services/projects';

const SERVER_INFO = { name: 'neup-finance', version: '1.0.0' };

// Return a JSON-RPC error using the MCP response envelope.
function rpcError(id: unknown, code: number, message: string) {
  return NextResponse.json({ jsonrpc: '2.0', id: id ?? null, error: { code, message } });
}

// Read authentication credentials supported by browser and MCP clients.
function getAuthToken(request: NextRequest) {
  const authorization = request.headers.get('authorization');
  const bearer = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  return bearer || request.cookies.get('auth')?.value?.trim() || null;
}

// Reject cross-origin requests to reduce DNS rebinding risks for local clients.
function hasTrustedOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  return !origin || origin === new URL(request.url).origin;
}

// Describe the read-only finance tools available to connected MCP clients.
function getTools() {
  return [
    {
      name: 'list_projects',
      description: 'List active projects available to the authenticated account.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    },
    {
      name: 'list_parties',
      description: 'List parties in an accessible project.',
      inputSchema: { type: 'object', properties: { projectId: { type: 'string', description: 'Optional project UUID; defaults to the first accessible project.' } }, additionalProperties: false },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    },
    {
      name: 'list_books',
      description: 'List financial books in an accessible project.',
      inputSchema: { type: 'object', properties: { projectId: { type: 'string', description: 'Optional project UUID; defaults to the first accessible project.' } }, additionalProperties: false },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    },
    {
      name: 'list_transactions',
      description: 'List recent transactions in an accessible project.',
      inputSchema: { type: 'object', properties: { projectId: { type: 'string', description: 'Optional project UUID; defaults to the first accessible project.' }, assetGroupId: { type: 'string', description: 'Optional book UUID to filter transactions.' }, limit: { type: 'integer', minimum: 1, maximum: 100, default: 25 } }, additionalProperties: false },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    },
  ];
}

// Wrap tool data as MCP text content.
function toolResult(value: unknown) {
  return { content: [{ type: 'text', text: JSON.stringify(value) }], structuredContent: { items: value } };
}

// Run a read-only MCP tool with account and project permission checks.
async function callTool(name: string, args: Record<string, unknown>, token: string | null) {
  if (!token) throw new Error('Unauthorized');

  if (name === 'list_projects') {
    const account = await ensureAccountRecord(token);
    if (!account) throw new Error('Unauthorized');
    return toolResult(await getProjectsForAccount(account.id));
  }

  const projectId = typeof args.projectId === 'string' ? args.projectId : undefined;
  const access = await getProjectAccessForToken(token, projectId);
  if (!access) throw new Error('Forbidden: no access to the requested project');

  if (name === 'list_parties') {
    if (!canAccess(access, 'parties.read')) throw new Error('Forbidden: parties.read permission required');
    return toolResult(await getPartiesForAccount(access.projectId));
  }

  if (name === 'list_books') {
    if (!canAccess(access, 'books.read')) throw new Error('Forbidden: books.read permission required');
    return toolResult(await getBooksForProject(access.projectId));
  }

  if (name === 'list_transactions') {
    if (!canAccess(access, 'transactions.read')) throw new Error('Forbidden: transactions.read permission required');
    const requestedLimit = Number(args.limit ?? 25);
    const limit = Number.isInteger(requestedLimit) ? Math.min(100, Math.max(1, requestedLimit)) : 25;
    const assetGroupId = typeof args.assetGroupId === 'string' ? args.assetGroupId : undefined;
    return toolResult(await getTransactionsForProject(access.projectId, { assetGroupId, limit }));
  }

  throw new Error(`Unknown tool: ${name}`);
}

// Handle MCP initialization, discovery, and tool calls over Streamable HTTP JSON.
export async function POST(request: NextRequest) {
  if (!hasTrustedOrigin(request)) return NextResponse.json({ error: 'Forbidden origin' }, { status: 403 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || body.jsonrpc !== '2.0' || typeof body.method !== 'string') {
    return rpcError(null, -32600, 'Invalid JSON-RPC request');
  }
  const { id, method } = body as { id?: unknown; method: string; params?: Record<string, unknown> };
  const params = (body as { params?: Record<string, unknown> }).params ?? {};

  if (method === 'notifications/initialized' || method === 'notifications/cancelled') {
    return new NextResponse(null, { status: 202 });
  }
  if (method === 'initialize') {
    return NextResponse.json({
      jsonrpc: '2.0', id,
      result: {
        protocolVersion: typeof params.protocolVersion === 'string' ? params.protocolVersion : '2025-03-26',
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions: 'Neup Finance MCP provides authenticated, read-only access to projects, parties, books, and transactions.',
      },
    });
  }
  if (method === 'ping') return NextResponse.json({ jsonrpc: '2.0', id, result: {} });

  if (method === 'tools/list') {
    return NextResponse.json({ jsonrpc: '2.0', id, result: { tools: getTools() } });
  }
  if (method === 'tools/call') {
    const name = typeof params.name === 'string' ? params.name : '';
    const args = params.arguments && typeof params.arguments === 'object' && !Array.isArray(params.arguments)
      ? params.arguments as Record<string, unknown>
      : {};
    try {
      const result = await callTool(name, args, getAuthToken(request));
      return NextResponse.json({ jsonrpc: '2.0', id, result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Tool execution failed';
      const status = message === 'Unauthorized' ? 401 : 403;
      if (status === 401) return rpcError(id, -32001, message);
      return NextResponse.json({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: message }], isError: true } });
    }
  }

  return rpcError(id, -32601, `Method not found: ${method}`);
}

// Advertise POST-only stateless Streamable HTTP transport to clients.
export async function GET() {
  return new NextResponse(null, { status: 405, headers: { Allow: 'POST' } });
}

// Stateless sessions do not retain anything to delete.
export async function DELETE() {
  return new NextResponse(null, { status: 405, headers: { Allow: 'POST' } });
}
