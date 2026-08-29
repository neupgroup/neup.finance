import type { TransactionPayload } from '@/services/transactions/records';
import {
  createTransactionForOwner,
  validateTransactionPayload,
  type TransactionOwner,
} from '@/services/transactions/create';

/*
::neup.documentation::transaction-import-service
::title Transaction Import Service

Parses CSV or JSON transaction imports into normalized transaction payloads and
creates valid rows with row-level error reporting.

::end
*/

export type TransactionImportFormat = 'csv' | 'json';

export type TransactionImportInput = {
  format: TransactionImportFormat;
  content: string;
  userId: string;
};

export type TransactionImportFailure = {
  row: number;
  title?: string;
  error: string;
};

export type TransactionImportResult = {
  created: Awaited<ReturnType<typeof createTransactionForOwner>>[];
  failed: TransactionImportFailure[];
  totalRows: number;
};

const amountFields = ['total_amount', 'amount', 'final_amount', 'base_amount'];

function getStringValue(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value == null) continue;

    const text = String(value).trim();
    if (text) return text;
  }

  return '';
}

function getNumberValue(row: Record<string, unknown>, keys: string[]) {
  const raw = getStringValue(row, keys);
  if (!raw) return 0;

  const normalized = raw.replace(/,/g, '');
  const value = Number(normalized);
  return Number.isFinite(value) ? value : Number.NaN;
}

function splitCsvLine(line: string) {
  const cells: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      cells.push(cell.trim());
      cell = '';
      continue;
    }

    cell += char;
  }

  cells.push(cell.trim());
  return cells;
}

function parseCsv(content: string) {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return [];
  }

  const headers = splitCsvLine(lines[0]).map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    return headers.reduce<Record<string, unknown>>((row, header, index) => {
      row[header] = cells[index] ?? '';
      return row;
    }, {});
  });
}

function parseJson(content: string) {
  const parsed = JSON.parse(content) as unknown;
  if (Array.isArray(parsed)) {
    return parsed;
  }

  if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { transactions?: unknown }).transactions)) {
    return (parsed as { transactions: unknown[] }).transactions;
  }

  return [];
}

function inferTransactionType(row: Record<string, unknown>, amount: number) {
  const explicitType = getStringValue(row, ['transaction_type', 'transaction_type_id', 'type']);
  if (explicitType) return explicitType;

  const direction = getStringValue(row, ['direction']).toLowerCase();
  if (direction === 'incoming' || direction === 'in' || direction === 'credit') return 'income';
  if (direction === 'outgoing' || direction === 'out' || direction === 'debit') return 'expense';

  return amount >= 0 ? 'income' : 'expense';
}

function mapImportRowToPayload(row: Record<string, unknown>, userId: string): TransactionPayload {
  const amount = getNumberValue(row, amountFields);
  const transactionType = inferTransactionType(row, amount);
  const totalPaid = getNumberValue(row, ['total_paid', 'paid_amount', 'amount_paid']);
  const status = getStringValue(row, ['status']) || 'paid';
  const resolvedTotalPaid = Number.isFinite(totalPaid) && totalPaid > 0
    ? totalPaid
    : (status === 'paid' ? Math.abs(amount) : 0);
  const partyId = getStringValue(row, ['partyId', 'party_id']);
  const partyName = getStringValue(row, ['recipient', 'party', 'party_name']);
  const accountId = getStringValue(row, ['accountId', 'account_id', 'account', 'fin_account']);
  const assetGroupId = getStringValue(row, ['assetGroupId', 'asset_group_id', 'book', 'book_id', 'fin_book']);
  const title = getStringValue(row, ['title', 'name', 'description']) || 'Imported transaction';

  return {
    title,
    description: getStringValue(row, ['description', 'notes']) || undefined,
    transaction_type: transactionType,
    transaction_type_id: transactionType,
    total_amount: Math.abs(amount),
    total_paid: resolvedTotalPaid,
    balance_due: Math.max(Math.abs(amount) - resolvedTotalPaid, 0),
    status,
    date: getStringValue(row, ['date', 'transaction_date', 'transactionDate']),
    currency: getStringValue(row, ['currency']).toUpperCase(),
    category: getStringValue(row, ['category']) || transactionType,
    accountId: accountId || undefined,
    assetGroupId: assetGroupId || undefined,
    partyId: partyId || undefined,
    recipient: partyName || undefined,
    reference_number: getStringValue(row, ['reference_number', 'reference', 'ref']) || undefined,
    external_reference: getStringValue(row, ['external_reference', 'external_ref']) || undefined,
    due_on: getStringValue(row, ['due_on', 'dueDate', 'due_date']) || undefined,
    userId,
    lines: [
      {
        title,
        line_type_id: getStringValue(row, ['line_type_id', 'line_category']) || getStringValue(row, ['category']) || transactionType,
        currency: getStringValue(row, ['currency']).toUpperCase(),
        base_amount: transactionType === 'income' || transactionType === 'sale' || transactionType === 'refund'
          ? Math.abs(amount)
          : -Math.abs(amount),
        fin_account: accountId || undefined,
        fin_book: assetGroupId || undefined,
        reference_type: partyId ? 'party' : undefined,
        reference_id: partyId || undefined,
      },
    ],
  };
}

function parseImportRows(input: TransactionImportInput) {
  if (input.format === 'json') {
    return parseJson(input.content);
  }

  return parseCsv(input.content);
}

export async function importTransactionsForOwner(
  owner: TransactionOwner,
  input: TransactionImportInput
): Promise<TransactionImportResult> {
  const rawRows = parseImportRows(input);
  const created: TransactionImportResult['created'] = [];
  const failed: TransactionImportFailure[] = [];

  for (const [index, rawRow] of rawRows.entries()) {
    const rowNumber = index + 1;

    if (!rawRow || typeof rawRow !== 'object' || Array.isArray(rawRow)) {
      failed.push({ row: rowNumber, error: 'Row must be an object or CSV record.' });
      continue;
    }

    const payload = mapImportRowToPayload(rawRow as Record<string, unknown>, input.userId);
    const validation = validateTransactionPayload(payload);
    if (!validation.isValid || !Number.isFinite(Number(payload.total_amount))) {
      failed.push({
        row: rowNumber,
        title: payload.title,
        error: 'Missing title, date, currency, amount, transaction type, status, or user.',
      });
      continue;
    }

    try {
      created.push(await createTransactionForOwner(owner, payload));
    } catch (error) {
      failed.push({
        row: rowNumber,
        title: payload.title,
        error: error instanceof Error ? error.message : 'Could not import row.',
      });
    }
  }

  return {
    created,
    failed,
    totalRows: rawRows.length,
  };
}
