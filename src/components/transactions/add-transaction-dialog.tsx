'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlusCircle } from 'lucide-react';
import { transactions, type Transaction } from '@/lib/mock-data';

// This is a mock of accounts. In a real app, you'd fetch this.
const accounts = [
  { name: 'Checking Account' },
  { name: 'Savings Account' },
  { name: 'Wallet' },
];

const categories = [
  'Income',
  'Groceries',
  'Utilities',
  'Entertainment',
  'Subscriptions',
  'Software',
  'Travel',
  'Other',
];

export function AddTransactionDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [accountId, setAccountId] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState<'debit' | 'credit' | ''>('');

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !accountId || !category || !amount || !date || !type) {
      // Basic validation
      return;
    }
    const newTransaction: Transaction = {
      id: (transactions.length + 1).toString(),
      name,
      accountId,
      category: category as Transaction['category'],
      amount: type === 'debit' ? -Math.abs(parseFloat(amount)) : Math.abs(parseFloat(amount)),
      date,
      type,
    };
    // In a real app, you would have a state management solution (like Zustand or Context)
    // to update the transactions list globally. For now, we'll just log it.
    console.log('New Transaction:', newTransaction);
    
    // You could potentially add to a local state here if you lift state up.
    // For now, we just close the dialog.

    // Reset form and close dialog
    setName('');
    setAccountId('');
    setCategory('');
    setAmount('');
    setDate('');
    setType('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2" />
          Add Transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Transaction</DialogTitle>
          <DialogDescription>
            Enter the details of your new transaction.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleAddTransaction}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} className="col-span-3" placeholder="e.g., Coffee" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="account" className="text-right">
                Account
              </Label>
              <Select onValueChange={setAccountId} value={accountId} required>
                <SelectTrigger id="account" className="col-span-3">
                  <SelectValue placeholder="Select an account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(acc => <SelectItem key={acc.name} value={acc.name}>{acc.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <Select onValueChange={(v) => setType(v as any)} value={type} required>
                <SelectTrigger id="type" className="col-span-3">
                  <SelectValue placeholder="Select transaction type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="debit">Debit (Expense)</SelectItem>
                  <SelectItem value="credit">Credit (Income)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Select onValueChange={setCategory} value={category} required>
                <SelectTrigger id="category" className="col-span-3">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <Input id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} className="col-span-3" placeholder="0.00" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Date
              </Label>
              <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} className="col-span-3" required />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Save Transaction</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
