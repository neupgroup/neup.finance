"use client";

import { useEffect, useState } from "react";
import { getApiPath } from '@/core/helpers/app-path';

type QueryResult<T> = { data: T | undefined; isLoading: boolean; error: Error | null };

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const url = new URL(path, typeof window === 'undefined' ? 'http://localhost' : window.location.origin);
  if (typeof window !== 'undefined') {
    const projectId = new URLSearchParams(window.location.search).get('project');
    if (projectId && !url.searchParams.has('project')) url.searchParams.set('project', projectId);
  }
  const requestPath = getApiPath(`${url.pathname}${url.search}`);
  const response = await fetch(requestPath, {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string | { description?: string } } | null;
    const message = typeof body?.error === 'string' ? body.error : body?.error?.description;
    throw new Error(message || `Request failed (${response.status})`);
  }

  return response.json() as Promise<T>;
}

function useQuery<T>(path: string | null): QueryResult<T> {
  const [data, setData] = useState<T>();
  const [isLoading, setIsLoading] = useState(Boolean(path));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;
    if (!path) {
      setData(undefined);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    requestJson<T>(path)
      .then((result) => { if (active) { setData(result); setError(null); } })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason : new Error("Request failed")); })
      .finally(() => { if (active) setIsLoading(false); });

    return () => { active = false; };
  }, [path]);

  return { data, isLoading, error };
}

export type FinBook = {
  id: string;
  name: string;
  type: 'Bank' | 'Cash' | 'Investment' | 'Stock' | 'Other';
  bankName?: string | null;
  branch?: string | null;
  accountType?: string | null;
  balance: number;
  currency: string | null;
  projectId: string;
};

export type FinAccountTransaction = {
  id: string;
  title: string;
  description: string | null;
  finAccountId: string;
  currency: string;
  amount: number;
  direction: 'in' | 'out';
  status: 'draft' | 'active' | 'reviewRequired';
  partyId: string | null;
  party: { id: string; name: string; type: string; taxinfo?: unknown } | null;
  tags: unknown;
  details: Record<string, unknown> | null;
  activityOn: string;
};

export type ProjectOption = { id: string; name: string; roles: string[]; selected: boolean; details?: unknown; account?: { displayName?: string | null; neupid?: string | null } | null };

export function useSelectedProject(projectId?: string) {
  const endpoint = `/bridge/api.v1/projects${projectId ? `?project=${encodeURIComponent(projectId)}` : ''}`;
  const query = useQuery<ProjectOption[]>(endpoint);
  return { ...query, project: query.data?.find((project) => project.selected) ?? (projectId ? query.data?.[0] : undefined) };
}

export function useTransactionsList(limit?: number, assetGroupId?: string) {
  const params = new URLSearchParams();
  if (limit) params.set("limit", String(limit));
  if (assetGroupId) params.set("assetGroupId", assetGroupId);
  return useQuery<any[]>(`/bridge/api.v1/transactions?${params}`);
}

export function useProjectBooks(projectId?: string) {
  const endpoint = `/bridge/api.v1/books${projectId ? `?project=${encodeURIComponent(projectId)}` : ''}`;
  return useQuery<FinBook[]>(endpoint);
}

export function useFinAccountTransactions(accountId?: string, projectId?: string) {
  const endpoint = accountId
    ? `/bridge/api.v1/books/${encodeURIComponent(accountId)}/transactions${projectId ? `?project=${encodeURIComponent(projectId)}` : ''}`
    : null;
  return useQuery<FinAccountTransaction[]>(endpoint);
}

export function useAccountProfile(enabled = true) {
  return useQuery<AccountProfile>(enabled ? '/bridge/api.v1/account' : null);
}

export function useParties(projectId?: string) {
  const endpoint = `/bridge/api.v1/parties${projectId ? `?project=${encodeURIComponent(projectId)}` : ''}`;
  return useQuery<any[]>(endpoint);
}

