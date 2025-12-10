'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { transactions } from '@/lib/mock-data';
import { generateJournalEntries, type GenerateJournalEntriesOutput } from '@/ai/flows/generate-journal-entries';
import { Loader, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function JournalPage() {
  const [journal, setJournal] = useState<GenerateJournalEntriesOutput['entries']>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchJournal() {
      try {
        const transactionData = JSON.stringify(transactions);
        const result = await generateJournalEntries({ transactions: transactionData });
        setJournal(result.entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
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
    fetchJournal();
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
