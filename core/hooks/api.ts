"use client";

import { useEffect, useState } from "react";

type QueryResult<T> = { data: T | undefined; isLoading: boolean; error: Error | null };

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error || `Request failed (${response.status})`);
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
  const query = useQuery<ProjectOption[]>('/api/projects');
  return { ...query, project: query.data?.find((project) => project.selected) };
}

export function useTransactionsList(limit?: number, assetGroupId?: string) {
  const params = new URLSearchParams();
  if (limit) params.set("limit", String(limit));
  if (assetGroupId) params.set("assetGroupId", assetGroupId);
  return useQuery<any[]>(`/api/transactions?${params}`);
}

export function useProjectBooks() {
  return useQuery<FinBook[]>('/api/books');
}

export function useAccountProfile() {
  return useQuery<any>('/api/account');
}

export function useParties() {
  return useQuery<any[]>("/api/parties");
}

export function useProjections(status?: string) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  return useQuery<any[]>(`/api/projections?${params}`);
}

export function useTransactionById(id?: string) {
  return useQuery<any>(id ? `/api/transactions/${encodeURIComponent(id)}` : null);
}

export function useTransactionLines(id?: string) {
  return useQuery<any[]>(id ? `/api/transactions/${encodeURIComponent(id)}/lines` : null);
}

export async function ensureAccount() {
  return requestJson('/api/account', {
    method: "PUT",
  });
}

export async function createFinBook(data: Pick<FinBook, "name" | "type" | "currency">) {
  return requestJson<FinBook>('/api/books', {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function createParty(data: Record<string, unknown>) {
  return requestJson<any>("/api/parties", { method: "POST", body: JSON.stringify(data) });
}

export async function createProjection(data: Record<string, unknown>) {
  return requestJson<any>("/api/projections", { method: "POST", body: JSON.stringify(data) });
}

export async function createTransaction(data: Record<string, unknown>) {
  return requestJson<any>("/api/transactions", { method: "POST", body: JSON.stringify(data) });
}

export async function addTransactionLine(id: string, data: Record<string, unknown>) {
  return requestJson<any>(`/api/transactions/${encodeURIComponent(id)}/lines`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function importTransactions(data: { format: "csv" | "json"; content: string }) {
  return requestJson<{ created: any[]; failed: any[]; totalRows: number }>("/api/transactions/import", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