export function useProjections(status?: string) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  return useQuery<any[]>(`/bridge/api.v1/projections?${params}`);
}

export function useTransactionById(id?: string) {
  return useQuery<any>(id ? `/bridge/api.v1/transactions/${encodeURIComponent(id)}` : null);
}

export function useTransactionLines(id?: string) {
  return useQuery<any[]>(id ? `/bridge/api.v1/transactions/${encodeURIComponent(id)}/lines` : null);
}

export type AccountProfile = {
  id: string;
  aid: string;
  expiry: number | null;
  displayName: string | null;
  displayImage: string | null;
  neupid: string | null;
  project?: { id?: string; name?: string | null } | null;
  roleId?: string | null;
};

export async function ensureAccount() {
  return requestJson<AccountProfile>('/bridge/api.v1/account', {
    method: "PUT",
  });
}

// Ensure the current account exists, then load its accessible project list.
export async function getAccessibleProjects() {
  await ensureAccount();
  return requestJson<ProjectOption[]>('/bridge/api.v1/projects');
}

export async function createProject(name: string) {
  return requestJson<{ id: string; name: string }>('/bridge/api.v1/projects', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function createFinBook(data: Pick<FinBook, "name" | "type" | "currency"> & { bankName?: string; branch?: string; accountType?: 'saving' | 'current' | 'fixed' }) {
  return requestJson<FinBook>('/bridge/api.v1/books', {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function createFinAccountTransaction(accountId: string, data: Pick<FinAccountTransaction, 'title' | 'currency' | 'amount' | 'direction' | 'activityOn'> & Partial<Pick<FinAccountTransaction, 'description' | 'partyId' | 'tags' | 'details'>> & { exchangeRate?: number }) {
  return requestJson<FinAccountTransaction>(`/bridge/api.v1/books/${encodeURIComponent(accountId)}/transactions`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Ask the account transaction intelligence endpoint to extract structured form values.
export async function extractFinAccountTransaction(accountId: string, data: Record<string, string>) {
  return requestJson<{ status: boolean; result: { title?: string | null; description?: string | null; direction?: 'in' | 'out' | null; datetime?: string | null; currency?: string | null; amount?: number | null; receipent?: string | null; tags?: unknown } }>(`/bridge/api.v1/books/${encodeURIComponent(accountId)}/transactions/extract`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Update a transaction using the account-scoped API route.
export async function updateFinAccountTransaction(accountId: string, transactionId: string, data: Pick<FinAccountTransaction, 'title' | 'currency' | 'amount' | 'direction' | 'activityOn'> & Partial<Pick<FinAccountTransaction, 'description' | 'partyId' | 'tags'>>) {
  return requestJson<FinAccountTransaction>(`/bridge/api.v1/books/${encodeURIComponent(accountId)}/transactions/${encodeURIComponent(transactionId)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function createParty(data: Record<string, unknown>) {
  return requestJson<any>("/bridge/api.v1/parties", { method: "POST", body: JSON.stringify(data) });
}

// Extract a party name from name and optional context without saving the context.
export async function extractPartyName(data: { name?: string; information?: string }) {
  return requestJson<{ status: boolean; result: { name: string } }>("/bridge/api.v1/parties/extract", {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function createProjection(data: Record<string, unknown>) {
  return requestJson<any>("/bridge/api.v1/projections", { method: "POST", body: JSON.stringify(data) });
}

export async function createTransaction(data: Record<string, unknown>) {
  return requestJson<any>("/bridge/api.v1/transactions", { method: "POST", body: JSON.stringify(data) });
}

export type DocumentQuotationRecord = {
  id: string;
  counter: number;
  referenceNumber: string;
  subject: string;
  currency: string;
  exchangeRate: number | string;
  subtotal: number | string;
  discountType: string;
  discountValue: number | string;
  discountAmount: number | string;
  taxTotal: number | string;
  hasAdjustments: boolean;
  total: number | string;
  status: string;
  date: string;
  expires: string;
  details: Record<string, unknown> | null;
  customer: { id: string; name: string; type: string };
  items: Array<{
    id: string;
    name: string;
    description: string | null;
    quantity: number | string;
    unit: string;
    rate: number | string;
    discountType: string;
    discountValue: number | string;
    discountAmount: number | string;
    taxRate: number | string;
    taxAmount: number | string;
    amount: number | string;
    sortIndex: number;
  }>;
};

export type DocumentInvoiceRecord = Omit<DocumentQuotationRecord, 'expires'> & { dueDate: string };
export type DocumentProformaRecord = Omit<DocumentQuotationRecord, 'expires'> & { dueDate: string };

type DocumentQuotationResponse = {
  status: boolean;
  result?: DocumentQuotationRecord;
  error?: { code: string; description: string };
};

export async function createDocumentQuotation(data: Record<string, unknown>) {
  const response = await requestJson<DocumentQuotationResponse>('/bridge/api.v1/documents/quotations', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!response.status || !response.result) throw new Error(response.error?.description ?? 'Could not save quotation.');
  return response.result;
}

export function useDocumentQuotation(id: string | null) {
  const query = useQuery<DocumentQuotationResponse>(id ? `/bridge/api.v1/documents/quotations/${encodeURIComponent(id)}` : null);
  return { ...query, quotation: query.data?.result };
}

export function useDocumentQuotations(enabled = true) {
  const query = useQuery<{ status: boolean; result?: DocumentQuotationRecord[] }>(enabled ? '/bridge/api.v1/documents/quotations' : null);
  return { ...query, quotations: query.data?.result ?? [] };
}

export async function createDocumentInvoice(data: Record<string, unknown>) {
  const response = await requestJson<{ status: boolean; result?: DocumentInvoiceRecord; error?: { code: string; description: string } }>('/bridge/api.v1/documents/invoices', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!response.status || !response.result) throw new Error(response.error?.description ?? 'Could not save invoice.');
  return response.result;
}

export function useDocumentInvoice(id: string | null) {
  const query = useQuery<{ status: boolean; result?: DocumentInvoiceRecord }>(id ? `/bridge/api.v1/documents/invoices/${encodeURIComponent(id)}` : null);
  return { ...query, invoice: query.data?.result };
}

export function useDocumentInvoices(enabled = true) {
  const query = useQuery<{ status: boolean; result?: DocumentInvoiceRecord[] }>(enabled ? '/bridge/api.v1/documents/invoices' : null);
  return { ...query, invoices: query.data?.result ?? [] };
}

export async function createDocumentProforma(data: Record<string, unknown>) {
  const response = await requestJson<{ status: boolean; result?: DocumentProformaRecord; error?: { code: string; description: string } }>('/bridge/api.v1/documents/proformas', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!response.status || !response.result) throw new Error(response.error?.description ?? 'Could not save proforma invoice.');
  return response.result;
}

export function useDocumentProforma(id: string | null) {
  const query = useQuery<{ status: boolean; result?: DocumentProformaRecord }>(id ? `/bridge/api.v1/documents/proformas/${encodeURIComponent(id)}` : null);
  return { ...query, proforma: query.data?.result };
}

export function useDocumentProformas(enabled = true) {
  const query = useQuery<{ status: boolean; result?: DocumentProformaRecord[] }>(enabled ? '/bridge/api.v1/documents/proformas' : null);
  return { ...query, proformas: query.data?.result ?? [] };
}

export async function addTransactionLine(id: string, data: Record<string, unknown>) {
  return requestJson<any>(`/bridge/api.v1/transactions/${encodeURIComponent(id)}/lines`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function importTransactions(data: { format: "csv" | "json"; content: string }) {
  return requestJson<{ created: any[]; failed: any[]; totalRows: number }>("/bridge/api.v1/transactions/import", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
