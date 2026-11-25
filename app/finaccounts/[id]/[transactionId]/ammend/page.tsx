'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader, Save } from 'lucide-react';
import { Button } from '@neup/components/ui/button';
import { LinkButton } from '@neup/components/ui/link-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@neup/components/ui/card';
import { DateTimePicker } from '@neup/components/ui/date-time-picker';
import { Input } from '@neup/components/ui/input';
import { Label } from '@neup/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@neup/components/ui/select';
import { Textarea } from '@neup/components/ui/textarea';
import { updateFinAccountTransaction, useFinAccountTransactions, useParties, useProjectBooks } from '@/core/hooks/api';
import { useToast } from '@neup/core/hooks/useToast';
import { currencyOptions } from '@/core/lib/ledger';

function toLocalDateTime(value: string) {
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

// Edit an existing transaction and return to its detail page after saving.
export default function AmendFinAccountTransactionPage() {
  const params = useParams<{ id: string; transactionId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const accountId = params.id;
  const transactionId = params.transactionId;
  const projectId = searchParams.get('project')?.trim();
  const detailHref = `/finaccounts/${encodeURIComponent(accountId)}/${encodeURIComponent(transactionId)}${projectId ? `?project=${encodeURIComponent(projectId)}` : ''}`;
  const { toast } = useToast();
  const { data: accounts, isLoading: isAccountsLoading } = useProjectBooks();
  const { data: transactions, isLoading: areTransactionsLoading } = useFinAccountTransactions(accountId);
  const { data: parties } = useParties();
  const account = accounts?.find((entry) => entry.id === accountId);
  const transaction = transactions?.find((entry) => entry.id === transactionId);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [isDateTimePickerOpen, setIsDateTimePickerOpen] = useState(false);
  const [currency, setCurrency] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [direction, setDirection] = useState<'in' | 'out' | ''>('');
  const [partyId, setPartyId] = useState('none');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; date?: string; currency?: string; amount?: string; direction?: string }>({});
  const isLoading = isAccountsLoading || areTransactionsLoading;

  useEffect(() => {
    if (!transaction || isInitialized) return;
    setTitle(transaction.title);
    setDescription(transaction.description ?? '');
    setDate(toLocalDateTime(transaction.activityOn));
    setCurrency(transaction.currency);
    setAmount(transaction.amount);
    setDirection(transaction.direction);
    setPartyId(transaction.partyId ?? 'none');
    setIsInitialized(true);
  }, [transaction, isInitialized]);

  // Validate amended values inline and save through the account-scoped API.
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = {
      ...(!title.trim() ? { title: 'Enter a title.' } : {}),
      ...(!date || !Number.isFinite(new Date(date).getTime()) ? { date: 'Choose a valid date and time.' } : {}),
      ...(!currency ? { currency: 'Select a currency.' } : {}),
      ...(amount === '' || !Number.isFinite(amount) || amount <= 0 ? { amount: 'Enter an amount greater than zero.' } : {}),
      ...(!direction ? { direction: 'Select a transaction direction.' } : {}),
    };
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length || !transaction) return;

    setIsSubmitting(true);
    try {
      await updateFinAccountTransaction(accountId, transactionId, {
        title: title.trim(),
        description: description.trim() || null,
        currency,
        amount: Number(amount),
        direction,
        activityOn: new Date(date).toISOString(),
        partyId: partyId === 'none' ? null : partyId,
      });
      toast({ name: 'app', title: 'Transaction amended', description: `${title.trim()} was updated.` });
      router.push(detailHref);
    } catch (error) {
      console.error('Error amending transaction:', error);
      toast({ name: 'app', state: 'error', title: 'Could not amend transaction', description: 'Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 p-4 md:p-6">
      <div>
        <LinkButton href={detailHref} variant="ghost" className="mb-3 pl-0" preIcon={<ArrowLeft className="mr-2 h-4 w-4" />}>Back to transaction</LinkButton>
        <p className="text-sm text-muted-foreground">{account?.name ?? 'Account'}</p>
        <h1 className="text-3xl font-bold tracking-tight">Amend transaction</h1>
      </div>
      {isLoading ? <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader className="mr-3 h-6 w-6 animate-spin" />Loading transaction...</div> : !transaction ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Transaction not found in this account.</CardContent></Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>Transaction details</CardTitle><CardDescription>Update the transaction and save your changes.</CardDescription></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2"><Label htmlFor="title">Title</Label><Input id="title" value={title} onChange={(event) => { setTitle(event.target.value); setErrors((current) => ({ ...current, title: undefined })); }} aria-invalid={Boolean(errors.title)} />{errors.title ? <p className="text-sm font-medium text-destructive" role="alert">{errors.title}</p> : null}</div>
              <div className="space-y-2"><Label htmlFor="description">Description (optional)</Label><Textarea id="description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Optional notes" /></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="direction">Direction</Label><Select value={direction} onValueChange={(value: 'in' | 'out') => { setDirection(value); setErrors((current) => ({ ...current, direction: undefined })); }}><SelectTrigger id="direction" aria-invalid={Boolean(errors.direction)}><SelectValue placeholder="Select direction" /></SelectTrigger><SelectContent><SelectItem value="in">Money in</SelectItem><SelectItem value="out">Money out</SelectItem></SelectContent></Select>{errors.direction ? <p className="text-sm font-medium text-destructive" role="alert">{errors.direction}</p> : null}</div>
                <div className="space-y-2"><Label htmlFor="date">Transaction date and time</Label><Button id="date" type="button" variant="outline" className="w-full justify-start text-left font-normal" aria-invalid={Boolean(errors.date)} onClick={() => setIsDateTimePickerOpen(true)}>{date ? formatDate(date) : 'Choose date and time'}</Button>{isDateTimePickerOpen ? <DateTimePicker kind="when" initialDate={date ? date.slice(0, 10) : ''} initialTime={date ? date.slice(11, 16) : ''} onClose={() => setIsDateTimePickerOpen(false)} onComplete={(selectedDate, selectedTime) => { if (selectedDate && selectedTime) { setDate(`${selectedDate}T${selectedTime}`); setErrors((current) => ({ ...current, date: undefined })); } setIsDateTimePickerOpen(false); }} /> : null}{errors.date ? <p className="text-sm font-medium text-destructive" role="alert">{errors.date}</p> : null}</div>
                <div className="space-y-2"><Label htmlFor="currency">Currency</Label><Select value={currency} onValueChange={(value) => { setCurrency(value); setErrors((current) => ({ ...current, currency: undefined })); }}><SelectTrigger id="currency" aria-invalid={Boolean(errors.currency)}><SelectValue placeholder="Select currency" /></SelectTrigger><SelectContent>{currencyOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select>{errors.currency ? <p className="text-sm font-medium text-destructive" role="alert">{errors.currency}</p> : null}</div>
                <div className="space-y-2"><Label htmlFor="amount">Amount</Label><Input id="amount" type="number" min="0.01" step="0.01" value={amount} onChange={(event) => { setAmount(event.target.value === '' ? '' : parseFloat(event.target.value)); setErrors((current) => ({ ...current, amount: undefined })); }} aria-invalid={Boolean(errors.amount)} />{errors.amount ? <p className="text-sm font-medium text-destructive" role="alert">{errors.amount}</p> : null}<p className="text-xs text-muted-foreground">Enter a positive amount. Direction determines whether it is money in or out.</p></div>
                <div className="space-y-2 sm:col-span-2"><Label htmlFor="recipient-party">Recipient (party, optional)</Label><Select value={partyId} onValueChange={setPartyId}><SelectTrigger id="recipient-party"><SelectValue placeholder="No recipient" /></SelectTrigger><SelectContent><SelectItem value="none">No recipient</SelectItem>{(parties ?? []).map((party: { id: string; name: string; type: string }) => <SelectItem key={party.id} value={party.id}>{party.name}</SelectItem>)}</SelectContent></Select></div>
              </div>
              <div className="flex justify-end"><Button type="submit" disabled={isSubmitting || !isInitialized}>{isSubmitting ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save Changes</Button></div>
            </form>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
