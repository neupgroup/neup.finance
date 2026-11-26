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
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import { Button } from '@neup/components/ui/button';
import { LinkButton } from '@neup/components/ui/link-button';
import { Input } from '@neup/components/ui/input';
import { Label } from '@neup/components/ui/label';
import { SnappyCardSelect, type SnappyCardSelectOption } from '@/components/ui/snappy-card-select';
import { createFinBook } from '@/core/hooks/api';
import { useToast } from '@neup/core/hooks/useToast';

type AccountType = 'Bank' | 'Cash';
type BankAccountType = 'saving' | 'current' | 'fixed';
type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'INR' | 'NPR';

const accountTypeSuggestions: SnappyCardSelectOption<AccountType>[] = [
  { value: 'Bank', label: 'Bank', description: 'A bank account for your business.' },
  { value: 'Cash', label: 'Cash', description: 'Physical cash on hand.' },
];

const bankAccountTypeOptions: SnappyCardSelectOption<BankAccountType>[] = [
  { value: 'saving', label: 'Saving', description: 'Personal or business savings account.' },
  { value: 'current', label: 'Current', description: 'Everyday business banking account.' },
  { value: 'fixed', label: 'Fixed', description: 'Fixed-term deposit account.' },
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
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project')?.trim();
  const accountListHref = `/finaccounts${projectId ? `?project=${encodeURIComponent(projectId)}` : ''}`;

  const [accountName, setAccountName] = useState('');
  const [selectedAccountType, setSelectedAccountType] = useState<SnappyCardSelectOption<AccountType> | null>(null);
  const [bankName, setBankName] = useState('');
  const [branch, setBranch] = useState('');
  const [selectedBankAccountType, setSelectedBankAccountType] = useState<SnappyCardSelectOption<BankAccountType> | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<SnappyCardSelectOption<CurrencyCode> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const isBank = selectedAccountType?.value === 'Bank';
    if (!accountName.trim() || !selectedAccountType || !selectedCurrency || (isBank && !bankName.trim())) return;

    setIsSubmitting(true);

    try {
      await createFinBook({
        name: accountName,
        type: selectedAccountType.value,
        currency: selectedCurrency.value,
        ...(isBank ? {
          bankName: bankName.trim(),
          branch: branch.trim() || undefined,
          accountType: selectedBankAccountType?.value,
        } : {}),
      });

      toast({
        name: 'app',
        title: 'Account Created',
        description: `Your ${accountName} account has been created.`,
      });

      router.push(accountListHref);
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
        <LinkButton href={accountListHref} variant="text" className="w-fit pl-0" preIcon={<ArrowLeft className="mr-2 h-4 w-4" />}>Back to accounts</LinkButton>

        <div className="max-w-2xl space-y-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Create New Account</h1>
            <p className="text-sm text-muted-foreground">Add a bank or cash account.</p>
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
                onChange={(option) => {
                  setSelectedAccountType(option);
                  if (option?.value !== 'Bank') {
                    setBankName('');
                    setBranch('');
                    setSelectedBankAccountType(null);
                  }
                }}
                placeholder="Type to search account types"
                maxCards={2}
                snappy
                required
              />
              {selectedAccountType?.value === 'Bank' ? (
                <div className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input id="bankName" value={bankName} onChange={(event) => setBankName(event.target.value)} placeholder="e.g., Nepal Investment Mega Bank" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="branch">Branch <span className="text-muted-foreground">(optional)</span></Label>
                    <Input id="branch" value={branch} onChange={(event) => setBranch(event.target.value)} placeholder="e.g., New Road" />
                  </div>
                  <div className="sm:col-span-2">
                    <SnappyCardSelect
                      inputId="bankAccountType"
                      label="Bank Account Type (Optional)"
                      options={bankAccountTypeOptions}
                      value={selectedBankAccountType}
                      onChange={setSelectedBankAccountType}
                      placeholder="Choose saving, current, or fixed"
                      maxCards={3}
                      snappy
                    />
                  </div>
                </div>
              ) : null}
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
