import { getProjectAccessForToken, canAccess } from '@/server/access';
import { ensureAccountRecord } from '@/server/account';
import { getPartiesForAccount } from '@/services/parties';
import { getBooksForProject } from '@/services/books';
import { getTransactionsForProject } from '@/services/transactions/list';
import { getProjectsForAccount } from '@/services/projects';

export type McpToolArguments = Record<string, unknown>;

// Wrap tool data as MCP text content and structured content.
function createToolResult(value: unknown) {
  return { content: [{ type: 'text', text: JSON.stringify(value) }], structuredContent: { items: value } };
}

// Run an existing shared app service after checking account and project access.
export async function executeMcpTool(name: string, args: McpToolArguments, token: string | null) {
  if (!token) throw new Error('Unauthorized');

  if (name === 'list_projects') {
    const account = await ensureAccountRecord(token);
    if (!account) throw new Error('Unauthorized');
    return createToolResult(await getProjectsForAccount(account.id));
  }

  const projectId = typeof args.projectId === 'string' ? args.projectId : undefined;
  const access = await getProjectAccessForToken(token, projectId);
  if (!access) throw new Error('Forbidden: no access to the requested project');

  if (name === 'list_parties') {
    if (!canAccess(access, 'parties.read')) throw new Error('Forbidden: parties.read permission required');
    return createToolResult(await getPartiesForAccount(access.projectId));
  }
  if (name === 'list_books') {
    if (!canAccess(access, 'books.read')) throw new Error('Forbidden: books.read permission required');
    return createToolResult(await getBooksForProject(access.projectId));
  }
  if (name === 'list_transactions') {
    if (!canAccess(access, 'transactions.read')) throw new Error('Forbidden: transactions.read permission required');
    const requestedLimit = Number(args.limit ?? 25);
    const limit = Number.isInteger(requestedLimit) ? Math.min(100, Math.max(1, requestedLimit)) : 25;
    const assetGroupId = typeof args.assetGroupId === 'string' ? args.assetGroupId : undefined;
    return createToolResult(await getTransactionsForProject(access.projectId, { assetGroupId, limit }));
  }

  throw new Error(`Unknown tool: ${name}`);
}
