import { Prisma } from '@prisma/client';

/*
::neup.documentation::transaction-record-helpers
::title Transaction Record Helpers

Normalizes transaction payloads, computes `final_amount` from line rows, and
serializes the new storage models back into the ledger API shape.

::end
*/

const CREDIT_TRANSACTION_TYPE_IDS = new Set(['sale', 'refund', 'income']);

export type TransactionCompatibilityDetails = {
  accountId?: string;
  assetGroupId?: string;
  balance_due?: number;
  category?: string;
  due_on?: string;
  partyId?: string;
  recipient?: string;
  reference_document?: string;
  total_paid?: number;
};

export type TransactionLinePayload = {
  line_type_id?: string;
  title?: string;
  line_title?: string;
  description?: string;
  reference_type?: string;
  reference_id?: string;
  currency?: string;
  base_amount?: number;
  sort_order?: number;
  metadata?: unknown;
  fin_book?: string;
  fin_account?: string;
  tags?: unknown;
  details?: unknown;
  category?: string;
  account?: string;
  debit?: number;
  credit?: number;
};

export type TransactionPayload = {
  title?: string;
  description?: string;
  transaction_type_id?: string;
  transaction_type?: string;
  transaction_date?: string;
  date?: string;
  status?: string;
  reference_number?: string;
  external_reference?: string;
  currency?: string;
  final_amount?: number;
  total_amount?: number;
  created_by?: string;
  userId?: string;
  tags?: unknown;
  notes?: unknown;
  details?: unknown;
  accountId?: string;
  assetGroupId?: string;
  category?: string;
  total_paid?: number;
  balance_due?: number;
  recipient?: string;
  partyId?: string;
  due_on?: string;
  reference_document?: string;
  lines?: TransactionLinePayload[];
};

export function isCreditTransactionTypeId(transactionTypeId: string) {
  return CREDIT_TRANSACTION_TYPE_IDS.has(transactionTypeId);
}

export function toDecimal(value: number | string | Prisma.Decimal | null | undefined) {
  return new Prisma.Decimal(Number(value ?? 0));
}

export function parseTransactionCompatibilityDetails(details: unknown): TransactionCompatibilityDetails {
  if (!details || typeof details !== 'object' || Array.isArray(details)) {
    return {};
  }

  const raw = details as Record<string, unknown>;
  return {
    accountId: typeof raw.accountId === 'string' ? raw.accountId : undefined,
    assetGroupId: typeof raw.assetGroupId === 'string' ? raw.assetGroupId : undefined,
    balance_due: typeof raw.balance_due === 'number' ? raw.balance_due : undefined,
    category: typeof raw.category === 'string' ? raw.category : undefined,
    due_on: typeof raw.due_on === 'string' ? raw.due_on : undefined,
    partyId: typeof raw.partyId === 'string' ? raw.partyId : undefined,
    recipient: typeof raw.recipient === 'string' ? raw.recipient : undefined,
    reference_document: typeof raw.reference_document === 'string' ? raw.reference_document : undefined,
    total_paid: typeof raw.total_paid === 'number' ? raw.total_paid : undefined,
  };
}

export function buildTransactionCompatibilityDetails(payload: TransactionPayload): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
  const details = {
    ...(payload.details && typeof payload.details === 'object' && !Array.isArray(payload.details)
      ? (payload.details as Record<string, unknown>)
      : {}),
    ...(payload.accountId ? { accountId: payload.accountId } : {}),
    ...(payload.assetGroupId ? { assetGroupId: payload.assetGroupId } : {}),
    ...(payload.category ? { category: payload.category } : {}),
    ...(payload.total_paid != null ? { total_paid: Number(payload.total_paid) } : {}),
    ...(payload.balance_due != null ? { balance_due: Number(payload.balance_due) } : {}),
    ...(payload.recipient ? { recipient: payload.recipient } : {}),
    ...(payload.partyId ? { partyId: payload.partyId } : {}),
    ...(payload.due_on ? { due_on: payload.due_on } : {}),
    ...(payload.reference_document ? { reference_document: payload.reference_document } : {}),
  };

  return Object.keys(details).length > 0 ? (details as Prisma.InputJsonValue) : undefined;
}

export function getSignedTransactionAmount(transactionTypeId: string, amount: number) {
  return isCreditTransactionTypeId(transactionTypeId) ? Math.abs(amount) : -Math.abs(amount);
}

