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

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Transaction</TableHead>
          <TableHead className="hidden sm:table-cell">Category</TableHead>
          <TableHead className="hidden md:table-cell">Date</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {displayTransactions.map((transaction) => (
          <TableRow key={transaction.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <div className={cn("p-1.5 rounded-full", transaction.type === 'credit' ? 'bg-chart-2/20' : 'bg-destructive/20' )}>
                    {transaction.type === 'credit' ? <ArrowUpRight className="h-4 w-4 text-chart-2" /> : <ArrowDownLeft className="h-4 w-4 text-destructive" />}
                </div>
                <div className="font-medium">{transaction.name}</div>
              </div>
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              <Badge variant="outline">{transaction.category}</Badge>
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
                transaction.type === 'credit'
                  ? 'text-chart-2'
                  : 'text-foreground'
              }`}
            >
              {transaction.type === 'credit' ? '+' : ''}$
              {Math.abs(transaction.amount).toLocaleString()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
