'use client';

import { useState } from 'react';
import { Bot, Loader, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { answerFinancialQuestion } from '@/ai/flows/answer-financial-questions';
import { transactions } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export function CommandCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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
        setMessages(prev => prev.slice(0, prev.length -1));
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <>
      <Button variant="outline" onClick={() => setIsOpen(true)}>
        <Bot className="mr-2 h-4 w-4" />
        Command Center
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[625px] h-[70vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Conversational Command Center</DialogTitle>
            <DialogDescription>
              Ask anything about your finances. e.g., "Summarize my spending for July."
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-4 py-4">
              {messages.map((message, index) => (
                <div key={index} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                  {message.role === 'assistant' && <div className="p-1.5 rounded-full bg-accent/20"><Bot className="h-5 w-5 text-accent shrink-0" /></div>}
                  <div className={`rounded-lg px-3 py-2 max-w-[80%] ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>
                    <p className="text-sm">{message.content}</p>
                  </div>
                  {message.role === 'user' && <div className="p-1.5 rounded-full bg-primary/20"><User className="h-5 w-5 text-primary-foreground shrink-0" /></div>}
                </div>
              ))}
              {isLoading && (
                 <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-full bg-accent/20"><Bot className="h-5 w-5 text-accent shrink-0" /></div>
                    <div className="rounded-lg px-3 py-2 bg-card flex items-center">
                        <Loader className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                 </div>
              )}
            </div>
          </ScrollArea>
          <DialogFooter className="mt-4">
            <form onSubmit={handleSubmit} className="w-full">
              <Input
                value={input}
                onChange={handleInputChange}
                placeholder="Ask a question..."
                disabled={isLoading}
                autoComplete="off"
              />
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
