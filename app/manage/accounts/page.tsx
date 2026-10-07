'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@neup/components/ui/avatar';
import { Skeleton } from '@neup/components/ui/skeleton';

type PlatformAccount = {
  id: string;
  displayName: string;
  neupid: string;
  displayImage: string;
  connection_id: string | null;
};

export default function ManageAccountsPage() {
  const [accounts, setAccounts] = useState<PlatformAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    fetch('/bridge/api.v1/manage/accounts', { credentials: 'include' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
        return data as PlatformAccount[];
      })
      .then((data) => { if (active) setAccounts(data); })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Unable to load accounts.');
      })
      .finally(() => { if (active) setIsLoading(false); });

    return () => { active = false; };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Manage Accounts</h1>
          <p className="text-sm text-muted-foreground">All accounts registered on this platform.</p>
        </div>
        {!isLoading && !error && (
          <span className="rounded-full border px-3 py-1 text-sm text-muted-foreground">
            {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}
          </span>
        )}
      </div>

      <section className="overflow-hidden rounded-lg border bg-card">
        {isLoading ? (
          <div className="divide-y">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="flex items-center gap-3 p-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 p-6 text-sm text-destructive" role="alert">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        ) : accounts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-12 text-center">
            <Users className="h-8 w-8 text-muted-foreground" />
            <p className="font-medium">No accounts found</p>
            <p className="text-sm text-muted-foreground">Platform accounts will appear here.</p>
          </div>
        ) : (
          <ul className="divide-y">
            {accounts.map((account) => {
              const name = account.displayName.trim() || 'Unnamed account';
              return (
                <li key={account.id} className="flex items-center gap-3 p-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={account.displayImage || undefined} alt="" />
                    <AvatarFallback>{name.slice(0, 1).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {account.neupid ? `@${account.neupid}` : account.id}
                    </p>
                  </div>
                  <span className="hidden text-xs text-muted-foreground sm:block">
                    {account.connection_id ? 'Connected' : 'Not connected'}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
