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
import { transactions, type Transaction, type TransactionCategory, type TransactionStatus, type TransactionType } from '@/lib/mock-data';

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


export function AddTransactionDialog() {
  const [open, setOpen] = useState(false);
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
    
    console.log('New Transaction:', newTransaction);
    
    setDescription('');
    setAccountId('');
    setCategory('');
    setTransactionType('');
    setTotalAmount('');
    setDate('');
    setStatus('');
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
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Input id="description" value={description} onChange={e => setDescription(e.target.value)} className="col-span-3" placeholder="e.g., Coffee" required />
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
              <Select onValueChange={(v) => setTransactionType(v as any)} value={transactionType} required>
                <SelectTrigger id="type" className="col-span-3">
                  <SelectValue placeholder="Select transaction type" />
                </SelectTrigger>
                <SelectContent>
                  {transactionTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Select onValueChange={(v) => setCategory(v as any)} value={category} required>
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
              <Input id="amount" type="number" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} className="col-span-3" placeholder="0.00" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select onValueChange={(v) => setStatus(v as any)} value={status} required>
                <SelectTrigger id="status" className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {transactionStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
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
