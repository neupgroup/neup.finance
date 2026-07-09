'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { suggestExpenseOptimizations, type SuggestExpenseOptimizationsOutput } from '@/core/ai/flows/suggest-expense-optimizations';
import { transactions } from '@/core/lib/mock-data';
import { Lightbulb, Loader } from 'lucide-react';

export function ExpenseAutopilot() {
  const [suggestions, setSuggestions] = useState<SuggestExpenseOptimizationsOutput['suggestions']>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function getSuggestions() {
      try {
        const spendingData = JSON.stringify(transactions);
        const financialGoals = "Save for a down payment and reduce monthly subscriptions.";
        const result = await suggestExpenseOptimizations({ spendingData, financialGoals });
        setSuggestions(result.suggestions);
      } catch (error) {
        console.error('Failed to get expense suggestions:', error);
      } finally {
        setIsLoading(false);
      }
    }
    getSuggestions();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense Autopilot</CardTitle>
        <CardDescription>AI-powered suggestions to optimize your spending.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Loader className="h-4 w-4 animate-spin" />
            <span>Scanning for optimizations...</span>
          </div>
        ) : (
          <ul className="space-y-4">
            {suggestions.slice(0, 3).map((item, index) => (
              <li key={index} className="flex gap-4">
                <div className="mt-1 flex-shrink-0">
                    <div className="p-1.5 rounded-full bg-accent/20">
                        <Lightbulb className="h-5 w-5 text-accent"/>
                    </div>
                </div>
                <div>
                  <p className="font-semibold">{item.category}: <span className="text-accent">{item.potentialSavings}</span></p>
                  <p className="text-sm text-muted-foreground">{item.suggestion}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
