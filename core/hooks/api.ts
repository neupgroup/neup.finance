"use client";

import { useEffect, useState } from "react";

type QueryResult<T> = { data: T | undefined; isLoading: boolean; error: Error | null };

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const url = new URL(path, typeof window === 'undefined' ? 'http://localhost' : window.location.origin);
  if (typeof window !== 'undefined') {
    const projectId = new URLSearchParams(window.location.search).get('project');
    if (projectId && !url.searchParams.has('project')) url.searchParams.set('project', projectId);
  }
  const requestPath = typeof window === 'undefined' ? path : `${url.pathname}${url.search}`;
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
  balance: number;
  currency: string;
  projectId: string;
};

export type ProjectOption = { id: string; name: string; roles: string[]; selected: boolean };

export function useSelectedProject() {
  const query = useQuery<ProjectOption[]>('/bridge/api.v1/projects');
  return { ...query, project: query.data?.find((project) => project.selected) };
}

export function useTransactionsList(limit?: number, assetGroupId?: string) {
  const params = new URLSearchParams();
  if (limit) params.set("limit", String(limit));
  if (assetGroupId) params.set("assetGroupId", assetGroupId);
  return useQuery<any[]>(`/bridge/api.v1/transactions?${params}`);
}

export function useProjectBooks() {
  return useQuery<FinBook[]>('/bridge/api.v1/books');
}

export function useAccountProfile(enabled = true) {
  return useQuery<AccountProfile>(enabled ? '/bridge/api.v1/account' : null);
}

export function useParties() {
  return useQuery<any[]>("/bridge/api.v1/parties");
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

export async function createProject(name: string) {
  return requestJson<{ id: string; name: string }>('/bridge/api.v1/projects', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function createFinBook(data: Pick<FinBook, "name" | "type" | "currency">) {
  return requestJson<FinBook>('/bridge/api.v1/books', {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function createParty(data: Record<string, unknown>) {
  return requestJson<any>("/bridge/api.v1/parties", { method: "POST", body: JSON.stringify(data) });
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
