import { NextRequest, NextResponse } from 'next/server';
import { getMcpAuthToken, hasTrustedMcpOrigin } from './auth';
import { executeMcpTool } from './tools/execute';
import { getMcpTools } from './tools/definitions';

const SERVER_INFO = { name: 'neup-finance', version: '1.0.0' };

// Return a JSON-RPC error using the MCP response envelope.
function rpcError(id: unknown, code: number, message: string) {
  return NextResponse.json({ jsonrpc: '2.0', id: id ?? null, error: { code, message } });
}

// Handle MCP initialization, discovery, and tool calls over Streamable HTTP JSON.
export async function handleMcpPost(request: NextRequest) {
  if (!hasTrustedMcpOrigin(request)) return NextResponse.json({ error: 'Forbidden origin' }, { status: 403 });

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
    return NextResponse.json({ jsonrpc: '2.0', id, result: { tools: getMcpTools() } });
  }
  if (method === 'tools/call') {
    const name = typeof params.name === 'string' ? params.name : '';
    const args = params.arguments && typeof params.arguments === 'object' && !Array.isArray(params.arguments)
      ? params.arguments as Record<string, unknown>
      : {};
    try {
      const result = await executeMcpTool(name, args, getMcpAuthToken(request));
      return NextResponse.json({ jsonrpc: '2.0', id, result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Tool execution failed';
      if (message === 'Unauthorized') return rpcError(id, -32001, message);
      return NextResponse.json({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: message }], isError: true } });
    }
  }
  return rpcError(id, -32601, `Method not found: ${method}`);
}
