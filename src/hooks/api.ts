'use client';

import { useEffect, useState } from 'react';
import type { Transaction, TransactionLine, Projection, Party } from '@/lib/mock-data';

export type Account = {
  id?: string;
  name: string;
  type: 'Bank' | 'Cash' | 'Investment' | 'Stock' | 'Other';
  balance: number;
  currency: string;
  userId: string;
};

export function useFetchJson<T>(url: string | null, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!url);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!url) {
        setIsLoading(false);
        setData(null);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (e: any) {
        if (!cancelled) setError(e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, isLoading, error };
}

export function useUserProfile(userId?: string | null) {
  const url = userId ? `/api/users/${userId}` : null;
  return useFetchJson<{ id: string; connection_id: string; displayName: string; neupid: string; displayImage: string }>(url, [userId]);
}

export function useUserAccounts(userId?: string | null) {
  const url = userId ? `/api/users/${userId}/accounts` : null;
  return useFetchJson<Account[]>(url, [userId]);
}

export function useTransactionsList(userId?: string | null, limit?: number, deps: any[] = [], assetGroupId?: string | null) {
  const qs = new URLSearchParams();
  if (userId) qs.set('userId', userId);
  if (limit) qs.set('limit', String(limit));
  if (assetGroupId) qs.set('assetGroupId', assetGroupId);
  const url = userId ? `/api/transactions?${qs.toString()}` : null;
  return useFetchJson<Transaction[]>(url, [userId, limit, assetGroupId, ...deps]);
}

export function useTransactionById(id?: string | null) {
  const url = id ? `/api/transactions/${id}` : null;
  return useFetchJson<Transaction>(url, [id]);
}

export function useTransactionLines(transactionId?: string | null) {
  const url = transactionId ? `/api/transactions/${transactionId}/lines` : null;
  return useFetchJson<TransactionLine[]>(url, [transactionId]);
}

export function useProjections(userId?: string | null, status?: 'Active' | 'Canceled') {
  const qs = new URLSearchParams();
  if (userId) qs.set('userId', userId);
  if (status) qs.set('status', status);
  const url = userId ? `/api/projections?${qs.toString()}` : null;
  return useFetchJson<Projection[]>(url, [userId, status]);
}

export function useParties() {
  return useFetchJson<Party[]>('/api/parties', []);
}

export async function upsertUserProfile(userId: string, payload: { connection_id: string; displayName?: string; neupid?: string; displayImage?: string }) {
  const res = await fetch(`/api/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to save user');
  return res.json();
}

export async function createAccount(userId: string, payload: { name: string; type: Account['type']; currency: string }) {
  const res = await fetch(`/api/users/${userId}/accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create account');
  return res.json();
}

export async function createTransaction(payload: Omit<Transaction, 'id' | 'created_at'> & { assetGroupId?: string }) {
  const res = await fetch(`/api/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create transaction');
  return res.json();
}

export async function addTransactionLine(transactionId: string, payload: Omit<TransactionLine, 'id' | 'transaction_id'>) {
  const res = await fetch(`/api/transactions/${transactionId}/lines`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to add line');
  return res.json();
}

export async function createProjection(payload: Omit<Projection, 'id'>) {
  const res = await fetch(`/api/projections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create projection');
  return res.json();
}

export async function createParty(payload: {
  name: string;
  type: string;
  taxinfo?: unknown;
  contacts?: Array<{ type: string; value: string; details?: unknown }>;
  paymentMethods?: Array<{ type: string; value: string; details?: unknown }>;
}) {
  const res = await fetch('/api/parties', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create party');
  return res.json();
}
