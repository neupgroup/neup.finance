'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader } from 'lucide-react';
import { createTransactionFromText } from '@/ai/flows/create-transaction-from-text';
import { useToast } from '@/hooks/use-toast';

export function SmartEntry() {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setIsLoading(true);
    try {
      const result = await createTransactionFromText({ text });
      const queryString = new URLSearchParams({ data: JSON.stringify(result) }).toString();
      router.push(`/transactions/review?${queryString}`);
    } catch (error) {
      console.error('AI processing error:', error);
      toast({
        variant: "destructive",
        title: "AI Error",
        description: "Could not process the transaction text. Please try again.",
      });
      setIsLoading(false);
    }
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle>Smart Entry</CardTitle>
        <CardDescription>
          Describe a transaction in plain English, and let AI do the rest.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g., Paid $250 for a flight to NYC from Delta"
            disabled={isLoading}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading || !text.trim()}>
              {isLoading ? (
                <Loader className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Process with AI
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
