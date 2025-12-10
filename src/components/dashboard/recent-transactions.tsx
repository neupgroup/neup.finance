'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { transactions, type Transaction } from '@/lib/mock-data';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext, PaginationLink } from '@/components/ui/pagination';

const ITEMS_PER_PAGE = 10;

export function RecentTransactions() {
  const pathname = usePathname();
  const isDashboard = pathname === '/';
  const allTransactions = React.useMemo(() => transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), []);

  const [currentPage, setCurrentPage] = React.useState(1);

  const displayTransactions = isDashboard ? allTransactions.slice(0, 5) : allTransactions;
  
  const totalPages = Math.ceil(displayTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = displayTransactions.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const isCredit = (type: Transaction['transaction_type']) => ['sale', 'refund', 'income'].includes(type)

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
          {paginatedTransactions.map((transaction) => (
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
          ))}
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
