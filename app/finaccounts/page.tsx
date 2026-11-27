'use client';

/*
::neup.documentation::finaccounts-list-page
::title Fin Accounts List Page

Lists the account records on the `/finaccounts` route and links into account
creation and account detail pages.

::end
*/

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@neup/components/ui/button';
import { Skeleton } from '@neup/components/ui/skeleton';
import { PlusCircle, Landmark, Wallet, Activity, MoreVertical, Inbox } from 'lucide-react';
import { cn } from '@neup/core/utils';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext, PaginationLink } from '@/components/ui/pagination';
import { useFinAccountTransactions, useProjectBooks } from '@/core/hooks/api';
import Link from 'next/link';
import { stackedCardClassName } from '@/components/ui/stacked-card';
import { StackedEmptyStateRow } from '@/components/ui/stacked-empty-state';

const accountTypeIcons = {
  Bank: <Landmark className="h-5 w-5 text-muted-foreground" />,
  Cash: <Wallet className="h-5 w-5 text-muted-foreground" />,
  Investment: <Activity className="h-5 w-5 text-muted-foreground" />,
  Stock: <Activity className="h-5 w-5 text-muted-foreground" />,
  Other: <Activity className="h-5 w-5 text-muted-foreground" />,
};

const ITEMS_PER_PAGE = 10;

// Load account transactions so list balances reflect the account history shown on detail pages.
function AccountBalance({ accountId, currency, fallbackBalance }: { accountId: string; currency: string | null; fallbackBalance: number }) {
  const { data: transactions, isLoading } = useFinAccountTransactions(accountId);
  const balances = transactions
    ? transactions.reduce<Record<string, number>>((totals, transaction) => {
      const details = transaction.details && typeof transaction.details === 'object' ? transaction.details as Record<string, unknown> : null;
      const convertedAmount = Number(details?.accountAmount ?? transaction.amount);
      const amount = transaction.direction === 'in' ? convertedAmount : -convertedAmount;
      const displayCurrency = currency && currency !== 'ALL' ? currency : transaction.currency;
      totals[displayCurrency] = (totals[displayCurrency] ?? 0) + amount;
      return totals;
    }, {})
    : null;
  const balance = transactions ? null : fallbackBalance;
  return (
    <div className="min-w-36 rounded-lg border bg-muted/30 px-4 py-2 text-right">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Current balance</p>
      <p className="font-bold text-xl tabular-nums">
        {isLoading ? 'Loading…' : balances
          ? Object.entries(balances).length
            ? Object.entries(balances).map(([code, amount]) => new Intl.NumberFormat('en-US', { style: 'currency', currency: code, minimumFractionDigits: 2 }).format(amount)).join(' · ')
            : new Intl.NumberFormat('en-US', { style: 'currency', currency: currency ?? 'USD', minimumFractionDigits: 2 }).format(0)
          : new Intl.NumberFormat('en-US', { style: 'currency', currency: currency && currency !== 'ALL' ? currency : 'USD', minimumFractionDigits: 2 }).format(balance ?? 0)}
      </p>
    </div>
  );
}

function AccountCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-between bg-card p-4 ${className}`}>
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="space-y-2 text-right">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-3 w-24 ml-auto" />
        </div>
        <Skeleton className="h-9 w-9 rounded-md" />
      </div>
    </div>
  );
}

export default function FinAccountsPage() {

  const searchParams = useSearchParams();
  const projectId = searchParams.get('project')?.trim();
  const addAccountHref = `/finaccounts/add${projectId ? `?project=${encodeURIComponent(projectId)}` : ''}`;
  const accountDetailHref = (accountId: string) => `/finaccounts/${encodeURIComponent(accountId)}${projectId ? `?project=${encodeURIComponent(projectId)}` : ''}`;
  const { data: accounts, isLoading: areAccountsLoading } = useProjectBooks();
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil((accounts?.length || 0) / ITEMS_PER_PAGE);
  const paginatedAccounts = accounts?.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE) || [];
  const stackedTotal = paginatedAccounts.length > 0 ? paginatedAccounts.length + 1 : 2;

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (

      <div className="space-y-4">
        <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">Your Accounts</h1>
              <p className="text-sm text-muted-foreground">Manage accounts and jump straight into creating a new one.</p>
            </div>
        </div>
         <div className="w-full">
            <div className="overflow-hidden rounded-lg border">
              {areAccountsLoading ? (
                <div className="divide-y">
                  <Link href={addAccountHref} className="block">
                    <div className={stackedCardClassName(0, 4, 'flex items-center justify-between p-4')}>
                      <div className="flex items-center gap-4">
                        <div className="rounded-full bg-muted p-2">
                          <PlusCircle className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-semibold">Create Account</p>
                          <p className="text-sm text-muted-foreground">Add a new cash, bank, or investment account.</p>
                        </div>
                      </div>
                      <Button variant="text" size="icon" className="shrink-0">
                        <PlusCircle className="h-5 w-5" />
                      </Button>
                    </div>
                  </Link>
                  <AccountCardSkeleton className="border-b border-border" />
                  <AccountCardSkeleton className="border-b border-border" />
                  <AccountCardSkeleton className="border-b-0 rounded-b-lg" />
                </div>
              ) : (
                <div className="divide-y">
                  <Link href={addAccountHref} className="block">
                    <div className={stackedCardClassName(0, stackedTotal, 'flex items-center justify-between p-4')}>
                      <div className="flex items-center gap-4">
                        <div className="rounded-full bg-muted p-2">
                          <PlusCircle className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-semibold">Create Account</p>
                          <p className="text-sm text-muted-foreground">Add a new cash, bank, or investment account.</p>
                        </div>
                      </div>
                      <Button variant="text" size="icon" className="shrink-0">
                        <PlusCircle className="h-5 w-5" />
                      </Button>
                    </div>
                  </Link>
                  {paginatedAccounts.length > 0 ? paginatedAccounts.map((account, index) => {
                    return (
                      <Link key={account.id} href={accountDetailHref(account.id)} className="block">
                        <div className={stackedCardClassName(index + 1, stackedTotal, 'flex items-center justify-between p-4')}>
                          <div className="flex items-center gap-4">
                            <div className="rounded-full bg-muted p-2">
                              {accountTypeIcons[account.type]}
                            </div>
                            <div>
                              <p className="font-semibold">{account.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {account.type === 'Bank' && account.bankName
                                  ? `${account.accountType === 'current' ? 'Current Account · ' : ''}${account.bankName}${account.branch ? ` · ${account.branch}` : ''}`
                                  : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <AccountBalance accountId={account.id} currency={account.currency} fallbackBalance={account.balance} />
                            <Button variant="text" size="icon">
                              <MoreVertical className="h-5 w-5" />
                            </Button>
                          </div>
                        </div>
                      </Link>
                    );
                  }) : (
                    <StackedEmptyStateRow
                      icon={Inbox}
                      title="No accounts found"
                      description="Create your first account from the card above."
                      className={stackedCardClassName(1, 2, 'bg-card')}
                    />
                  )}
                </div>
              )}
            </div>
        </div>
        {!areAccountsLoading && totalPages > 1 && (
            <Pagination>
                <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious onClick={() => handlePageChange(currentPage - 1)}
                         className={cn({
                            'cursor-not-allowed text-muted-foreground': currentPage === 1,
                        })}
                        />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <PaginationItem key={page}>
                            <PaginationLink onClick={() => handlePageChange(page)} isActive={currentPage === page}>{page}</PaginationLink>
                        </PaginationItem>
                    ))}
                    <PaginationItem>
                        <PaginationNext onClick={() => handlePageChange(currentPage + 1)} 
                            className={cn({
                                'cursor-not-allowed text-muted-foreground': currentPage === totalPages,
                            })}
                        />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        )}
      </div>

  );
}
