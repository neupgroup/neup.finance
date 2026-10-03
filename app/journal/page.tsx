'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { TransactionLineCategory, type Transaction, type TransactionLine } from '@/core/lib/ledger';
import { Loader } from 'lucide-react';
import { useToast } from '@neup/components/ui/toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@neup/components/ui/table';
import { Separator } from '@neup/components/ui/separator';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext, PaginationLink } from '@/components/ui/pagination';
import { cn } from '@neup/core/utils';
import { useUser } from '@/core/providers/auth';
import { useTransactionsList } from '@/core/hooks/api';

type JournalEntry = {
    transaction: Transaction;
    lines: TransactionLine[];
};

const ITEMS_PER_PAGE = 10;


export default function JournalPage() {
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [isLoadingJournal, setIsLoadingJournal] = useState(true);
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const { data: transactions, isLoading: areTransactionsLoading } = useTransactionsList();
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let cancelled = false;

    async function generateJournal() {
      if (!transactions) {
        setIsLoadingJournal(false);
        setJournal([]);
        return;
      }

      try {
        setIsLoadingJournal(true);
        const entries = await Promise.all(
          transactions.map(async (transaction) => {
            const response = await fetch(`/bridge/api.v1/transactions/${transaction.id}/lines`, { cache: 'no-store' });
            if (!response.ok) {
              throw new Error(`Failed to load lines for transaction ${transaction.id}`);
            }

            const lines = (await response.json()) as TransactionLine[];
            return {
              transaction,
              lines,
            };
          })
        );

        entries.forEach(entry => {
            if (entry.lines.length === 0 && entry.transaction.accountId) {
                const isCredit = ['sale', 'income', 'refund'].includes(entry.transaction.transaction_type);
                entry.lines.push({
                    id: `pseudo-${entry.transaction.id ?? 'unknown'}`,
                    transaction_id: entry.transaction.id ?? 'unknown',
                    line_title: entry.transaction.title,
                    category: TransactionLineCategory.SALES,
                    account: entry.transaction.accountId,
                    debit: isCredit ? 0 : entry.transaction.total_amount,
                    credit: isCredit ? entry.transaction.total_amount : 0,
                    currency: entry.transaction.currency,
                });
            }
        });

        if (!cancelled) {
          setJournal(entries.sort((a, b) => new Date(b.transaction.date).getTime() - new Date(a.transaction.date).getTime()));
        }

      } catch (error) {
        console.error('Failed to generate journal entries:', error);
        if (!cancelled) {
          toast({
              name: 'app',
              state: "error",
              title: "Error",
              description: "Could not generate your financial journal at this time.",
          });
        }
      } finally {
        if (!cancelled) {
          setIsLoadingJournal(false);
        }
      }
    }
    generateJournal();
    return () => {
      cancelled = true;
    };
  }, [toast, transactions]);
  
  const totalPages = Math.ceil(journal.length / ITEMS_PER_PAGE);
  const paginatedJournal = journal.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    if (amount === 0) return '-';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount);
  };

  const isLoading = isUserLoading || areTransactionsLoading || isLoadingJournal;

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Financial Journal</h1>
            <p className="text-muted-foreground">A double-entry view of your transactions.</p>
        </div>

        {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader className="mr-3 h-6 w-6 animate-spin" />
            <p>Generating your journal...</p>
            </div>
        ) : (
            <div className="space-y-12">
                {paginatedJournal.map((entry, index) => (
                    <div key={entry.transaction.id}>
                        <div className="flex justify-between items-baseline mb-2">
                            <h3 className="text-xl font-semibold">{entry.transaction.title}</h3>
                            <p className="text-sm text-muted-foreground">{new Date(entry.transaction.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">{entry.transaction.description}</p>
                        
                        <div className="border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Account / Description</TableHead>
                                        <TableHead className="text-right">Debit</TableHead>
                                        <TableHead className="text-right">Credit</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {entry.lines.map((line) => (
                                        <TableRow key={line.id}>
                                            <TableCell>
                                                <p className="font-medium">{line.account}</p>
                                                <p className="text-xs text-muted-foreground">{line.line_title}</p>
                                            </TableCell>
                                            <TableCell className="text-right font-mono">{formatCurrency(line.debit, line.currency)}</TableCell>
                                            <TableCell className="text-right font-mono">{formatCurrency(line.credit, line.currency)}</TableCell>
                                        </TableRow>
                                    ))}
                                    {entry.lines.length > 0 && (
                                    <TableRow className="font-bold bg-muted/50">
                                        <TableCell>Total</TableCell>
                                        <TableCell className="text-right font-mono">
                                            {formatCurrency(entry.lines.reduce((sum, l) => sum + l.debit, 0), entry.transaction.currency)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {formatCurrency(entry.lines.reduce((sum, l) => sum + l.credit, 0), entry.transaction.currency)}
                                        </TableCell>
                                    </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        {index < paginatedJournal.length - 1 && <Separator className="mt-12"/>}
                    </div>
                ))}
                 {totalPages > 1 && (
                    <Pagination className="mt-12">
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
        )}
      </div>
    </AppShell>
  );
}
