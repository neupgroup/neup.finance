'use client';

/*
::neup.documentation::finaccounts-detail-page
::title Fin Accounts Detail Page

Shows one finance account at `/finaccounts/:id` and records
transactions against that selected account.

::end
*/

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, GitCompareArrows, Loader, PlusCircle, Search, TrendingDown, TrendingUp } from 'lucide-react';
import { LinkButton } from '@neup/components/ui/link-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@neup/components/ui/card';
import { Input } from '@neup/components/ui/input';
import { useUser } from '@/core/providers/auth';
import { useFinAccountTransactions, useTransactionsList, useProjectBooks, type FinAccountTransaction } from '@/core/hooks/api';
import { isCreditTransactionType, type Transaction } from '@/core/lib/ledger';

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

type SearchableAccountTransaction = {
  id: string;
  title: string;
  description: string | null;
  currency: string;
  amount: number;
  direction: 'in' | 'out';
  activityOn: string;
  details: Record<string, unknown> | null;
  party?: { name?: string; type?: string; taxinfo?: unknown } | null;
};

// Validate compact YYYYMMDD or YYYYMMDD.HHMMSS filter values.
function isValidDateFilter(value: string, includesTime: boolean) {
  const [datePart, timePart] = includesTime ? value.split('.') : [value, undefined];
  if (!/^\d{8}$/.test(datePart) || (includesTime && (!timePart || !/^\d{6}$/.test(timePart)))) return false;
  const year = Number(datePart.slice(0, 4));
  const month = Number(datePart.slice(4, 6));
  const day = Number(datePart.slice(6, 8));
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return false;
  if (!timePart) return true;
  return Number(timePart.slice(0, 2)) <= 23 && Number(timePart.slice(2, 4)) <= 59 && Number(timePart.slice(4, 6)) <= 59;
}

// Normalize transaction timestamps to sortable compact date and datetime strings.
function transactionDateValue(transaction: SearchableAccountTransaction, includeTime: boolean) {
  const value = new Date(transaction.activityOn).toISOString();
  const date = value.slice(0, 10).replace(/-/g, '');
  return includeTime ? `${date}.${value.slice(11, 19).replace(/:/g, '')}` : date;
}

