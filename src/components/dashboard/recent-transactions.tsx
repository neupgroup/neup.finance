'use client';

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

export function RecentTransactions() {
  const pathname = usePathname();
  const isDashboard = pathname === '/';
  const displayTransactions = isDashboard ? transactions.slice(0, 5) : transactions;
  
  const isCredit = (type: Transaction['transaction_type']) => ['sale', 'refund'].includes(type)

  return (
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
        {displayTransactions.map((transaction) => (
          <TableRow key={transaction.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <div className={cn("p-1.5 rounded-full", isCredit(transaction.transaction_type) ? 'bg-chart-2/20' : 'bg-destructive/20' )}>
                    {isCredit(transaction.transaction_type) ? <ArrowUpRight className="h-4 w-4 text-chart-2" /> : <ArrowDownLeft className="h-4 w-4 text-destructive" />}
                </div>
                <div className="font-medium">{transaction.description}</div>
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
  );
}
