
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { CurrencyAmountInput } from '@/components/ui/currency-amount-input';
import { DateChoiceInput } from '@/components/ui/date-choice-input';
import { type Transaction, type TransactionCategory, type TransactionStatus, type TransactionType } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { useUser } from '@/auth/provider';
import { createTransaction } from '@/hooks/api';
import { ArrowLeft, Check, Loader } from 'lucide-react';

const accounts = [
  { value: 'Checking Account', label: 'Checking Account' },
  { value: 'Savings Account', label: 'Savings Account' },
  { value: 'Wallet', label: 'Wallet' },
];

const categories: {value: TransactionCategory, label: TransactionCategory}[] = [
  { value: 'Sales', label: 'Sales' },
  { value: 'Purchases', label: 'Purchases' },
  { value: 'Discounts', label: 'Discounts' },
  { value: 'Payroll', label: 'Payroll' },
  { value: 'Utilities', label: 'Utilities' },
  { value: 'Vendor payments', label: 'Vendor payments' },
  { value: 'EMIs', label: 'EMIs' },
  { value: 'Bank charges', label: 'Bank charges' },
  { value: 'VAT / Tax', label: 'VAT / Tax' },
  { value: 'Transfers', label: 'Transfers' },
  { value: 'Refunds', label: 'Refunds' },
  { value: 'Other', label: 'Other' },
];
const transactionTypes: {value: TransactionType, label: string}[] = [
    {value: 'sale', label: 'Sale'}, 
    {value: 'purchase', label: 'Purchase'}, 
    {value: 'refund', label: 'Refund'}, 
    {value: 'expense', label: 'Expense'}, 
    {value: 'payroll', label: 'Payroll'}, 
    {value: 'income', label: 'Income'},
    {value: 'other', label: 'Other'}
];
const transactionStatuses: {value: TransactionStatus, label: string}[] = [
    {value: 'unpaid', label: 'Unpaid'},
    {value: 'partially_paid', label: 'Partially paid'},
    {value: 'paid', label: 'Paid'},
    {value: 'canceled', label: 'Canceled'}
];

