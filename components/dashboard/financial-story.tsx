'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { summarizeSpending } from '@/ai/flows/summarize-spending';
import { transactions } from '@/lib/mock-data';
import { Loader } from 'lucide-react';

export function FinancialStory() {
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function getSummary() {
      try {
        const spendingData = JSON.stringify(transactions.filter(t => t.transaction_type === 'purchase' || t.transaction_type === 'expense'));
        const result = await summarizeSpending({ spendingData });
        setSummary(result.summary);
      } catch (error) {
        console.error('Failed to get financial story:', error);
        setSummary('Could not generate your financial story at this time.');
      } finally {
        setIsLoading(false);
      }
    }
    getSummary();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Story Mode</CardTitle>
        <CardDescription>Your financial journey, narrated by AI.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Loader className="h-4 w-4 animate-spin" />
            <span>Generating your story...</span>
          </div>
        ) : (
          <p className="text-sm italic text-foreground/80">&ldquo;{summary}&rdquo;</p>
        )}
      </CardContent>
    </Card>
  );
}
