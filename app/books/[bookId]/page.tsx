'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader, PlusCircle, TrendingDown, TrendingUp } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser } from '@/core/providers/auth';
import { createTransaction, useTransactionsList, useUserAccounts } from '@/core/hooks/api';
import { useToast } from '@/core/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { type TransactionCategory, type TransactionStatus, type TransactionType } from '@/core/lib/mock-data';

const creditTypes = new Set(['sale', 'refund', 'income']);

const transactionTypes: { value: TransactionType; label: string }[] = [
  { value: 'sale', label: 'Sale' },
  { value: 'purchase', label: 'Purchase' },
  { value: 'refund', label: 'Refund' },
  { value: 'expense', label: 'Expense' },
  { value: 'payroll', label: 'Payroll' },
  { value: 'income', label: 'Income' },
  { value: 'other', label: 'Other' },
];

const transactionStatuses: { value: TransactionStatus; label: string }[] = [
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'partially_paid', label: 'Partially paid' },
  { value: 'paid', label: 'Paid' },
  { value: 'canceled', label: 'Canceled' },
];

const categories: { value: TransactionCategory; label: TransactionCategory }[] = [
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
  { value: 'Income', label: 'Income' },
  { value: 'Other', label: 'Other' },
];

const currencies = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'JPY', label: 'JPY - Japanese Yen' },
  { value: 'INR', label: 'INR - Indian Rupee' },
  { value: 'NPR', label: 'NPR - Nepali Rupee' },
];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

export default function BookPage() {
  const params = useParams<{ bookId: string }>();
  const bookId = params.bookId;

  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const { data: accounts, isLoading: areAccountsLoading } = useUserAccounts(user?.uid);
  const { data: transactions, isLoading: areTransactionsLoading } = useTransactionsList(user?.uid, undefined, [bookId], bookId);

  const book = accounts?.find((account) => account.id === bookId);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [transactionType, setTransactionType] = useState<TransactionType | ''>('');
  const [category, setCategory] = useState<TransactionCategory | ''>('');
  const [currency, setCurrency] = useState('');
  const [totalAmount, setTotalAmount] = useState<number | ''>('');
  const [status, setStatus] = useState<TransactionStatus | ''>('');
  const [recipient, setRecipient] = useState('');
  const [dueOn, setDueOn] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (book?.currency) {
      setCurrency(book.currency);
    }
  }, [book?.currency]);

  const handleAddTransaction = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !title || !date || !transactionType || !category || !currency || totalAmount === '' || !status) {
      toast({
        variant: 'destructive',
        title: 'Missing Fields',
        description: 'Please fill out all required fields.',
      });
      return;
    }

    setIsSubmitting(true);

    const total = typeof totalAmount === 'number' ? totalAmount : 0;
    const totalPaid = status === 'paid' ? total : 0;
    const balanceDue = Math.max(total - totalPaid, 0);

    try {
      await createTransaction({
        title,
        description: description || undefined,
        accountId: book?.name || bookId,
        assetGroupId: bookId,
        category,
        transaction_type: transactionType,
        total_amount: total,
        total_paid: totalPaid,
        balance_due: balanceDue,
        status,
        date,
        currency,
        recipient: recipient || undefined,
        due_on: dueOn || undefined,
        userId: user.uid,
      });

      toast({
        title: 'Transaction Added',
        description: `${title} was added to this book.`,
      });

      setTitle('');
      setDescription('');
      setDate('');
      setTransactionType('');
      setCategory('');
      setTotalAmount('');
      setStatus('');
      setRecipient('');
      setDueOn('');
      setIsAddOpen(false);
    } catch (error) {
      console.error('Error creating transaction:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not create transaction. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isUserLoading || areAccountsLoading || areTransactionsLoading;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Button asChild variant="ghost" className="mb-3 pl-0">
              <Link href="/books">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to books
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">
              {book?.name || 'Book'}
            </h1>
            <p className="text-muted-foreground">
              All transactions recorded for this book.
            </p>
          </div>
          <div className="flex flex-col items-end gap-3">
            {book && (
              <Card className="min-w-[220px]">
                <CardHeader className="pb-2">
                  <CardDescription>Current balance</CardDescription>
                  <CardTitle className="text-2xl">
                    {formatCurrency(book.balance, book.currency)}
                  </CardTitle>
                </CardHeader>
              </Card>
            )}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button disabled={!book || isLoading}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Transaction
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[560px]">
                <DialogHeader>
                  <DialogTitle>Add Transaction</DialogTitle>
                  <DialogDescription>
                    Record a transaction against this book.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddTransaction} className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Stock purchase" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional notes" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Select value={currency} onValueChange={setCurrency} required>
                        <SelectTrigger id="currency">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="type">Transaction Type</Label>
                      <Select value={transactionType} onValueChange={(value) => setTransactionType(value as TransactionType)} required>
                        <SelectTrigger id="type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {transactionTypes.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select value={category} onValueChange={(value) => setCategory(value as TransactionCategory)} required>
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount</Label>
                      <Input
                        id="amount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={totalAmount}
                        onChange={(e) => setTotalAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select value={status} onValueChange={(value) => setStatus(value as TransactionStatus)} required>
                        <SelectTrigger id="status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {transactionStatuses.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="recipient">Recipient</Label>
                      <Input id="recipient" value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="Optional recipient" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dueOn">Due On</Label>
                      <Input id="dueOn" type="date" value={dueOn} onChange={(e) => setDueOn(e.target.value)} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Save Transaction
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader className="mr-3 h-6 w-6 animate-spin" />
            <p>Loading transactions...</p>
          </div>
        ) : transactions && transactions.length > 0 ? (
          <div className="space-y-3">
            {transactions.map((transaction) => {
              const isCredit = creditTypes.has(transaction.transaction_type);
              const amount = isCredit ? transaction.total_amount : Math.abs(transaction.total_amount);

              return (
                <Card key={transaction.id}>
                  <CardContent className="flex items-center justify-between gap-4 p-4">
                    <div className="flex items-center gap-4">
                      <div className={`rounded-full p-2 ${isCredit ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                        {isCredit ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="font-semibold">{transaction.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(transaction.date)} · {transaction.category}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                        {isCredit ? '+' : '-'}{formatCurrency(amount, transaction.currency)}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {transaction.transaction_type}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              No transactions found for this book.
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
