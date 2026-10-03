'use client';

/*
::neup.documentation::finaccounts-detail-page
::title Fin Accounts Detail Page

Shows one finance account at `/finaccounts/:id` and records
transactions against that selected account.

::end
*/

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader, PlusCircle, TrendingDown, TrendingUp } from 'lucide-react';
import { Button } from '@neup/components/ui/button';
import { LinkButton } from '@neup/components/ui/link-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@neup/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@neup/components/ui/dialog';
import { Input } from '@neup/components/ui/input';
import { Label } from '@neup/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@neup/components/ui/select';
import { useUser } from '@/core/providers/auth';
import { createTransaction, useTransactionsList, useProjectBooks } from '@/core/hooks/api';
import { useToast } from '@neup/components/ui/toast';
import { Textarea } from '@neup/components/ui/textarea';
import {
  currencyOptions,
  isCreditTransactionType,
  transactionCategoryOptions,
  transactionStatusOptions,
  transactionTypeOptions,
  type TransactionCategory,
  type TransactionStatus,
  type TransactionType,
} from '@/core/lib/ledger';

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

export default function FinAccountPage() {
  const params = useParams<{ id: string }>();
  const finAccountId = params.id;

  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const { data: accounts, isLoading: areAccountsLoading } = useProjectBooks();
  const { data: transactions, isLoading: areTransactionsLoading } = useTransactionsList(undefined, finAccountId);

  const finAccount = accounts?.find((account) => account.id === finAccountId);
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
    if (finAccount?.currency) {
      setCurrency(finAccount.currency);
    }
  }, [finAccount?.currency]);

  const handleAddTransaction = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !title || !date || !transactionType || !category || !currency || totalAmount === '' || !status) {
      toast({
        name: 'app',
        state: 'error',
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
        accountId: finAccount?.name || finAccountId,
        assetGroupId: finAccountId,
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
        name: 'app',
        title: 'Transaction Added',
        description: `${title} was added to this account.`,
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
        name: 'app',
        state: 'error',
        title: 'Error',
        description: 'Could not create transaction. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isUserLoading || areAccountsLoading || areTransactionsLoading;

  return (

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <LinkButton href="/finaccounts" variant="ghost" className="mb-3 pl-0 flex items-center gap-1 text-sm text-muted-foreground hover:text-primary" preIcon={<ArrowLeft className="mr-2 h-4 w-4" />}>Back to accounts</LinkButton>
            <h1 className="text-3xl font-bold tracking-tight">
              {finAccount?.name || 'Account'}
            </h1>
            <p className="text-muted-foreground">
              All transactions recorded for this account.
            </p>
          </div>
          <div className="flex flex-col items-end gap-3">
            {finAccount && (
              <Card className="min-w-[220px]">
                <CardHeader className="pb-2">
                  <CardDescription>Current balance</CardDescription>
                  <CardTitle className="text-2xl">
                    {formatCurrency(finAccount.balance, finAccount.currency)}
                  </CardTitle>
                </CardHeader>
              </Card>
            )}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button disabled={!finAccount || isLoading}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Transaction
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[560px]">
                <DialogHeader>
                  <DialogTitle>Add Transaction</DialogTitle>
                  <DialogDescription>
                    Record a transaction against this account.
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
                          {currencyOptions.map((option) => (
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
                          {transactionTypeOptions.map((option) => (
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
                          {transactionCategoryOptions.map((option) => (
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
                          {transactionStatusOptions.map((option) => (
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
              const isCredit = isCreditTransactionType(transaction.transaction_type);
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
              No transactions found for this account.
            </CardContent>
          </Card>
        )}
      </div>

  );
}