// Apply the documented account search syntax, duplicate groups, and plain text terms.
function searchAccountTransactions<T extends SearchableAccountTransaction>(transactions: T[], query: string) {
  const expression = /duplicates\s*\{[^}]*\}|(?:recipient|receipent)\.(?:type|taxType)\s*=\s*[^\s]+|(?:direction|sort|amount|date|datetime)\s*(?:[<>]=?|=)\s*[^\s]+/gi;
  const filters = query.match(expression) ?? [];
  const remainder = query.replace(expression, '').trim().toLowerCase();
  const parsed = filters.map((filter) => {
    if (/^duplicates/i.test(filter)) {
      return { type: 'duplicates', fields: filter.slice(filter.indexOf('{') + 1, filter.lastIndexOf('}')).split(',').map((field) => field.trim().toLowerCase()) };
    }
    const recipient = filter.match(/^(?:recipient|receipent)\.(type|taxType)\s*=\s*(.+)$/i);
    if (recipient) return { type: recipient[1].toLowerCase(), operator: '=', value: recipient[2].toLowerCase() };
    const direction = filter.match(/^direction\s*=\s*(in|out)$/i);
    if (direction) return { type: 'direction', operator: '=', value: direction[1].toLowerCase() };
    const sort = filter.match(/^sort\s*=\s*(asc|desc)$/i);
    if (sort) return { type: 'sort', operator: '=', value: sort[1].toLowerCase() };
    const comparison = filter.match(/^(amount|date|datetime)\s*([<>]=?|=)\s*(.+)$/i);
    if (!comparison) return { type: 'invalid', value: filter };
    return { type: comparison[1].toLowerCase(), operator: comparison[2], value: comparison[3] };
  });
  for (const filter of parsed) {
    if (filter.type === 'invalid') return { transactions: [], error: `Invalid filter: ${filter.value}` };
    if (filter.type === 'direction' && filter.value !== 'in' && filter.value !== 'out') {
      return { transactions: [], error: `Invalid direction value: ${filter.value}. Use in or out.` };
    }
    if (filter.type === 'sort' && filter.value !== 'asc' && filter.value !== 'desc') {
      return { transactions: [], error: `Invalid sort value: ${filter.value}. Use asc or desc.` };
    }
    if (filter.type === 'duplicates') {
      const supported = ['direction', 'amount', 'currency', 'date', 'datetime'];
      if (!filter.fields?.length || filter.fields.some((field) => !supported.includes(field))) return { transactions: [], error: 'Duplicate filters support direction, amount, currency, date, and datetime.' };
    } else if (filter.type === 'amount' && !Number.isFinite(Number(filter.value))) {
      return { transactions: [], error: `Invalid amount value: ${filter.value}` };
    } else if ((filter.type === 'date' || filter.type === 'datetime') && !isValidDateFilter(filter.value ?? '', filter.type === 'datetime')) {
      return { transactions: [], error: `Invalid ${filter.type} value. Use YYYYMMDD${filter.type === 'datetime' ? '.HHMMSS' : ''} and a valid calendar date/time.` };
    }
  }

  const filtered = transactions.filter((transaction) => {
    const party = transaction.party;
    const taxinfo = party?.taxinfo && typeof party.taxinfo === 'object' ? party.taxinfo as Record<string, unknown> : {};
    for (const filter of parsed) {
      if (filter.type === 'duplicates') {
        const duplicate = transactions.some((other) => other.id !== transaction.id && filter.fields!.every((field) => {
          if (field === 'direction') return transaction.direction === other.direction;
          if (field === 'amount') return Math.abs(transaction.amount) === Math.abs(other.amount);
          if (field === 'currency') return transaction.currency.toUpperCase() === other.currency.toUpperCase();
          return transactionDateValue(transaction, field === 'datetime') === transactionDateValue(other, field === 'datetime');
        }));
        if (!duplicate) return false;
      } else if (filter.type === 'type' && party?.type?.toLowerCase() !== filter.value) return false;
      else if (filter.type === 'direction' && transaction.direction !== filter.value) return false;
      else if (filter.type === 'taxtype' && String(taxinfo.taxType ?? '').toLowerCase() !== filter.value) return false;
      else if (filter.type === 'amount') {
        const actual = Math.abs(transaction.amount);
        const expected = Number(filter.value);
        if (filter.operator === '>' && actual <= expected || filter.operator === '<' && actual >= expected || filter.operator === '>=' && actual < expected || filter.operator === '<=' && actual > expected) return false;
        if (filter.operator === '=' && Math.round(actual * 100) !== Math.round(expected * 100)) return false;
      } else if (filter.type === 'date' || filter.type === 'datetime') {
        const actual = transactionDateValue(transaction, filter.type === 'datetime');
        const expected = filter.type === 'date' ? filter.value! : `${filter.value!.slice(0, 8)}.${filter.value!.slice(9)}`;
        if (filter.operator === '>' && actual <= expected || filter.operator === '<' && actual >= expected || filter.operator === '>=' && actual < expected || filter.operator === '<=' && actual > expected) return false;
      }
    }
    const recipientName = party?.name ?? (typeof transaction.details?.recipient === 'string' ? transaction.details.recipient : '');
    const searchable = [transaction.title, transaction.description, transaction.currency, transaction.direction, transaction.activityOn, recipientName].join(' ').toLowerCase();
    return !remainder || searchable.includes(remainder);
  });
  const sort = parsed.find((filter) => filter.type === 'sort')?.value;
  if (sort) filtered.sort((first, second) => (new Date(first.activityOn).getTime() - new Date(second.activityOn).getTime()) * (sort === 'asc' ? 1 : -1));
  return { transactions: filtered, error: '' };
}

