'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { transactions, type Transaction, type TransactionCategory, type TransactionStatus, type TransactionType } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';

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
const transactionTypes: {value: TransactionType, label: TransactionType}[] = [
    {value: 'sale', label: 'Sale'}, 
    {value: 'purchase', label: 'Purchase'}, 
    {value: 'refund', label: 'Refund'}, 
    {value: 'expense', label: 'Expense'}, 
    {value: 'payroll', label: 'Payroll'}, 
    {value: 'other', label: 'Other'}
];
const transactionStatuses: {value: TransactionStatus, label: TransactionStatus}[] = [
    {value: 'unpaid', label: 'Unpaid'},
    {value: 'partially_paid', label: 'Partially Paid'},
    {value: 'paid', label: 'Paid'},
    {value: 'canceled', label: 'Canceled'}
];


export default function AddTransactionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [description, setDescription] = useState('');
  const [accountId, setAccountId] = useState('');
  const [category, setCategory] = useState<TransactionCategory | ''>('');
  const [transactionType, setTransactionType] = useState<TransactionType | ''>('');
  const [totalAmount, setTotalAmount] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState<TransactionStatus | ''>('');

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !accountId || !category || !totalAmount || !date || !transactionType || !status) {
      toast({
        variant: "destructive",
        title: "Missing Fields",
        description: "Please fill out all required fields.",
      });
      return;
    }
    
    const amount = parseFloat(totalAmount);

    const newTransaction: Transaction = {
      id: (transactions.length + 1).toString(),
      description,
      accountId,
      category: category as TransactionCategory,
      transaction_type: transactionType as TransactionType,
      total_amount: amount,
      total_paid: status === 'paid' ? amount : 0,
      balance_due: status === 'paid' ? 0 : amount,
      status: status as TransactionStatus,
      date,
      created_at: new Date().toISOString(),
    };
    
    // In a real app, you'd send this to a server.
    // For now we just log it and show a success toast.
    console.log('New Transaction:', newTransaction);
    
    toast({
      title: "Transaction Added",
      description: `${description} for $${amount} has been successfully added.`,
    });

    router.push('/transactions');
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Add New Transaction</h1>
            <p className="text-muted-foreground">
                Enter the details of your new transaction below.
            </p>
        </div>
        <div className="max-w-xl">
            <form onSubmit={handleAddTransaction} className="grid gap-6">
                <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Input id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g., Coffee" required />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="account">Account</Label>
                        <Combobox
                        options={accounts}
                        value={accountId}
                        onChange={setAccountId}
                        placeholder="Select an account"
                        searchPlaceholder="Search accounts..."
                        notFoundMessage="No account found."
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="type">Type</Label>
                    <Combobox
                        options={transactionTypes}
                        value={transactionType}
                        onChange={(v) => setTransactionType(v as any)}
                        placeholder="Select transaction type"
                        searchPlaceholder="Search types..."
                        notFoundMessage="No type found."
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Combobox
                        options={categories}
                        value={category}
                        onChange={(v) => setCategory(v as any)}
                        placeholder="Select a category"
                        searchPlaceholder="Search categories..."
                        notFoundMessage="No category found."
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input id="amount" type="number" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} placeholder="0.00" required />
                </div>
                <div className="grid gap-2">
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
                <div className="grid gap-2">
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} required className={!date ? 'text-muted-foreground' : ''}/>
                </div>
                <div className="flex justify-start gap-2 mt-4">
                    <Button type="submit">Save Transaction</Button>
                    <Button type="button" variant="outline" onClick={() => router.push('/transactions')}>Cancel</Button>
                </div>
            </form>
        </div>
    </div>
    </AppShell>
  );
}
