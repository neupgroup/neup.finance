'use client';

/*
::neup.documentation::transactions-list-page
::function TransactionsPage()

Renders the main transaction list with one summary row per transaction and
shows any saved line items directly underneath each transaction row.

::end
*/

import Link from 'next/link';
import { ArrowDownLeft, ArrowUpRight, Inbox, MoreVertical, PlusCircle, Upload } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@neup/components/ui/button';
import { Badge } from '@neup/components/ui/badge';
import { Skeleton } from '@neup/components/ui/skeleton';
import { cn } from '@neup/core/utils';
import { useTransactionsList } from '@/core/hooks/api';
import { stackedCardClassName } from '@/components/ui/stacked-card';
import { StackedEmptyStateRow } from '@/components/ui/stacked-empty-state';

export default function TransactionsPage() {
  const { data: transactions, isLoading } = useTransactionsList();
  const items = transactions ?? [];
  const stackedTotal = items.length > 0 ? items.length + 1 : 2;

  const isCredit = (type: string) => ['sale', 'refund', 'income'].includes(type);
  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);

  const renderTransactionRow = (transaction: typeof items[number], index: number) => {
    const credit = isCredit(transaction.transaction_type);

    return (
      <div key={transaction.id} className={stackedCardClassName(index + 1, stackedTotal, 'p-4')}>
        <Link href={`/transactions/${transaction.id}`} className="block">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={cn('rounded-full p-2', credit ? 'bg-chart-2/20' : 'bg-destructive/20')}>
                {credit ? (
                  <ArrowUpRight className="h-5 w-5 text-chart-2" />
                ) : (
                  <ArrowDownLeft className="h-5 w-5 text-destructive" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{transaction.title}</p>
                  <Badge variant="outline">{transaction.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {new Date(transaction.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  [{transaction.accountId}]
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className={cn('font-semibold', credit ? 'text-chart-2' : 'text-foreground')}>
                  {credit ? '+' : ''}
                  {formatCurrency(transaction.total_amount, transaction.currency)}
                </p>
              </div>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </Link>
        {transaction.lines?.length ? (
          <div className="ml-14 mt-3 space-y-2">
            {transaction.lines.map((line) => (
              <div key={line.id ?? `${transaction.id}-${line.line_title}`} className="rounded-md border bg-muted/30 px-3 py-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{line.line_title}</p>
                    <p className="text-xs text-muted-foreground">
                      {line.account} [{line.category}]
                    </p>
                    {line.description ? (
                      <p className="mt-1 text-xs text-muted-foreground">{line.description}</p>
                    ) : null}
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {formatCurrency(line.debit > 0 ? line.debit : line.credit, line.currency)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">All Transactions</h1>
          <p className="text-sm text-muted-foreground">
            Review every transaction and jump into the add flow from the first card.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/transactions/import">
              <Upload className="h-4 w-4" />
              Import
            </Link>
          </Button>
          <Button asChild>
            <Link href="/transactions/add">
              <PlusCircle className="h-4 w-4" />
              Add
            </Link>
          </Button>
        </div>

        <div className="w-full">
          {isLoading ? (
            <div className="overflow-hidden rounded-lg border">
              <div className="divide-y">
                <div className={stackedCardClassName(0, 4, 'flex items-center justify-between p-4')}>
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-56" />
                    </div>
                  </div>
                  <Skeleton className="h-9 w-9 rounded-md" />
                </div>
                <div className="flex items-center justify-between border-b border-border bg-card p-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-24" />
                </div>
                <div className="flex items-center justify-between border-b border-border bg-card p-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-3 w-52" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-28" />
                </div>
                <div className="flex items-center justify-between rounded-b-lg border-b-0 bg-card p-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-44" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
            </div>
          ) : items.length > 0 ? (
            <div className="overflow-hidden rounded-lg border">
              <Link href="/transactions/add" className="block">
                <div className={stackedCardClassName(0, stackedTotal, 'flex items-center justify-between p-4')}>
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-muted p-2">
                      <PlusCircle className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold">Add Transaction</p>
                      <p className="text-sm text-muted-foreground">
                        Record incoming or outgoing money.
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <PlusCircle className="h-5 w-5" />
                  </Button>
                </div>
              </Link>
              {items.map((transaction, index) => renderTransactionRow(transaction, index))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <Link href="/transactions/add" className="block">
                <div className={stackedCardClassName(0, 2, 'flex items-center justify-between p-4')}>
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-muted p-2">
                      <PlusCircle className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold">Add Transaction</p>
                      <p className="text-sm text-muted-foreground">
                        Record incoming or outgoing money.
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <PlusCircle className="h-5 w-5" />
                  </Button>
                </div>
              </Link>
              <StackedEmptyStateRow
                icon={Inbox}
                title="No transactions found"
                description="Create your first transaction from the card above."
                className={stackedCardClassName(1, 2, 'bg-card')}
              />
              </div>
          )}
          </div>
        </div>
    </AppShell>
  );
}