export function normalizeTransactionLines(
  payload: TransactionPayload,
  defaultCurrency: string
): Array<{
  lineTypeId: string | null;
  title: string;
  description: string | null;
  referenceType: string | null;
  referenceId: string | null;
  currency: string;
  baseAmount: Prisma.Decimal;
  sortOrder: number;
  metadata: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined;
  finBook: string | null;
  finAccount: string | null;
  tags: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined;
  details: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined;
}> {
  const transactionTypeId = String(payload.transaction_type_id ?? payload.transaction_type ?? 'other');
  const inputLines = Array.isArray(payload.lines) ? payload.lines : [];

  if (inputLines.length === 0) {
    const amount = Number(payload.final_amount ?? payload.total_amount ?? 0);
    return [{
      lineTypeId: String((payload.category ?? transactionTypeId) || 'line'),
      title: String(payload.title ?? 'Transaction'),
      description: payload.description ? String(payload.description) : null,
      referenceType: payload.partyId ? 'party' : null,
      referenceId: payload.partyId ? String(payload.partyId) : null,
      currency: defaultCurrency,
      baseAmount: toDecimal(getSignedTransactionAmount(transactionTypeId, amount)),
      sortOrder: 0,
      metadata: undefined,
      finBook: payload.assetGroupId ? String(payload.assetGroupId) : null,
      finAccount: payload.accountId ? String(payload.accountId) : null,
      tags: undefined,
      details: undefined,
    }];
  }

  return inputLines.map((line, index) => {
    const debit = Number(line.debit ?? 0);
    const credit = Number(line.credit ?? 0);
    const providedBase = line.base_amount;
    const baseAmount = typeof providedBase === 'number'
      ? providedBase
      : credit !== 0
        ? Math.abs(credit)
        : debit !== 0
          ? -Math.abs(debit)
          : 0;

    return {
      lineTypeId: line.line_type_id
        ? String(line.line_type_id)
        : line.category
          ? String(line.category)
          : null,
      title: String(line.title ?? line.line_title ?? `Line ${index + 1}`),
      description: line.description ? String(line.description) : null,
      referenceType: line.reference_type ? String(line.reference_type) : null,
      referenceId: line.reference_id ? String(line.reference_id) : null,
      currency: String(line.currency ?? defaultCurrency),
      baseAmount: toDecimal(baseAmount),
      sortOrder: Number(line.sort_order ?? index),
      metadata: line.metadata == null ? undefined : (line.metadata as Prisma.InputJsonValue),
      finBook: line.fin_book ? String(line.fin_book) : null,
      finAccount: line.fin_account
        ? String(line.fin_account)
        : line.account
          ? String(line.account)
          : null,
      tags: line.tags == null ? undefined : (line.tags as Prisma.InputJsonValue),
      details: line.details == null ? undefined : (line.details as Prisma.InputJsonValue),
    };
  });
}

export function computeTransactionFinalAmount(
  lines: Array<{ baseAmount: Prisma.Decimal | number }>
) {
  return lines.reduce((sum, line) => sum + Number(line.baseAmount), 0);
}

export function serializeTransactionLine(line: {
  id: string;
  transactionId: string;
  lineTypeId: string | null;
  title: string;
  description: string | null;
  referenceType: string | null;
  referenceId: string | null;
  currency: string;
  baseAmount: Prisma.Decimal | number;
  sortOrder: number;
  metadata: unknown;
  finBook: string | null;
  finAccount: string | null;
  tags: unknown;
  details: unknown;
}) {
  const baseAmount = Number(line.baseAmount);

  return {
    id: line.id,
    transaction_id: line.transactionId,
    transactionId: line.transactionId,
    line_type_id: line.lineTypeId ?? undefined,
    title: line.title,
    line_title: line.title,
    description: line.description ?? undefined,
    reference_type: line.referenceType ?? undefined,
    reference_id: line.referenceId ?? undefined,
    currency: line.currency,
    base_amount: baseAmount,
    sort_order: line.sortOrder,
    metadata: line.metadata ?? undefined,
    fin_book: line.finBook ?? undefined,
    fin_account: line.finAccount ?? undefined,
    tags: line.tags ?? undefined,
    details: line.details ?? undefined,
    category: line.lineTypeId ?? undefined,
    account: line.finAccount ?? undefined,
    debit: baseAmount < 0 ? Math.abs(baseAmount) : 0,
    credit: baseAmount > 0 ? baseAmount : 0,
  };
}

export function serializeTransactionRecord(
  transaction: {
    id: string;
    organizationId: string;
    transactionTypeId: string;
    title: string;
    description: string | null;
    transactionDate: Date;
    status: string;
    referenceNumber: string | null;
    externalReference: string | null;
    currency: string;
    finalAmount: Prisma.Decimal | number;
    createdBy: string | null;
    createdAt: Date;
    tags: unknown;
    notes: unknown;
    details: unknown;
    lines?: Array<{
      id: string;
      transactionId: string;
      lineTypeId: string | null;
      title: string;
      description: string | null;
      referenceType: string | null;
      referenceId: string | null;
      currency: string;
      baseAmount: Prisma.Decimal | number;
      sortOrder: number;
      metadata: unknown;
      finBook: string | null;
      finAccount: string | null;
      tags: unknown;
      details: unknown;
    }>;
  },
  options?: {
    party?: { id: string; name: string; type: string } | null;
  }
) {
  const details = parseTransactionCompatibilityDetails(transaction.details);
  const finalAmount = Number(transaction.finalAmount);
  const totalPaid = Number(details.total_paid ?? (transaction.status === 'paid' ? finalAmount : 0));
  const balanceDue = Number(details.balance_due ?? Math.max(finalAmount - totalPaid, 0));

  return {
    id: transaction.id,
    organization_id: transaction.organizationId,
    transaction_type_id: transaction.transactionTypeId,
    title: transaction.title,
    description: transaction.description ?? undefined,
    transaction_date: transaction.transactionDate.toISOString(),
    status: transaction.status,
    reference_number: transaction.referenceNumber ?? undefined,
    external_reference: transaction.externalReference ?? undefined,
    currency: transaction.currency,
    final_amount: finalAmount,
    created_by: transaction.createdBy ?? undefined,
    created_at: transaction.createdAt.toISOString(),
    tags: transaction.tags ?? undefined,
    notes: transaction.notes ?? undefined,
    details: transaction.details ?? undefined,
    lines: transaction.lines?.map(serializeTransactionLine),
    party: options?.party ?? undefined,
    accountId: details.accountId ?? transaction.organizationId,
    assetGroupId: details.assetGroupId,
    category: details.category ?? transaction.transactionTypeId,
    transaction_type: transaction.transactionTypeId,
    total_amount: finalAmount,
    total_paid: totalPaid,
    balance_due: balanceDue,
    date: transaction.transactionDate.toISOString(),
    recipient: details.recipient ?? options?.party?.name ?? undefined,
    partyId: details.partyId ?? options?.party?.id ?? undefined,
    due_on: details.due_on,
    reference_document: details.reference_document,
    userId: transaction.createdBy ?? undefined,
  };
}