export default function AddTransactionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [showDescription, setShowDescription] = useState(false);
  const [date, setDate] = useState('');
  const [transactionType, setTransactionType] = useState<TransactionType | ''>('');
  const [category, setCategory] = useState<TransactionCategory | ''>('');
  const [totalAmountCurrency, setTotalAmountCurrency] = useState('');
  const [totalAmount, setTotalAmount] = useState<number | ''>('');
  const [status, setStatus] = useState<TransactionStatus | ''>('');
  const [accountId, setAccountId] = useState('');
  const [recipient, setRecipient] = useState('');
  const [amountPaid, setAmountPaid] = useState<number | ''>('');
  const [dueOn, setDueOn] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

    const finalAmountPaid = useMemo(() => {
    const total = typeof totalAmount === 'number' ? totalAmount : 0;
    if (status === 'paid') {
            return total;
    }

        if (status === 'partially_paid') {
            return typeof amountPaid === 'number' ? amountPaid : 0;
        }

        return 0;
    }, [totalAmount, amountPaid, status]);

    const totalAmountValue = typeof totalAmount === 'number' ? totalAmount : 0;
    const balanceDue = useMemo(() => Math.max(totalAmountValue - finalAmountPaid, 0), [totalAmountValue, finalAmountPaid]);

    useEffect(() => {
      if (showDescription) {
        descriptionRef.current?.focus();
      }
    }, [showDescription]);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !transactionType || !category || !totalAmountCurrency || totalAmount === '' || !status || !user) {
      toast({
        variant: "destructive",
        title: "Missing Fields",
        description: "Please fill out all required fields.",
      });
      return;
    }
    if ((status === 'paid' || status === 'partially_paid') && !accountId) {
        toast({
            variant: "destructive",
            title: "Missing Fields",
            description: "Please select an account for paid or partially paid transactions.",
        });
        return;
    }
    
    setIsSubmitting(true);
    let finalAmountPaid = 0;
    if (status === 'paid' && totalAmount) {
        finalAmountPaid = totalAmount;
    } else if (status === 'partially_paid') {
        finalAmountPaid = typeof amountPaid === 'number' ? amountPaid : 0;
    }

    try {
        const newTransaction: Omit<Transaction, 'id' | 'created_at'> = {
            title,
            description,
            accountId: accountId,
            category: category as TransactionCategory,
            transaction_type: transactionType as TransactionType,
            total_amount: totalAmount as number,
            total_paid: finalAmountPaid,
            balance_due: balanceDue,
            status: status as TransactionStatus,
            date,
            currency: totalAmountCurrency,
            recipient,
            due_on: dueOn || undefined,
            // reference_document: attachment || undefined, // Not storing files yet
            userId: user.uid,
        };
        const saved = await createTransaction(newTransaction);
        
        toast({
            title: "Transaction Added",
            description: `A new transaction for ${totalAmountCurrency} ${totalAmount} has been successfully added.`,
        });

        router.push(`/transactions/${saved.id}`);

    } catch (error) {
        console.error("Error adding transaction: ", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not save the transaction. Please try again.",
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="space-y-2">
          <Button asChild variant="ghost" className="w-fit -ml-3 text-muted-foreground hover:text-foreground">
            <Link href="/transactions">
              <ArrowLeft className="h-4 w-4" />
              Back to transactions
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Add Transaction</h1>
            <p className="text-muted-foreground">Fill in the essentials and save.</p>
          </div>
        </div>

        <form onSubmit={handleAddTransaction} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Client payment, office rent, salary"
                required
              />
              {!showDescription && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-fit gap-2"
                  onClick={() => setShowDescription(true)}
                >
                  <Check className="h-4 w-4" />
                  Need description
                </Button>
              )}
            </div>
            {showDescription && (
              <div className="space-y-2">
                <Label htmlFor="description">Description <span className="text-muted-foreground">(Optional)</span></Label>
                <Textarea
                  ref={descriptionRef}
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a short note"
                  rows={3}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient <span className="text-muted-foreground">(Optional)</span></Label>
              <Input id="recipient" value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="e.g., Acme Ltd., John Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <DateChoiceInput value={date} onChange={setDate} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Combobox
                options={transactionTypes}
                value={transactionType}
                onChange={(v) => setTransactionType(v as any)}
                placeholder="Select type"
                searchPlaceholder="Search types..."
                notFoundMessage="No type found."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Combobox
                options={categories}
                value={category}
                onChange={(v) => setCategory(v as any)}
                placeholder="Select category"
                searchPlaceholder="Search categories..."
                notFoundMessage="No category found."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Total amount</Label>
              <CurrencyAmountInput
                id="amount"
                currency={totalAmountCurrency}
                amount={totalAmount}
                onCurrencyChange={setTotalAmountCurrency}
                onAmountChange={setTotalAmount}
                currencyPlaceholder="Type a country name, then press space"
                amountPlaceholder="0.00"
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Combobox
                options={transactionStatuses}
                value={status}
                onChange={(v) => setStatus(v as any)}
                placeholder="Select status"
                searchPlaceholder="Search statuses..."
                notFoundMessage="No status found."
              />
            </div>

            {(status === 'paid' || status === 'partially_paid') && (
              <div className="space-y-2">
                <Label htmlFor="account">Account</Label>
                <Combobox
                  options={accounts}
                  value={accountId}
                  onChange={setAccountId}
                  placeholder="Select account"
                  searchPlaceholder="Search accounts..."
                  notFoundMessage="No account found."
                />
              </div>
            )}

            {status === 'partially_paid' && (
              <div className="space-y-2">
                <Label htmlFor="amount_paid">Amount paid</Label>
                <CurrencyAmountInput
                  id="amount_paid"
                  currency={totalAmountCurrency}
                  amount={amountPaid}
                  onCurrencyChange={setTotalAmountCurrency}
                  onAmountChange={setAmountPaid}
                  currencyPlaceholder="Type a country name, then press space"
                  amountPlaceholder="0.00"
                  placeholder="0.00"
                  required
                />
              </div>
            )}

            {(status === 'unpaid' || status === 'partially_paid') && (
              <div className="space-y-2">
                <Label htmlFor="due_on">Due date <span className="text-muted-foreground">(Optional)</span></Label>
                <Input id="due_on" type="date" value={dueOn} onChange={(e) => setDueOn(e.target.value)} className={!dueOn ? 'text-muted-foreground' : ''} />
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => router.push('/transactions')}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save transaction
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
