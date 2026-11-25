'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, FileUp } from 'lucide-react';
import { LinkButton } from '@neup/components/ui/link-button';
import { useProjectBooks } from '@/core/hooks/api';
import ImportTransactionsClient from './import-transactions-client';

// Provide account context and project-aware navigation for the import flow.
export default function ImportTransactionsPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const accountId = params.id;
  const projectId = searchParams.get('project')?.trim();
  const accountHref = `/finaccounts/${encodeURIComponent(accountId)}${projectId ? `?project=${encodeURIComponent(projectId)}` : ''}`;
  const { data: accounts } = useProjectBooks();
  const account = accounts?.find((entry) => entry.id === accountId);

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-4 md:p-6">
      <div>
        <LinkButton href={accountHref} variant="ghost" className="mb-3 pl-0" preIcon={<ArrowLeft className="mr-2 h-4 w-4" />}>
          Back to account
        </LinkButton>
        <div className="flex items-center gap-3">
          <FileUp className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Import transactions</h1>
            <p className="text-muted-foreground">{account?.name ?? 'Account'}{account ? ` · ${account.currency}` : ''}</p>
          </div>
        </div>
      </div>
      <ImportTransactionsClient accountId={accountId} accountCurrency={account?.currency ?? 'USD'} accountHref={accountHref} />
    </main>
  );
}
