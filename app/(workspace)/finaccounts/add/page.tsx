'use client';

/*
::neup.documentation::finaccounts-add-page
::title Fin Accounts Add Page

Creates a new finance account from the `/finaccounts/add` route and returns the
user to the fin accounts list after a successful submit.

::end
*/

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import { Button } from '@neup/components/ui/button';
import { LinkButton } from '@neup/components/ui/link-button';
import { Input } from '@neup/components/ui/input';
import { Label } from '@neup/components/ui/label';
import { SnappyCardSelect, type SnappyCardSelectOption } from '@/components/ui/snappy-card-select';
import { createFinBook, type FinBook } from '@/core/hooks/api';
import { useToast } from '@neup/components/ui/toast';

type AccountType = FinBook['type'];
type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'INR' | 'NPR';

const accountTypeSuggestions: SnappyCardSelectOption<AccountType>[] = [
  { value: 'Bank', label: 'Bank', description: 'General checking or savings accounts.' },
  { value: 'Bank', label: 'Savings Account', description: 'Money kept in a savings account.' },
  { value: 'Bank', label: 'Current Account', description: 'Daily operating bank account.' },
  { value: 'Cash', label: 'Cash', description: 'Physical cash on hand.' },
  { value: 'Cash', label: 'Petty Cash', description: 'Small operational cash balance.' },
  { value: 'Cash', label: 'Wallet Cash', description: 'Cash carried in a wallet or till.' },
  { value: 'Investment', label: 'Investment', description: 'Long-term investment holdings.' },
  { value: 'Investment', label: 'Mutual Fund', description: 'Pooled investment fund balance.' },
  { value: 'Stock', label: 'Stock', description: 'Market-linked equity holdings.' },
  { value: 'Other', label: 'Other', description: 'Any other account type.' },
];

const currencies: SnappyCardSelectOption<CurrencyCode>[] = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'JPY', label: 'JPY - Japanese Yen' },
  { value: 'INR', label: 'INR - Indian Rupee' },
  { value: 'NPR', label: 'NPR - Nepali Rupee' },
];

export default function AddFinAccountPage() {
  const { toast } = useToast();
  const router = useRouter();

  const [accountName, setAccountName] = useState('');
  const [selectedAccountType, setSelectedAccountType] = useState<SnappyCardSelectOption<AccountType> | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<SnappyCardSelectOption<CurrencyCode> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName || !selectedAccountType || !selectedCurrency) return;

    setIsSubmitting(true);

    try {
      await createFinBook({
        name: accountName,
        type: selectedAccountType.value,
        currency: selectedCurrency.value,
      });

      toast({
        name: 'app',
        title: 'Account Created',
        description: `Your ${accountName} account has been created.`,
      });

      router.push('/finaccounts');
    } catch (error) {
      console.error('Error creating account:', error);
      toast({
        name: 'app',
        state: 'error',
        title: 'Error',
        description: 'Could not create account. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (

      <div className="space-y-4">
        <LinkButton href="/finaccounts" variant="ghost" className="w-fit pl-0" preIcon={<ArrowLeft className="mr-2 h-4 w-4" />}>Back to accounts</LinkButton>

        <div className="max-w-2xl space-y-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Create New Account</h1>
            <p className="text-sm text-muted-foreground">
              Add a new cash, bank, or investment account.
            </p>
          </div>

          <form onSubmit={handleAddAccount} className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="accountName">Account Name</Label>
                <Input
                  id="accountName"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="e.g., My Savings"
                  required
                />
              </div>
              <SnappyCardSelect
                inputId="accountType"
                label="Account Type"
                options={accountTypeSuggestions}
                value={selectedAccountType}
                onChange={setSelectedAccountType}
                placeholder="Type to search account types"
                maxCards={5}
                snappy
                required
              />
              <SnappyCardSelect
                inputId="currency"
                label="Currency"
                options={currencies}
                value={selectedCurrency}
                onChange={setSelectedCurrency}
                placeholder="Type to search currencies"
                maxCards={0}
                snappy
                required
              />
            </div>

            <div className="flex items-center justify-end">
              <Button type="submit" disabled={isSubmitting}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Account
              </Button>
            </div>
          </form>
        </div>
      </div>

  );
}
