'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { transactions, type Transaction, type TransactionCategory, type TransactionStatus, type TransactionType } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';

const accounts = [
  { name: 'Checking Account' },
  { name: 'Savings Account' },
  { name: 'Wallet' },
];

const categories: TransactionCategory[] = [
  'Sales', 'Purchases', 'Discounts', 'Payroll', 'Utilities', 'Vendor payments',
  'EMIs', 'Bank charges', 'VAT / Tax', 'Transfers', 'Refunds', 'Other',
];
const transactionTypes: TransactionType[] = ['sale', 'purchase', 'refund', 'expense', 'payroll', 'other'];
const transactionStatuses: TransactionStatus[] = ['unpaid', 'partially_paid', 'paid', 'canceled'];


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
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Add New Transaction</h1>
            <p className="text-muted-foreground">
                Enter the details of your new transaction below.
            </p>
        </div>
        <form onSubmit={handleAddTransaction}>
        <div className="grid gap-6">
            <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g., Coffee" required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-2">
                    <Label htmlFor="account">Account</Label>
                    <Select onValueChange={setAccountId} value={accountId} required>
                        <SelectTrigger id="account">
                        <SelectValue placeholder="Select an account" />
                        </SelectTrigger>
                        <SelectContent>
                        {accounts.map(acc => <SelectItem key={acc.name} value={acc.name}>{acc.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                    <div className="grid gap-2">
                    <Label htmlFor="type">Type</Label>
                    <Select onValueChange={(v) => setTransactionType(v as any)} value={transactionType} required>
                        <SelectTrigger id="type">
                        <SelectValue placeholder="Select transaction type" />
                        </SelectTrigger>
                        <SelectContent>
                        {transactionTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Select onValueChange={(v) => setCategory(v as any)} value={category} required>
                        <SelectTrigger id="category">
                            <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input id="amount" type="number" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} placeholder="0.00" required />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select onValueChange={(v) => setStatus(v as any)} value={status} required>
                        <SelectTrigger id="status">
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            {transactionStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
                </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
                <Button type="button" variant="outline" onClick={() => router.push('/transactions')}>Cancel</Button>
                <Button type="submit">Save Transaction</Button>
            </div>
        </div>
        </form>
    </div>
    </AppShell>
  );
}
