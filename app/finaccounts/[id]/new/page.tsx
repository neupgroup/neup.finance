'use client';

import { useState, type FormEvent } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, FileUp, Loader, PlusCircle, Sparkles } from 'lucide-react';
import { Button } from '@neup/components/ui/button';
import { LinkButton } from '@neup/components/ui/link-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@neup/components/ui/card';
import { DateTimePicker } from '@neup/components/ui/date-time-picker';
import { Input } from '@neup/components/ui/input';
import { Label } from '@neup/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@neup/components/ui/select';
import { Textarea } from '@neup/components/ui/textarea';
import { createFinAccountTransaction, extractFinAccountTransaction, useParties, useProjectBooks } from '@/core/hooks/api';
import { useToast } from '@neup/core/hooks/useToast';
import { currencyOptions } from '@/core/lib/ledger';

function formatDate(value: string) {
  return new Date(value).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

// Create one transaction for the account selected by the route.
export default function NewFinAccountTransactionPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const accountId = params.id;
  const projectId = searchParams.get('project')?.trim();
  const accountHref = `/finaccounts/${encodeURIComponent(accountId)}${projectId ? `?project=${encodeURIComponent(projectId)}` : ''}`;
  const importHref = `/finaccounts/${encodeURIComponent(accountId)}/import${projectId ? `?project=${encodeURIComponent(projectId)}` : ''}`;
  const { toast } = useToast();
  const { data: accounts, isLoading: isAccountsLoading } = useProjectBooks();
  const { data: parties } = useParties();
  const account = accounts?.find((entry) => entry.id === accountId);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isDescriptionVisible, setIsDescriptionVisible] = useState(false);
  const [date, setDate] = useState('');
  const [isDateTimePickerOpen, setIsDateTimePickerOpen] = useState(false);
  const [currency, setCurrency] = useState('');
  const [exchangeRate, setExchangeRate] = useState('1');
  const [amount, setAmount] = useState<number | ''>('');
  const [direction, setDirection] = useState<'in' | 'out' | ''>('');
  const [partyId, setPartyId] = useState('none');
  const [tags, setTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState('');
  const [errors, setErrors] = useState<{ title?: string; date?: string; currency?: string; amount?: string; direction?: string }>({});
  const selectedCurrency = currency || (account?.currency && account.currency !== 'ALL' ? account.currency : '');
  const isMultiCurrency = account?.currency === 'ALL';
  const isConvertedCurrency = Boolean(account?.currency && account.currency !== 'ALL' && currency && currency !== account.currency);

  // Send only non-empty form values and apply the structured extraction to matching controls.
  const handleExtract = async () => {
    const selectedParty = (parties ?? []).find((party: { id: string; name: string }) => party.id === partyId);
    const enteredFields = Object.fromEntries(Object.entries({
      title,
      description,
      direction,
      datetime: date,
      currency: currency || (account?.currency === 'ALL' ? '' : selectedCurrency),
      amount: amount === '' ? '' : String(amount),
      receipent: selectedParty?.name ?? '',
      tags: tags.length ? JSON.stringify(tags) : '',
    }).filter(([, value]) => value.trim()));
    if (!Object.keys(enteredFields).length || isExtracting) return;

    setIsExtracting(true);
    setExtractError('');
    try {
      const { result } = await extractFinAccountTransaction(accountId, enteredFields);
      if (result.title?.trim()) {
        setTitle(result.title.trim());
        setErrors((current) => ({ ...current, title: undefined }));
      }
      if (typeof result.description === 'string' && result.description.trim()) {
        setDescription(result.description.trim());
        setIsDescriptionVisible(true);
      }
      if (result.direction) setDirection(result.direction);
      if (result.datetime && Number.isFinite(new Date(result.datetime).getTime())) {
        const extractedDate = new Date(result.datetime);
        const pad = (part: number) => String(part).padStart(2, '0');
        setDate(`${extractedDate.getFullYear()}-${pad(extractedDate.getMonth() + 1)}-${pad(extractedDate.getDate())}T${pad(extractedDate.getHours())}:${pad(extractedDate.getMinutes())}`);
      }
      if (result.currency && result.currency.toUpperCase() !== 'ALL') setCurrency(result.currency.toUpperCase());
      if (typeof result.amount === 'number' && result.amount > 0) setAmount(result.amount);
      if (result.receipent) {
        const match = (parties ?? []).find((party: { id: string; name: string }) => party.name.toLowerCase() === result.receipent?.trim().toLowerCase());
        if (match) setPartyId(match.id);
      }
      if (Array.isArray(result.tags)) {
        setTags(result.tags.map(String));
      }
    } catch (error) {
      setExtractError(error instanceof Error ? error.message : 'Could not extract transaction details.');
    } finally {
      setIsExtracting(false);
    }
  };

  // Validate required fields inline, then persist through the shared account transaction API.
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = {
      ...(!title.trim() ? { title: 'Enter a title.' } : {}),
      ...(!date || !Number.isFinite(new Date(date).getTime()) ? { date: 'Choose a valid date and time.' } : {}),
      ...(!selectedCurrency || selectedCurrency === 'ALL' ? { currency: 'Select the transaction currency.' } : {}),
      ...(isConvertedCurrency && (!Number.isFinite(Number(exchangeRate)) || Number(exchangeRate) <= 0) ? { currency: 'Enter a valid exchange rate.' } : {}),
      ...(amount === '' || !Number.isFinite(amount) || amount <= 0 ? { amount: 'Enter an amount greater than zero.' } : {}),
      ...(!direction ? { direction: 'Select a transaction direction.' } : {}),
    };
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    if (!account) {
      toast({ name: 'app', state: 'error', title: 'Account unavailable', description: isAccountsLoading ? 'The account is still loading. Please try again.' : 'This account could not be found in the selected project.' });
      return;
    }

    setIsSubmitting(true);
    try {
      await createFinAccountTransaction(accountId, {
        title: title.trim(),
        description: description.trim() || undefined,
        currency: selectedCurrency,
        ...(isConvertedCurrency ? { exchangeRate: Number(exchangeRate) } : {}),
        amount: Number(amount),
        direction: direction as 'in' | 'out',
        activityOn: new Date(date).toISOString(),
        partyId: partyId === 'none' ? null : partyId,
        tags,
      });
      toast({ name: 'app', title: 'Transaction Added', description: `${title.trim()} was added to this account.` });
      router.push(accountHref);
    } catch (error) {
      console.error('Error creating transaction:', error);
      toast({ name: 'app', state: 'error', title: 'Error', description: 'Could not create transaction. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 p-4 md:p-6">
      <div>
        <LinkButton href={accountHref} variant="text" className="mb-3 pl-0" preIcon={<ArrowLeft className="mr-2 h-4 w-4" />}>Back to account</LinkButton>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Add Transaction</h1>
            <p className="text-muted-foreground">{account?.name ?? 'Account'}{account?.currency && account.currency !== 'ALL' ? ` · ${account.currency}` : account?.currency === 'ALL' ? ' · Any currency' : ''}</p>
          </div>
          <LinkButton href={importHref} variant="outlined" preIcon={<FileUp className="mr-2 h-4 w-4" />}>Import transactions</LinkButton>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Transaction details</CardTitle>
          <CardDescription>Record a transaction against this account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">Transaction</Label>
              <div className={`overflow-hidden rounded-md border bg-background transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ${errors.title ? 'border-destructive' : 'border-input'}`}>
                <Input
                  id="title"
                  value={title}
                  onChange={(event) => { setTitle(event.target.value); setErrors((current) => ({ ...current, title: undefined })); }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && event.shiftKey) {
                      event.preventDefault();
                      setIsDescriptionVisible(true);
                    }
                  }}
                  placeholder="Transaction title"
                  aria-invalid={Boolean(errors.title)}
                  className="h-11 rounded-none border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                {isDescriptionVisible ? (
                  <div className="border-t border-dashed border-border px-3 pt-2">
                    <p className="mb-1 text-xs font-medium text-muted-foreground">Describe this transaction</p>
                    <Textarea
                      id="description"
                      autoFocus
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Backspace' && !description) {
                          event.preventDefault();
                          setIsDescriptionVisible(false);
                          document.getElementById('title')?.focus();
                        }
                      }}
                      placeholder="Add an optional description…"
                      rows={3}
                      className="min-h-20 resize-y rounded-none border-0 px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>
                ) : null}
              </div>
              {errors.title ? <p className="text-sm font-medium text-destructive" role="alert">{errors.title}</p> : null}
              <Button type="button" variant="text" className="h-auto justify-start px-0 py-0" onClick={handleExtract} disabled={isExtracting || !title.trim() && !description.trim() && !date && !currency && amount === '' && !direction && partyId === 'none'}>
                {isExtracting ? <Loader className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                {isExtracting ? 'Extracting…' : 'Extract from it'}
              </Button>
              {extractError ? <p className="text-sm font-medium text-destructive" role="alert">{extractError}</p> : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="direction">Direction</Label>
                <Select value={direction} onValueChange={(value: 'in' | 'out') => { setDirection(value); setErrors((current) => ({ ...current, direction: undefined })); }}>
                  <SelectTrigger id="direction" aria-invalid={Boolean(errors.direction)}><SelectValue placeholder="Select direction" /></SelectTrigger>
                  <SelectContent><SelectItem value="in">Money in</SelectItem><SelectItem value="out">Money out</SelectItem></SelectContent>
                </Select>
                {errors.direction ? <p className="text-sm font-medium text-destructive" role="alert">{errors.direction}</p> : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Transaction date and time</Label>
                <Button id="date" type="button" variant="outlined" className="w-full justify-start text-left font-normal" aria-required="true" aria-invalid={Boolean(errors.date)} onClick={() => setIsDateTimePickerOpen(true)}>
                  {date ? formatDate(new Date(date).toISOString()) : 'Choose date and time'}
                </Button>
                {isDateTimePickerOpen ? <DateTimePicker kind="when" initialDate={date ? date.slice(0, 10) : ''} initialTime={date ? date.slice(11, 16) : ''} onClose={() => setIsDateTimePickerOpen(false)} onComplete={(selectedDate, selectedTime) => {
                  if (selectedDate && selectedTime) {
                    setDate(`${selectedDate}T${selectedTime}`);
                    setErrors((current) => ({ ...current, date: undefined }));
                  }
                  setIsDateTimePickerOpen(false);
                }} /> : null}
                {errors.date ? <p className="text-sm font-medium text-destructive" role="alert">{errors.date}</p> : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">{isMultiCurrency ? 'Currency received' : `Currency received${account?.currency ? ` (${account.currency} default)` : ''}`}</Label>
                <Select value={currency || selectedCurrency} onValueChange={(value) => { setCurrency(value); setErrors((current) => ({ ...current, currency: undefined })); }}>
                  <SelectTrigger id="currency" aria-invalid={Boolean(errors.currency)}><SelectValue placeholder="Select currency" /></SelectTrigger>
                  <SelectContent>{currencyOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                </Select>
                {errors.currency ? <p className="text-sm font-medium text-destructive" role="alert">{errors.currency}</p> : null}
              </div>
              {isConvertedCurrency ? (
                <div className="space-y-2">
                  <Label htmlFor="exchange-rate">Exchange rate</Label>
                  <Input id="exchange-rate" type="number" min="0.000001" step="any" value={exchangeRate} onChange={(event) => setExchangeRate(event.target.value)} />
                  <p className="text-xs text-muted-foreground">Account currency per 1 {selectedCurrency}.</p>
                </div>
              ) : null}
              {account?.currency && account.currency !== 'ALL' ? (
                <p className="text-sm text-muted-foreground sm:col-span-2">This account balance is kept in {account.currency}; the received amount and currency are retained on each transaction.</p>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input id="amount" type="number" min="0.01" step="0.01" value={amount} onChange={(event) => { setAmount(event.target.value === '' ? '' : parseFloat(event.target.value)); setErrors((current) => ({ ...current, amount: undefined })); }} placeholder="0.00" aria-invalid={Boolean(errors.amount)} />
                {errors.amount ? <p className="text-sm font-medium text-destructive" role="alert">{errors.amount}</p> : null}
                <p className="text-xs text-muted-foreground">Enter a positive amount. Direction determines whether it is money in or out.</p>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="recipient-party">Recipient (party, optional)</Label>
                <Select value={partyId} onValueChange={setPartyId}>
                  <SelectTrigger id="recipient-party"><SelectValue placeholder="No recipient" /></SelectTrigger>
                  <SelectContent><SelectItem value="none">No recipient</SelectItem>{(parties ?? []).map((party: { id: string; name: string; type: string }) => <SelectItem key={party.id} value={party.id}>{party.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="transaction-tags">Tags</Label>
                <Input id="transaction-tags" value={tags.join(', ')} onChange={(event) => setTags(event.target.value.split(',').map((tag) => tag.trim()).filter(Boolean))} placeholder="e.g., travel, supplies" />
                <p className="text-xs text-muted-foreground">Separate tags with commas.</p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting || isAccountsLoading || !account}>
                {isSubmitting ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                Save Transaction
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
