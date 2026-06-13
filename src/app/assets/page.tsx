'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, Landmark, Wallet, Activity, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext, PaginationLink } from '@/components/ui/pagination';
import { useUser } from '@/auth/provider';
import { useUserAccounts, type Account } from '@/hooks/api';
import Link from 'next/link';

const accountTypeIcons = {
  Bank: <Landmark className="h-5 w-5 text-muted-foreground" />,
  Cash: <Wallet className="h-5 w-5 text-muted-foreground" />,
  Investment: <Activity className="h-5 w-5 text-muted-foreground" />,
  Stock: <Activity className="h-5 w-5 text-muted-foreground" />,
  Other: <Activity className="h-5 w-5 text-muted-foreground" />,
};

const ITEMS_PER_PAGE = 10;

function AssetCardSkeleton({ className = '' }: { className?: string }) {
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

function getStackItemClasses(index: number, total: number) {
  const isFirst = index === 0;
  const isLast = index === total - 1;

  return cn(
    'flex items-center justify-between border-b border-border bg-card p-4 transition-colors hover:bg-muted/50',
    isFirst && 'rounded-t-lg',
    isLast && 'rounded-b-lg border-b-0'
  );
}

export default function AssetsPage() {
  const { user } = useUser();

  const { data: accounts, isLoading: areAccountsLoading } = useUserAccounts(user?.uid);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil((accounts?.length || 0) / ITEMS_PER_PAGE);
  const paginatedAccounts = accounts?.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE) || [];
  const stackedTotal = paginatedAccounts.length + 1;

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Your Assets</h1>
        </div>
         <div className="mx-auto max-w-4xl">
            <div className="overflow-hidden rounded-lg border">
              {areAccountsLoading ? (
                <div className="divide-y">
                  <Link href="/assets/add" className="block">
                    <div className={getStackItemClasses(0, 4)}>
                      <div className="flex items-center gap-4">
                        <div className="rounded-full bg-muted p-2">
                          <PlusCircle className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-semibold">Create Asset Group</p>
                          <p className="text-sm text-muted-foreground">Add a new cash, bank, or investment asset group.</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="shrink-0">
                        <PlusCircle className="h-5 w-5" />
                      </Button>
                    </div>
                  </Link>
                  <AssetCardSkeleton className="border-b border-border" />
                  <AssetCardSkeleton className="border-b border-border" />
                  <AssetCardSkeleton className="border-b-0 rounded-b-lg" />
                </div>
              ) : (
                <div className="divide-y">
                  <Link href="/assets/add" className="block">
                    <div className={getStackItemClasses(0, stackedTotal)}>
                      <div className="flex items-center gap-4">
                        <div className="rounded-full bg-muted p-2">
                          <PlusCircle className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-semibold">Create Asset Group</p>
                          <p className="text-sm text-muted-foreground">Add a new cash, bank, or investment asset group.</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="shrink-0">
                        <PlusCircle className="h-5 w-5" />
                      </Button>
                    </div>
                  </Link>
                  {paginatedAccounts.map((account, index) => {
                    return (
                      <Link key={account.id} href={`/assets/${account.id}`} className="block">
                        <div className={getStackItemClasses(index + 1, stackedTotal)}>
                          <div className="flex items-center gap-4">
                            <div className="rounded-full bg-muted p-2">
                              {accountTypeIcons[account.type]}
                            </div>
                            <div>
                              <p className="font-semibold">{account.name}</p>
                              <p className="text-sm text-muted-foreground">{account.type} Account</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-semibold text-lg">
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: account.currency, minimumFractionDigits: 2 }).format(account.balance)}
                              </p>
                              <p className="text-sm text-muted-foreground">Current Balance</p>
                            </div>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-5 w-5" />
                            </Button>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
            {!areAccountsLoading && paginatedAccounts.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p>No assets found. Create your first one!</p>
              </div>
            )}
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
    </AppShell>
  );
}
