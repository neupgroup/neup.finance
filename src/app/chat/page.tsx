'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, Loader, User } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { answerFinancialQuestion } from '@/ai/flows/answer-financial-questions';
import { transactions } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function ChatPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setInput('');

    try {
        const financialData = JSON.stringify(transactions);
        const result = await answerFinancialQuestion({ question: input, financialData });

        const assistantMessage: Message = { role: 'assistant', content: result.answer };
        setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
        console.error('AI error:', error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to get a response from the AI.",
        });
        // Remove the user message that failed to get a response
        setMessages(prev => prev.slice(0, prev.length -1));
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);
  

  return (
    <AppShell>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        <Card className="flex-1 flex flex-col">
            <CardHeader>
                <CardTitle>Conversational Command Center</CardTitle>
                <CardDescription>
                Ask anything about your finances. e.g., "Summarize my spending for July."
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4">
                <ScrollArea className="flex-1" ref={scrollAreaRef}>
                <div className="space-y-4 py-4 pr-4">
                    {messages.map((message, index) => (
                    <div key={index} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                        {message.role === 'assistant' && <div className="p-1.5 rounded-full bg-accent/20"><Bot className="h-5 w-5 text-accent shrink-0" /></div>}
                        <div className={`rounded-lg px-3 py-2 max-w-[80%] ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card border'}`}>
                        <p className="text-sm">{message.content}</p>
                        </div>
                        {message.role === 'user' && <div className="p-1.5 rounded-full bg-primary/20"><User className="h-5 w-5 text-primary shrink-0" /></div>}
                    </div>
                    ))}
                    {isLoading && (
                    <div className="flex items-start gap-3">
                        <div className="p-1.5 rounded-full bg-accent/20"><Bot className="h-5 w-5 text-accent shrink-0" /></div>
                        <div className="rounded-lg px-3 py-2 bg-card flex items-center border">
                            <Loader className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    </div>
                    )}
                </div>
                </ScrollArea>
                <form onSubmit={handleSubmit} className="w-full">
                <Input
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Ask a question..."
                    disabled={isLoading}
                    autoComplete="off"
                />
                </form>
            </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
