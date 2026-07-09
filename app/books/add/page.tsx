'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser } from '@/core/providers/auth';
import { createAccount, type Account } from '@/core/hooks/api';
import { useToast } from '@/core/hooks/use-toast';

type AccountType = Account['type'];

const accountTypes: { value: AccountType; label: string; description: string }[] = [
  { value: 'Bank', label: 'Bank', description: 'Checking or savings accounts.' },
  { value: 'Cash', label: 'Cash', description: 'Physical cash or wallets.' },
  { value: 'Investment', label: 'Investment', description: 'Long-term investment accounts.' },
  { value: 'Stock', label: 'Stock', description: 'Market-linked holdings.' },
  { value: 'Other', label: 'Other', description: 'Any other book.' },
];

const currencies = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'JPY', label: 'JPY - Japanese Yen' },
  { value: 'INR', label: 'INR - Indian Rupee' },
  { value: 'NPR', label: 'NPR - Nepali Rupee' },
];

export default function AddBookPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState<AccountType | ''>('');
  const [currency, setCurrency] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName || !accountType || !currency || !user) return;

    setIsSubmitting(true);

    try {
      await createAccount(user.uid, {
        name: accountName,
        type: accountType as AccountType,
        currency,
      });

      toast({
        title: 'Book Created',
        description: `Your ${accountName} book has been created.`,
      });

      router.push('/books');
    } catch (error) {
      console.error('Error creating account:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not create account. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <Button asChild variant="ghost" className="w-fit pl-0">
          <Link href="/books">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to books
          </Link>
        </Button>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Create New Book</CardTitle>
            <CardDescription>
              Add a new cash, bank, or investment book.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleAddAccount}>
            <CardContent className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="accountName">Book Name</Label>
                <Input
                  id="accountName"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="e.g., My Savings"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountType">Book Type</Label>
                <Select onValueChange={(value) => setAccountType(value as AccountType)} value={accountType} required>
                  <SelectTrigger id="accountType">
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent>
                    {accountTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose the category that best matches how the book should behave.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select onValueChange={setCurrency} value={currency} required>
                  <SelectTrigger id="currency">
                    <SelectValue placeholder="Select a currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currencyOption) => (
                      <SelectItem key={currencyOption.value} value={currencyOption.value}>
                        {currencyOption.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="flex items-center justify-end border-t px-6 py-4">
              <Button type="submit" disabled={isSubmitting}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Book
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
