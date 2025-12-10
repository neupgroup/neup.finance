'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { transactions, Transaction } from '@/lib/mock-data';
import { Loader, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type JournalEntry = {
    date: string;
    title: string;
    narrative: string;
};

export default function JournalPage() {
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    function generateJournal() {
      try {
        const groupedByDate = transactions.reduce((acc, transaction) => {
            const date = new Date(transaction.date).toDateString();
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(transaction);
            return acc;
        }, {} as Record<string, Transaction[]>);

        const entries: JournalEntry[] = Object.entries(groupedByDate).map(([dateStr, dailyTransactions]) => {
            const date = new Date(dateStr);
            const formattedDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            
            const totalSpent = dailyTransactions
                .filter(t => t.transaction_type === 'purchase' || t.transaction_type === 'expense')
                .reduce((sum, t) => sum + t.total_amount, 0);
            
            const totalGained = dailyTransactions
                .filter(t => t.transaction_type === 'income' || t.transaction_type === 'sale' || t.transaction_type === 'refund')
                .reduce((sum, t) => sum + t.total_amount, 0);

            let title = `A Day of Transactions`;
            if (totalGained > 0 && totalSpent > 0) {
                title = `A Mixed Day of Income and Expenses`;
            } else if (totalGained > 0) {
                title = `A Profitable Day`;
            } else if (totalSpent > 0) {
                title = `A Day of Spending`;
            }
            
            const narrative = `On this day, you had ${dailyTransactions.length} transaction(s). You spent a total of ${totalSpent.toFixed(2)} and gained ${totalGained.toFixed(2)}. The most notable activities were: ${dailyTransactions.map(t => t.title).slice(0,2).join(', ')}.`;

            return {
                date: formattedDate,
                title,
                narrative
            };
        });

        setJournal(entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

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

  return (
    <AppShell>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Financial Journal</CardTitle>
            <CardDescription>Your financial story, automatically generated from your transactions.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader className="mr-3 h-6 w-6 animate-spin" />
                <p>Generating your journal...</p>
              </div>
            ) : (
                <div className="relative pl-6 before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-border">
                    {journal.map((entry, index) => (
                        <div key={index} className="relative mb-8">
                             <div className="absolute left-[-2.1rem] top-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                <BookOpen className="h-5 w-5" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-muted-foreground">{entry.date}</p>
                                <h3 className="text-xl font-semibold mt-1">{entry.title}</h3>
                                <p className="mt-2 text-foreground/80">{entry.narrative}</p>
                            </div>
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
