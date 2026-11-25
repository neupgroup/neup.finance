'use client';

/*
::neup.documentation::finaccounts-detail-page
::title Fin Accounts Detail Page

Shows one finance account at `/finaccounts/:id` and records
transactions against that selected account.

::end
*/

import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, FileUp, Loader, PlusCircle, TrendingDown, TrendingUp } from 'lucide-react';
import { Button } from '@neup/components/ui/button';
import { LinkButton } from '@neup/components/ui/link-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@neup/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@neup/components/ui/dialog';
import { Input } from '@neup/components/ui/input';
import { DateTimePicker } from '@neup/components/ui/date-time-picker';
import { Label } from '@neup/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@neup/components/ui/select';
import { useUser } from '@/core/providers/auth';
import { createFinAccountTransaction, useFinAccountTransactions, useTransactionsList, useProjectBooks, useParties, type FinAccountTransaction } from '@/core/hooks/api';
import { useToast } from '@neup/core/hooks/useToast';
import { Textarea } from '@neup/components/ui/textarea';
import {
  currencyOptions,
  isCreditTransactionType,
  type Transaction,
} from '@/core/lib/ledger';

function formatDate(value: string) {
  return new Date(value).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

// Identify the special ledger transaction used to set an account's opening balance.
function isOpeningBalanceTransaction(transaction: Transaction | FinAccountTransaction) {
  return Boolean(
    transaction.details &&
    typeof transaction.details === 'object' &&
    !Array.isArray(transaction.details) &&
    (transaction.details as Record<string, unknown>).entryKind === 'opening_balance'
  );
}

export default function FinAccountPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const finAccountId = params.id;
  const projectId = searchParams.get('project')?.trim();
  const accountsHref = `/finaccounts${projectId ? `?project=${encodeURIComponent(projectId)}` : ''}`;
  const importHref = `/finaccounts/${encodeURIComponent(finAccountId)}/import${projectId ? `?project=${encodeURIComponent(projectId)}` : ''}`;

  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const { data: accounts, isLoading: areAccountsLoading } = useProjectBooks();
  const { data: parties } = useParties();
  const { data: legacyTransactions, isLoading: areLegacyTransactionsLoading } = useTransactionsList(undefined, finAccountId);
  const { data: accountTransactions, isLoading: areAccountTransactionsLoading } = useFinAccountTransactions(finAccountId);

  const finAccount = accounts?.find((account) => account.id === finAccountId);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isOpeningBalanceOpen, setIsOpeningBalanceOpen] = useState(false);
  const [openingBalance, setOpeningBalance] = useState('');
  const [openingBalanceDate, setOpeningBalanceDate] = useState(() => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${today.getFullYear()}-${month}-${day}`;
  });
  const [openingBalanceNote, setOpeningBalanceNote] = useState('');
  const [isSavingOpeningBalance, setIsSavingOpeningBalance] = useState(false);
  const [openingBalanceSaved, setOpeningBalanceSaved] = useState(false);
  const [newTransactions, setNewTransactions] = useState<FinAccountTransaction[]>([]);
  const [balanceAdjustment, setBalanceAdjustment] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [isDateTimePickerOpen, setIsDateTimePickerOpen] = useState(false);
  const [currency, setCurrency] = useState('');
  const [totalAmount, setTotalAmount] = useState<number | ''>('');
  const [partyId, setPartyId] = useState('none');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasOpeningBalance = openingBalanceSaved || Boolean(accountTransactions?.some(isOpeningBalanceTransaction)) || Boolean(legacyTransactions?.some(isOpeningBalanceTransaction));
  const mirroredLegacyLineIds = new Set((accountTransactions ?? []).flatMap((transaction) => {
    const details = transaction.details;
    if (!details || typeof details !== 'object' || Array.isArray(details)) return [];
    const sourceLineId = (details as Record<string, unknown>).sourceTransactionLineId;
    return typeof sourceLineId === 'string' ? [sourceLineId] : [];
  }));
  const visibleTransactions = [
    ...(accountTransactions ?? []).filter((transaction) => !newTransactions.some((created) => created.id === transaction.id)),
    ...newTransactions,
    ...(legacyTransactions ?? []).filter((transaction) => !(transaction.lines ?? []).some((line: { fin_book?: string; id?: string }) => line.fin_book === finAccountId && mirroredLegacyLineIds.has(line.id ?? ''))).map((transaction) => ({
      ...transaction,
      direction: isCreditTransactionType(transaction.transaction_type) ? 'in' as const : 'out' as const,
      amount: Math.abs(transaction.total_amount),
      activityOn: transaction.date,
      details: transaction.details as Record<string, unknown> | null,
      legacy: true as const,
    })),
  ].sort((left, right) => new Date(right.activityOn).getTime() - new Date(left.activityOn).getTime());

  // Save the initial balance as an opening entry in the account transaction table.
  const handleAddOpeningBalance = async (event: FormEvent) => {
    event.preventDefault();
    const amount = Number(openingBalance);
    if (!user || !finAccount || !openingBalanceDate || !Number.isFinite(amount) || amount <= 0) {
      toast({ name: 'app', state: 'error', title: 'Opening balance required', description: 'Enter a positive opening balance and its date.' });
      return;
    }

    setIsSavingOpeningBalance(true);
    try {
      const saved = await createFinAccountTransaction(finAccountId, {
        title: 'Opening Balance',
        description: openingBalanceNote.trim() || undefined,
        currency: finAccount.currency,
        amount,
        direction: 'in',
        activityOn: openingBalanceDate,
        details: { entryKind: 'opening_balance' },
      });

      setNewTransactions((current) => [saved, ...current]);
      setBalanceAdjustment((current) => current + amount);
      setOpeningBalanceSaved(true);
      setIsOpeningBalanceOpen(false);
      setOpeningBalance('');
      setOpeningBalanceNote('');
      toast({ name: 'app', title: 'Opening balance added', description: `${formatCurrency(amount, finAccount.currency)} was added to ${finAccount.name}.` });
    } catch (error) {
      console.error('Error adding opening balance:', error);
      toast({ name: 'app', state: 'error', title: 'Could not add opening balance', description: 'Please try again.' });
    } finally {
      setIsSavingOpeningBalance(false);
    }
  };

  useEffect(() => {
    if (finAccount?.currency) {
      setCurrency(finAccount.currency);
    }
  }, [finAccount?.currency]);

  const handleAddTransaction = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !finAccount || !title.trim() || !date || !currency || totalAmount === '' || !Number.isFinite(totalAmount) || totalAmount === 0) {
      toast({
        name: 'app',
        state: 'error',
        title: 'Missing Fields',
        description: 'Enter a title, date and time, currency, and a non-zero amount.',
      });
      return;
    }

    setIsSubmitting(true);

    const signedAmount = typeof totalAmount === 'number' ? totalAmount : 0;
    try {
      const saved = await createFinAccountTransaction(finAccountId, {
        title: title.trim(),
        description: description || undefined,
        currency,
        amount: Math.abs(signedAmount),
        direction: signedAmount > 0 ? 'in' : 'out',
        activityOn: new Date(date).toISOString(),
        partyId: partyId === 'none' ? null : partyId,
      });

      setNewTransactions((current) => [saved, ...current]);
      setBalanceAdjustment((current) => current + signedAmount);

      toast({
        name: 'app',
        title: 'Transaction Added',
        description: `${title} was added to this account.`,
      });

      setTitle('');
      setDescription('');
      setDate('');
      setTotalAmount('');
      setPartyId('none');
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

  const isLoading = isUserLoading || areAccountsLoading || areLegacyTransactionsLoading || areAccountTransactionsLoading;

  return (

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <LinkButton href={accountsHref} variant="ghost" className="mb-3 pl-0 flex items-center gap-1 text-sm text-muted-foreground hover:text-primary" preIcon={<ArrowLeft className="mr-2 h-4 w-4" />}>Back to accounts</LinkButton>
            <h1 className="text-3xl font-bold tracking-tight">
              {finAccount?.name || 'Account'}
            </h1>
            <p className="text-muted-foreground">
              All transactions recorded for this account.
            </p>
            {finAccount?.type === 'Bank' && finAccount.bankName ? (
              <p className="text-sm text-muted-foreground">{finAccount.bankName}{finAccount.branch ? ` · ${finAccount.branch}` : ''}{finAccount.accountType ? ` · ${finAccount.accountType}` : ''}</p>
            ) : null}
          </div>
          <div className="flex flex-col items-end gap-3">
            {finAccount && (
              <Card className="min-w-[220px]">
                <CardHeader className="pb-2">
                  <CardDescription>Current balance</CardDescription>
                  <CardTitle className="text-2xl">
                    {formatCurrency(finAccount.balance + balanceAdjustment, finAccount.currency)}
                  </CardTitle>
                </CardHeader>
              </Card>
            )}
            <div className="flex flex-wrap justify-end gap-2">
              <LinkButton href={importHref} variant="outline" aria-disabled={!finAccount || isLoading} tabIndex={!finAccount || isLoading ? -1 : undefined} className={!finAccount || isLoading ? 'pointer-events-none opacity-50' : undefined} preIcon={<FileUp className="mr-2 h-4 w-4" />}>
                Import transactions
              </LinkButton>
              {!hasOpeningBalance ? (
                <Dialog open={isOpeningBalanceOpen} onOpenChange={setIsOpeningBalanceOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" disabled={!finAccount || isLoading}>Add Opening Balance</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                      <DialogTitle>Add Opening Balance</DialogTitle>
                      <DialogDescription>Enter the starting balance for {finAccount?.name ?? 'this account'}. This can only be added once.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddOpeningBalance} className="space-y-4 py-2">
                      <div className="space-y-2">
                        <Label htmlFor="opening-balance-amount">Opening balance ({finAccount?.currency ?? ''})</Label>
                        <Input id="opening-balance-amount" type="number" min="0.01" step="0.01" value={openingBalance} onChange={(event) => setOpeningBalance(event.target.value)} placeholder="0.00" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="opening-balance-date">As of date</Label>
                        <Input id="opening-balance-date" type="date" value={openingBalanceDate} onChange={(event) => setOpeningBalanceDate(event.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="opening-balance-note">Note</Label>
                        <Textarea id="opening-balance-note" value={openingBalanceNote} onChange={(event) => setOpeningBalanceNote(event.target.value)} placeholder="Optional note" rows={2} />
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={isSavingOpeningBalance}>
                          {isSavingOpeningBalance ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
                          Save Opening Balance
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              ) : null}
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
                    <Label htmlFor="description">Description (optional)</Label>
                    <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional notes" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="date">Transaction date and time</Label>
                      <Button
                        id="date"
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                        aria-required="true"
                        onClick={() => setIsDateTimePickerOpen(true)}
                      >
                        {date ? formatDate(new Date(date).toISOString()) : 'Choose date and time'}
                      </Button>
                      {isDateTimePickerOpen ? (
                        <DateTimePicker
                          kind="when"
                          initialDate={date ? date.slice(0, 10) : ''}
                          initialTime={date ? date.slice(11, 16) : ''}
                          onClose={() => setIsDateTimePickerOpen(false)}
                          onComplete={(selectedDate, selectedTime) => {
                            if (selectedDate && selectedTime) setDate(`${selectedDate}T${selectedTime}`);
                            setIsDateTimePickerOpen(false);
                          }}
                        />
                      ) : null}
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
                      <Label htmlFor="amount">Amount</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={totalAmount}
                        onChange={(e) => setTotalAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        placeholder="0.00"
                        required
                      />
                      <p className="text-xs text-muted-foreground">Positive for money in; negative for money out.</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="recipient-party">Recipient (party, optional)</Label>
                      <Select value={partyId} onValueChange={setPartyId}>
                        <SelectTrigger id="recipient-party">
                          <SelectValue placeholder="No recipient" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No recipient</SelectItem>
                          {(parties ?? []).map((party: { id: string; name: string; type: string }) => (
                            <SelectItem key={party.id} value={party.id}>{party.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
        </div>

        <h2 className="text-xl font-semibold tracking-tight">Transaction history</h2>
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader className="mr-3 h-6 w-6 animate-spin" />
            <p>Loading transactions...</p>
          </div>
        ) : visibleTransactions.length > 0 ? (
          <div className="space-y-3">
            {visibleTransactions.map((transaction) => {
              const isOpeningBalance = isOpeningBalanceTransaction(transaction);
              const isCredit = transaction.direction === 'in';
              const amount = Math.abs(transaction.amount);
              const details = transaction.details && typeof transaction.details === 'object' ? transaction.details as Record<string, unknown> : {};
              const activityLabel = isOpeningBalance ? 'Opening Balance' : String(details.transactionType ?? (transaction as FinAccountTransaction).direction ?? 'transaction');
              const activityCategory = String(details.category ?? (isOpeningBalance ? 'general' : ''));
              const recipientName = transaction.party?.name ?? (typeof details.recipient === 'string' ? details.recipient : '');

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
                          {formatDate(transaction.activityOn)}{activityCategory ? ` · ${activityCategory}` : ''}
                        </p>
                        {transaction.description ? <p className="text-sm text-muted-foreground">{transaction.description}</p> : null}
                        {recipientName ? <p className="text-xs text-muted-foreground">Recipient: {recipientName}</p> : null}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                        {isCredit ? '+' : '-'}{formatCurrency(amount, transaction.currency)}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                          {activityLabel}
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
