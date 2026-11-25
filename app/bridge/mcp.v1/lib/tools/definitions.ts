// Describe the read-only finance tools available to connected MCP clients.
export function getMcpTools() {
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
      inputSchema: {
        type: 'object',
        properties: {
          projectId: { type: 'string', description: 'Optional project UUID; defaults to the first accessible project.' },
          assetGroupId: { type: 'string', description: 'Optional book UUID to filter transactions.' },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 25 },
        },
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    },
  ];
}
