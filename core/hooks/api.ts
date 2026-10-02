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

export type Account = {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  userId: string;
};

export function useTransactionsList(userId?: string, limit?: number, _queryKey?: unknown, assetGroupId?: string) {
  const params = new URLSearchParams();
  if (userId) params.set("userId", userId);
  if (limit) params.set("limit", String(limit));
  if (assetGroupId) params.set("assetGroupId", assetGroupId);
  return useQuery<any[]>(userId ? `/api/transactions?${params}` : null);
}

export function useUserAccounts(userId?: string) {
  return useQuery<Account[]>(userId ? `/api/users/${encodeURIComponent(userId)}/accounts` : null);
}

export function useUserProfile(userId?: string) {
  return useQuery<any>(userId ? `/api/users/${encodeURIComponent(userId)}` : null);
}

export function useParties() {
  return useQuery<any[]>("/api/parties");
}

export function useProjections(userId?: string, status?: string) {
  const params = new URLSearchParams();
  if (userId) params.set("userId", userId);
  if (status) params.set("status", status);
  return useQuery<any[]>(userId ? `/api/projections?${params}` : null);
}

export function useTransactionById(id?: string) {
  return useQuery<any>(id ? `/api/transactions/${encodeURIComponent(id)}` : null);
}

export function useTransactionLines(id?: string) {
  return useQuery<any[]>(id ? `/api/transactions/${encodeURIComponent(id)}/lines` : null);
}

export async function upsertUserProfile(id: string, data: Record<string, unknown>) {
  return requestJson(`/api/users/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function createAccount(userId: string, data: Pick<Account, "name" | "type" | "currency">) {
  return requestJson<Account>(`/api/users/${encodeURIComponent(userId)}/accounts`, {
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

export async function importTransactions(data: { format: "csv" | "json"; content: string; userId: string }) {
  return requestJson<{ created: any[]; failed: any[] }>("/api/transactions/import", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
