
'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@neup/components/ui/table';
import { Badge } from '@neup/components/ui/badge';
import { type Transaction } from '@/core/lib/ledger';
import { ArrowDownLeft, ArrowUpRight, Loader, MoreVertical } from 'lucide-react';
import { cn } from '@neup/core/utils';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext, PaginationLink } from '@/components/ui/pagination';
import { useTransactionsList } from '@/core/hooks/api';
import { Button } from '@neup/components/ui/button';
import { stackedCardClassName } from '@/components/ui/stacked-card';


const ITEMS_PER_PAGE = 10;

type RecentTransactionsProps = {
  variant?: 'table' | 'stacked';
  stackedStartIndex?: number;
  stackedTotal?: number;
};

export function RecentTransactions({ variant = 'table', stackedStartIndex = 0, stackedTotal }: RecentTransactionsProps) {
  const pathname = usePathname();
  const isDashboard = pathname === '/';
  
  const { data: transactions, isLoading } = useTransactionsList(isDashboard ? 5 : undefined);
  
  const [currentPage, setCurrentPage] = React.useState(1);

  const totalPages = Math.ceil((transactions?.length || 0) / ITEMS_PER_PAGE);
  const paginatedTransactions = isDashboard ? transactions : transactions?.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
  ) || [];
  const visibleTransactions = paginatedTransactions ?? [];

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const isCredit = (type: Transaction['transaction_type']) => ['sale', 'refund', 'income'].includes(type)

  if (isLoading) {
      return (
          <div className="flex items-center justify-center py-12">
              <Loader className="h-6 w-6 animate-spin" />
          </div>
      )
  }

  if (variant === 'stacked' || !isDashboard) {
    const total = stackedTotal ?? visibleTransactions.length;

    return (
      <div className="divide-y">
          {visibleTransactions.length > 0 ? visibleTransactions.map((transaction, index) => {
            const isCredit = ['sale', 'refund', 'income'].includes(transaction.transaction_type);

            return (
              <Link key={transaction.id} href={`/transactions/${transaction.id}`} className="block">
                <div className={stackedCardClassName(index + stackedStartIndex, total, 'flex items-center justify-between p-4')}>
                  <div className="flex items-center gap-4">
                    <div className={cn("p-1.5 rounded-full", isCredit ? 'bg-chart-2/20' : 'bg-destructive/20' )}>
                      {isCredit ? <ArrowUpRight className="h-4 w-4 text-chart-2" /> : <ArrowDownLeft className="h-4 w-4 text-destructive" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium hover:underline">{transaction.title}</p>
                        <Badge variant="outline">{transaction.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {transaction.accountId} · {new Date(transaction.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className={cn("font-semibold", isCredit ? 'text-chart-2' : 'text-foreground')}>
                        {isCredit ? '+' : ''}
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: transaction.currency }).format(transaction.total_amount)}
                      </p>
                    </div>
                    <Button variant="text" size="icon">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </Link>
            );
          }) : (
            <div className="px-4 py-12 text-center text-muted-foreground">
              No transactions found.
            </div>
          )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Transaction</TableHead>
            <TableHead className="hidden sm:table-cell">Account</TableHead>
            <TableHead className="hidden sm:table-cell">Status</TableHead>
            <TableHead className="hidden md:table-cell">Date</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedTransactions && paginatedTransactions.length > 0 ? paginatedTransactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className={cn("p-1.5 rounded-full", isCredit(transaction.transaction_type) ? 'bg-chart-2/20' : 'bg-destructive/20' )}>
                      {isCredit(transaction.transaction_type) ? <ArrowUpRight className="h-4 w-4 text-chart-2" /> : <ArrowDownLeft className="h-4 w-4 text-destructive" />}
                  </div>
                  <Link href={`/transactions/${transaction.id}`} className="font-medium hover:underline">{transaction.title}</Link>
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {transaction.accountId}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <Badge variant="outline">{transaction.status}</Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {new Date(transaction.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </TableCell>
              <TableCell
                className={`text-right font-semibold ${
                  isCredit(transaction.transaction_type)
                    ? 'text-chart-2'
                    : 'text-foreground'
                }`}
              >
                {isCredit(transaction.transaction_type) ? '+' : ''}
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: transaction.currency }).format(transaction.total_amount)}
              </TableCell>
            </TableRow>
          )) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center h-24">No transactions found.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {!isDashboard && totalPages > 1 && (
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
