'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, GitCompareArrows } from 'lucide-react';
import { LinkButton } from '@neup/components/ui/link-button';
import { useProjectBooks } from '@/core/hooks/api';
import ReconcileTransactionsClient from './reconcile-transactions-client';

// Provide account context and project-aware navigation for reconciliation.
export default function ReconcileTransactionsPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const accountId = params.id;
  const projectId = searchParams.get('project')?.trim();
  const accountHref = `/finaccounts/${encodeURIComponent(accountId)}${projectId ? `?project=${encodeURIComponent(projectId)}` : ''}`;
  const { data: accounts } = useProjectBooks();
  const account = accounts?.find((entry) => entry.id === accountId);

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-6">
      <div>
        <LinkButton href={accountHref} variant="text" className="mb-3 pl-0" preIcon={<ArrowLeft className="mr-2 h-4 w-4" />}>
          Back to account
        </LinkButton>
        <div className="flex items-center gap-3">
          <GitCompareArrows className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reconcile account</h1>
            <p className="text-muted-foreground">{account?.name ?? 'Account'}{account ? ` · ${account.currency}` : ''}</p>
          </div>
        </div>
      </div>
      <ReconcileTransactionsClient accountId={accountId} accountHref={accountHref} />
    </main>
  );
}
