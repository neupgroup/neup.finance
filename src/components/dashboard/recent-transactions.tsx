
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
import { type Transaction } from '@/lib/mock-data';
import { ArrowDownLeft, ArrowUpRight, Loader } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext, PaginationLink } from '@/components/ui/pagination';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';


const ITEMS_PER_PAGE = 10;

export function RecentTransactions() {
  const pathname = usePathname();
  const isDashboard = pathname === '/';
  
  const { user } = useUser();
  const firestore = useFirestore();

  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    
    const baseQuery = [
        collection(firestore, 'transactions'),
        where('userId', '==', user.uid),
        orderBy('date', 'desc')
    ];

    if (isDashboard) {
        baseQuery.push(limit(5));
    }

    return query.apply(null, baseQuery as any);

  }, [firestore, user?.uid, isDashboard]);

  const { data: transactions, isLoading } = useCollection<Transaction>(transactionsQuery);
  
  const [currentPage, setCurrentPage] = React.useState(1);

  const totalPages = Math.ceil((transactions?.length || 0) / ITEMS_PER_PAGE);
  const paginatedTransactions = isDashboard ? transactions : transactions?.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
  ) || [];

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
