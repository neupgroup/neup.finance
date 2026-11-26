'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { ArrowDownLeft, ArrowLeft, ArrowUpRight, Loader, Pencil } from 'lucide-react';
import { Button } from '@neup/components/ui/button';
import { LinkButton } from '@neup/components/ui/link-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@neup/components/ui/card';
import { useFinAccountTransactions, useProjectBooks } from '@/core/hooks/api';

function formatDate(value: string) {
  return new Date(value).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format(value);
}

// Show the selected transaction with its parent account context.
export default function FinAccountTransactionDetailPage() {
  const params = useParams<{ id: string; transactionId: string }>();
  const searchParams = useSearchParams();
  const accountId = params.id;
  const projectId = searchParams.get('project')?.trim();
  const accountHref = `/finaccounts/${encodeURIComponent(accountId)}${projectId ? `?project=${encodeURIComponent(projectId)}` : ''}`;
  const amendHref = `/finaccounts/${encodeURIComponent(accountId)}/${encodeURIComponent(params.transactionId)}/ammend${projectId ? `?project=${encodeURIComponent(projectId)}` : ''}`;
  const { data: accounts, isLoading: isAccountsLoading } = useProjectBooks();
  const { data: transactions, isLoading: areTransactionsLoading } = useFinAccountTransactions(accountId);
  const account = accounts?.find((entry) => entry.id === accountId);
  const transaction = transactions?.find((entry) => entry.id === params.transactionId);
  const isLoading = isAccountsLoading || areTransactionsLoading;

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 p-4 md:p-6">
      <div>
        <LinkButton href={accountHref} variant="text" className="mb-3 pl-0" preIcon={<ArrowLeft className="mr-2 h-4 w-4" />}>Back to account</LinkButton>
        <p className="text-sm text-muted-foreground">{account?.name ?? 'Account'}</p>
        <h1 className="text-3xl font-bold tracking-tight">Transaction details</h1>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader className="mr-3 h-6 w-6 animate-spin" />Loading transaction...</div>
      ) : transaction ? (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>{transaction.title}</CardTitle>
                <CardDescription>{formatDate(transaction.activityOn)}</CardDescription>
              </div>
              <div className="flex flex-col items-end gap-3">
                <div className={`flex items-center gap-1 font-semibold ${transaction.direction === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                  {transaction.direction === 'in' ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                  {transaction.direction === 'in' ? '+' : '-'}{formatCurrency(transaction.amount, transaction.currency)}
                </div>
                <LinkButton href={amendHref} variant="outlined" size="sm" preIcon={<Pencil className="mr-2 h-4 w-4" />}>Amend</LinkButton>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div><p className="text-sm text-muted-foreground">Direction</p><p className="font-medium">{transaction.direction === 'in' ? 'Money in' : 'Money out'}</p></div>
            {transaction.description ? <div><p className="text-sm text-muted-foreground">Description</p><p className="whitespace-pre-wrap">{transaction.description}</p></div> : null}
            {transaction.party ? <div><p className="text-sm text-muted-foreground">Recipient</p><p className="font-medium">{transaction.party.name}</p></div> : null}
            <div><p className="text-sm text-muted-foreground">Currency</p><p className="font-medium">{transaction.currency}</p></div>
          </CardContent>
        </Card>
      ) : (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Transaction not found in this account.</CardContent></Card>
      )}
    </main>
  );
}
