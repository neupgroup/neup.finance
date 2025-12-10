'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { transactions, transactionLines, type Transaction, type TransactionLine } from '@/lib/mock-data';
import { Loader } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';

type JournalEntry = {
    transaction: Transaction;
    lines: TransactionLine[];
};

export default function JournalPage() {
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    function generateJournal() {
      try {
        const entries: JournalEntry[] = transactions.map(transaction => {
            const lines = transactionLines.filter(line => line.transaction_id === transaction.id);
            return {
                transaction,
                lines
            };
        });

        // Add pseudo-entries for transactions without explicit lines for clarity
        entries.forEach(entry => {
            if (entry.lines.length === 0 && entry.transaction.accountId) {
                const isCredit = ['sale', 'income', 'refund'].includes(entry.transaction.transaction_type);
                entry.lines.push({
                    id: `pseudo-${entry.transaction.id}`,
                    transaction_id: entry.transaction.id,
                    line_title: entry.transaction.title,
                    category: 'sales', // Fallback
                    account: entry.transaction.accountId,
                    debit: isCredit ? 0 : entry.transaction.total_amount,
                    credit: isCredit ? entry.transaction.total_amount : 0,
                    currency: entry.transaction.currency,
                });
            }
        });

        setJournal(entries.sort((a, b) => new Date(b.transaction.date).getTime() - new Date(a.transaction.date).getTime()));

      } catch (error) {
        console.error('Failed to generate journal entries:', error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not generate your financial journal at this time.",
        });
      } finally {
        setIsLoading(false);
      }
    }
    generateJournal();
  }, [toast]);
  
  const formatCurrency = (amount: number, currency: string) => {
    if (amount === 0) return '-';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Financial Journal</CardTitle>
            <CardDescription>A double-entry view of your transactions.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader className="mr-3 h-6 w-6 animate-spin" />
                <p>Generating your journal...</p>
              </div>
            ) : (
                <div className="space-y-8">
                    {journal.map((entry) => (
                        <div key={entry.transaction.id} className="p-4 border rounded-lg">
                            <div className="flex justify-between items-baseline mb-2">
                                <h3 className="text-lg font-semibold">{entry.transaction.title}</h3>
                                <p className="text-sm text-muted-foreground">{new Date(entry.transaction.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </div>
                            <p className="text-sm text-muted-foreground mb-4">{entry.transaction.description}</p>
                            
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
                                            <TableCell className="text-right font-mono text-green-500">{formatCurrency(line.credit, line.currency)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                             {entry.lines.length > 0 && (
                                <>
                                 <TableRow className="font-bold">
                                    <TableCell>Total</TableCell>
                                    <TableCell className="text-right font-mono">
                                        {formatCurrency(entry.lines.reduce((sum, l) => sum + l.debit, 0), entry.transaction.currency)}
                                    </TableCell>
                                     <TableCell className="text-right font-mono text-green-500">
                                        {formatCurrency(entry.lines.reduce((sum, l) => sum + l.credit, 0), entry.transaction.currency)}
                                    </TableCell>
                                </TableRow>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