export default function FinAccountPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const finAccountId = params.id;
  const projectId = searchParams.get('project')?.trim();
  const accountsHref = `/finaccounts${projectId ? `?project=${encodeURIComponent(projectId)}` : ''}`;
  const reconcileHref = `/finaccounts/${encodeURIComponent(finAccountId)}/reconcile${projectId ? `?project=${encodeURIComponent(projectId)}` : ''}`;
  const newTransactionHref = `/finaccounts/${encodeURIComponent(finAccountId)}/new${projectId ? `?project=${encodeURIComponent(projectId)}` : ''}`;

  const { isUserLoading } = useUser();
  const { data: accounts, isLoading: areAccountsLoading } = useProjectBooks();
  const { data: legacyTransactions, isLoading: areLegacyTransactionsLoading } = useTransactionsList(undefined, finAccountId);
  const { data: accountTransactions, isLoading: areAccountTransactionsLoading } = useFinAccountTransactions(finAccountId);

  const finAccount = accounts?.find((account) => account.id === finAccountId);
  const [newTransactions, setNewTransactions] = useState<FinAccountTransaction[]>([]);
  const [transactionSearch, setTransactionSearch] = useState('');

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
  const { transactions: filteredTransactions, error: searchError } = searchAccountTransactions(visibleTransactions, transactionSearch);
  const calculatedBalance = visibleTransactions.reduce((balance, transaction) => balance + (transaction.direction === 'in' ? Math.abs(transaction.amount) : -Math.abs(transaction.amount)), 0);

  const isLoading = isUserLoading || areAccountsLoading || areLegacyTransactionsLoading || areAccountTransactionsLoading;

  return (

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <LinkButton href={accountsHref} variant="text" className="mb-3 pl-0 flex items-center gap-1 text-sm text-muted-foreground hover:text-primary" preIcon={<ArrowLeft className="mr-2 h-4 w-4" />}>Back to accounts</LinkButton>
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
                    {formatCurrency(calculatedBalance, finAccount.currency)}
                  </CardTitle>
                </CardHeader>
              </Card>
            )}
            <div className="flex flex-wrap justify-end gap-2">
              <LinkButton href={reconcileHref} variant="outlined" aria-disabled={!finAccount || isLoading} tabIndex={!finAccount || isLoading ? -1 : undefined} className={!finAccount || isLoading ? 'pointer-events-none opacity-50' : undefined} preIcon={<GitCompareArrows className="mr-2 h-4 w-4" />}>
                Reconcile
              </LinkButton>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-semibold tracking-tight">Transaction history</h2>
        <div className="relative w-full max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={transactionSearch} onChange={(event) => setTransactionSearch(event.target.value)} placeholder="Search or filter: direction=in, direction=out, sort=asc, sort=desc, duplicates{amount,date}, amount>20000, recipient.type=person, date>20250201" aria-label="Search transactions" className="pl-9" />
        </div>
        {searchError ? <p role="alert" className="text-sm text-destructive">{searchError}</p> : null}
        <Link
          href={newTransactionHref}
          aria-disabled={!finAccount || isLoading}
          tabIndex={!finAccount || isLoading ? -1 : undefined}
          className={`block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${!finAccount || isLoading ? 'pointer-events-none opacity-50' : ''}`}
        >
          <Card className="border-dashed transition-colors hover:bg-muted/40">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-full bg-primary/10 p-2 text-primary">
                <PlusCircle className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold">Add Transaction</p>
                <p className="text-sm text-muted-foreground">Record a transaction for this account.</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader className="mr-3 h-6 w-6 animate-spin" />
            <p>Loading transactions...</p>
          </div>
        ) : filteredTransactions.length > 0 ? (
          <div className="space-y-3">
            {filteredTransactions.map((transaction) => {
              const isOpeningBalance = isOpeningBalanceTransaction(transaction);
              const isCredit = transaction.direction === 'in';
              const amount = Math.abs(transaction.amount);
              const details = transaction.details && typeof transaction.details === 'object' ? transaction.details as Record<string, unknown> : {};
              const activityCategory = String(details.category ?? (isOpeningBalance ? 'general' : ''));
              const recipientName = transaction.party?.name ?? (typeof details.recipient === 'string' ? details.recipient : '');
              const hasRecipient = Boolean(recipientName);
              const transactionHref = `/finaccounts/${encodeURIComponent(finAccountId)}/${encodeURIComponent(transaction.id)}${projectId ? `?project=${encodeURIComponent(projectId)}` : ''}`;

              return (
                <Link key={transaction.id} href={transactionHref} className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Card className="transition-colors hover:bg-muted/40">
                    <CardContent className="flex items-center justify-between gap-4 p-4">
                      <div className="flex items-center gap-4">
                        <div className={`rounded-full p-2 ${isCredit ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                          {isCredit ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="font-semibold">{transaction.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {hasRecipient ? `${isCredit ? 'from' : 'to'} ${recipientName} at ${formatDate(transaction.activityOn)}` : formatDate(transaction.activityOn)}{activityCategory ? ` · ${activityCategory}` : ''}{'status' in transaction && transaction.status ? ` · ${transaction.status}` : ''}
                          </p>
                          {isCredit && !hasRecipient && transaction.description ? <p className="text-sm text-muted-foreground">{transaction.description}</p> : null}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                          {isCredit ? '+' : '-'}{formatCurrency(amount, transaction.currency)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              {transactionSearch.trim() ? 'No transactions match your search.' : 'No transactions found for this account.'}
            </CardContent>
          </Card>
        )}
      </div>

  );
}
