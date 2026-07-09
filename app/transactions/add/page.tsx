
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { CurrencyAmountInput } from '@/components/ui/currency-amount-input';
import { DateChoiceInput } from '@/components/ui/date-choice-input';
import { type Transaction, type TransactionCategory, type TransactionLineCategory, type TransactionStatus, type TransactionType } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { useUser } from '@/auth/provider';
import { addTransactionLine, createTransaction, useParties, useTransactionsList } from '@/hooks/api';
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, Check, Loader } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  TRANSACTION_BLOCKS_STORAGE_KEY,
  calculateTransactionSubblocks,
  describeTransactionSubblock,
  emptyTransactionSubblockForm,
  formatTransactionBlockNumber,
  getTransactionSubblockFinalAmount,
  migrateTransactionBlock,
  normalizeTransactionBlockKey,
  transactionSubblockCalculationModeOptions,
  transactionSubblockTemplates,
  type CalculatedTransactionSubblock,
  type LegacyTransactionBlock,
  type TransactionBlock,
  type TransactionSubblock,
  type TransactionSubblockCalculationMode,
  type TransactionSubblockForm,
} from '@/services/transactions/blocks';

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
type TransactionDirection = 'incoming' | 'outgoing';

const baseTransactionSubblock: TransactionSubblock = {
  id: 'transaction-amount',
  key: 'amount',
  label: 'Transaction amount',
  mode: 'transaction_amount',
  value: '',
  referenceKey: '',
};

const nonLedgerSubblockKeys = new Set(['amount', 'final_amount', 'quantity', 'rate']);

function isPersistableTransactionSubblock(subblock: CalculatedTransactionSubblock) {
  const key = normalizeTransactionBlockKey(subblock.key);
  const haystack = `${key} ${subblock.label}`.toLowerCase();

  if (nonLedgerSubblockKeys.has(key) || subblock.amount === 0) {
    return false;
  }

  return !haystack.includes('quantity') && !haystack.includes('rate');
}

function getTransactionLineCategory(
  subblock: CalculatedTransactionSubblock,
  direction: TransactionDirection
): TransactionLineCategory {
  const haystack = `${subblock.key} ${subblock.label}`.toLowerCase();

  if (haystack.includes('vat') || haystack.includes('tax')) {
    return direction === 'incoming' ? 'vat_return' : 'vat_paid';
  }

  if (haystack.includes('discount')) {
    return 'sales';
  }

  return direction === 'incoming' ? 'receivable' : 'payable';
}

const transactionDirections: { value: TransactionDirection; label: string; description: string }[] = [
    { value: 'incoming', label: 'Incoming', description: 'Money coming in' },
    { value: 'outgoing', label: 'Outgoing', description: 'Money going out' },
];
const transactionStatuses: {value: TransactionStatus, label: string}[] = [
    {value: 'unpaid', label: 'Unpaid'},
    {value: 'partially_paid', label: 'Partially paid'},
    {value: 'paid', label: 'Paid'},
    {value: 'canceled', label: 'Canceled'}
];

type FormErrors = Partial<{
  title: string;
  date: string;
  direction: string;
  category: string;
  currency: string;
  totalAmount: string;
  status: string;
  accountId: string;
  amountPaid: string;
}>;

export default function AddTransactionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const { data: parties } = useParties();
  const { data: transactions } = useTransactionsList(user?.uid);
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
  const titleRef = useRef<HTMLInputElement | null>(null);
  const fieldRefs = useRef<Partial<Record<keyof FormErrors, HTMLDivElement | null>>>({});

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [showDescription, setShowDescription] = useState(false);
  const [date, setDate] = useState('');
  const [direction, setDirection] = useState<TransactionDirection | ''>('');
  const [category, setCategory] = useState<TransactionCategory | ''>('');
  const [totalAmountCurrency, setTotalAmountCurrency] = useState('');
  const [totalAmount, setTotalAmount] = useState<number | ''>('');
  const [status, setStatus] = useState<TransactionStatus | ''>('');
  const [accountId, setAccountId] = useState('');
  const [partyId, setPartyId] = useState('');
  const [amountPaid, setAmountPaid] = useState<number | ''>('');
  const [dueOn, setDueOn] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [savedTransactionBlocks, setSavedTransactionBlocks] = useState<TransactionBlock[]>([]);
  const [selectedTransactionBlockId, setSelectedTransactionBlockId] = useState('');
  const [transactionSubblocks, setTransactionSubblocks] = useState<TransactionSubblock[]>([baseTransactionSubblock]);
  const [subblockForm, setSubblockForm] = useState<TransactionSubblockForm>(emptyTransactionSubblockForm);

  const recommendedParties = useMemo(() => {
    const counts = new Map<string, { id: string; name: string; type: string; count: number }>();

    (transactions ?? []).forEach((transaction) => {
      const party = transaction.party;
      if (!party) return;

      const existing = counts.get(party.id);
      if (existing) {
        existing.count += 1;
        return;
      }

      counts.set(party.id, {
        id: party.id,
        name: party.name,
        type: party.type,
        count: 1,
      });
    });

    return Array.from(counts.values())
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, 3);
  }, [transactions]);

    const totalAmountValue = typeof totalAmount === 'number' ? totalAmount : 0;
    const transactionSubblockRows = useMemo(
      () => calculateTransactionSubblocks(transactionSubblocks, totalAmountValue),
      [transactionSubblocks, totalAmountValue]
    );
    const resolvedTransactionTotal = useMemo(
      () => getTransactionSubblockFinalAmount(transactionSubblockRows, totalAmountValue),
      [transactionSubblockRows, totalAmountValue]
    );
    const hasCalculatedTransactionTotal = transactionSubblocks.some(
      (subblock) => normalizeTransactionBlockKey(subblock.key) === 'final_amount'
    );

    const finalAmountPaid = useMemo(() => {
    const total = resolvedTransactionTotal;
    if (status === 'paid') {
            return total;
    }

        if (status === 'partially_paid') {
            return typeof amountPaid === 'number' ? amountPaid : 0;
        }

        return 0;
    }, [resolvedTransactionTotal, amountPaid, status]);

    const balanceDue = useMemo(() => Math.max(resolvedTransactionTotal - finalAmountPaid, 0), [resolvedTransactionTotal, finalAmountPaid]);

    useEffect(() => {
      try {
        const raw = window.localStorage.getItem(TRANSACTION_BLOCKS_STORAGE_KEY);
        if (!raw) return;

        const parsed = JSON.parse(raw) as LegacyTransactionBlock[];
        if (Array.isArray(parsed)) {
          setSavedTransactionBlocks(
            parsed
              .map(migrateTransactionBlock)
              .filter((block) => Boolean(block.fieldName) && block.subblocks.length > 0)
          );
        }
      } catch {
        setSavedTransactionBlocks([]);
      }
    }, []);

    useEffect(() => {
      if (showDescription) {
        descriptionRef.current?.focus();
      }
    }, [showDescription]);

  const setFieldErrorRef = (field: keyof FormErrors) => (node: HTMLDivElement | null) => {
    fieldRefs.current[field] = node;
  };

  const clearError = (field: keyof FormErrors) => {
    setErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const validateForm = (): FormErrors => {
    const nextErrors: FormErrors = {};

    if (!title.trim()) nextErrors.title = 'Title is required.';
    if (!date) nextErrors.date = 'Date is required.';
    if (!direction) nextErrors.direction = 'Direction is required.';
    if (!category) nextErrors.category = 'Category is required.';
    if (!totalAmountCurrency) nextErrors.currency = 'Currency is required. Type a country name and press space to select it.';
    if (totalAmount === '' || Number.isNaN(totalAmount)) nextErrors.totalAmount = 'Amount is required.';
    if (!status) nextErrors.status = 'Status is required.';

    if ((status === 'paid' || status === 'partially_paid') && !accountId) {
      nextErrors.accountId = 'Account is required for paid or partially paid transactions.';
    }

    if (status === 'partially_paid') {
      if (amountPaid === '' || Number.isNaN(amountPaid) || amountPaid <= 0) {
        nextErrors.amountPaid = 'Amount paid must be greater than 0.';
      } else if (amountPaid > resolvedTransactionTotal) {
        nextErrors.amountPaid = 'Amount paid cannot exceed the total amount.';
      }
    }

    return nextErrors;
  };

  const focusFirstInvalidField = (nextErrors: FormErrors) => {
    const firstInvalidField = Object.keys(nextErrors)[0] as keyof FormErrors | undefined;
    if (!firstInvalidField) return;

    if (firstInvalidField === 'title') {
      titleRef.current?.focus();
      return;
    }

    const target = fieldRefs.current[firstInvalidField];
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors = validateForm();
    if (!user) {
      toast({
        variant: "destructive",
        title: "Not signed in",
        description: "Please sign in before adding a transaction.",
      });
      return;
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      toast({
        variant: "destructive",
        title: "Missing Fields",
        description: "Please fix the highlighted fields and try again.",
      });
      focusFirstInvalidField(nextErrors);
      return;
    }
    const selectedParty = parties?.find((item) => item.id === partyId);
    const transactionType: TransactionType = direction === 'incoming' ? 'income' : 'expense';
    
    setIsSubmitting(true);
    let finalAmountPaid = 0;
    if (status === 'paid' && resolvedTransactionTotal) {
        finalAmountPaid = resolvedTransactionTotal;
    } else if (status === 'partially_paid') {
        finalAmountPaid = typeof amountPaid === 'number' ? amountPaid : 0;
    }

    try {
        const newTransaction: Omit<Transaction, 'id' | 'created_at'> = {
            title,
            description,
            accountId: accountId,
            partyId: partyId || undefined,
            category: category as TransactionCategory,
            transaction_type: transactionType,
            total_amount: resolvedTransactionTotal,
            total_paid: finalAmountPaid,
            balance_due: balanceDue,
            status: status as TransactionStatus,
            date,
            currency: totalAmountCurrency,
            recipient: selectedParty?.name,
            due_on: dueOn || undefined,
            // reference_document: attachment || undefined, // Not storing files yet
            userId: user.uid,
        };
        const saved = await createTransaction(newTransaction);
        const monetarySubblocks = transactionSubblockRows.filter(isPersistableTransactionSubblock);

        if (saved?.id && monetarySubblocks.length > 0) {
          try {
            await Promise.all(
              monetarySubblocks.map((subblock) => {
                const amount = Math.abs(subblock.amount);
                const isDiscount = `${subblock.key} ${subblock.label}`.toLowerCase().includes('discount');
                const debit =
                  (direction === 'outgoing' && !isDiscount) || (direction === 'incoming' && isDiscount)
                    ? amount
                    : 0;
                const credit =
                  (direction === 'incoming' && !isDiscount) || (direction === 'outgoing' && isDiscount)
                    ? amount
                    : 0;

                return addTransactionLine(saved.id, {
                  line_title: subblock.label,
                  description: describeTransactionSubblock(subblock),
                  category: getTransactionLineCategory(subblock, direction),
                  account: accountId || selectedParty?.name || 'Transaction subblocks',
                  debit,
                  credit,
                  currency: totalAmountCurrency,
                });
              })
            );
          } catch (lineError) {
            console.error("Error adding transaction subblocks: ", lineError);
            toast({
              variant: "destructive",
              title: "Transaction saved",
              description: "The transaction was saved, but calculated subblocks could not be saved as line items.",
            });
            router.push(`/transactions/${saved.id}`);
            return;
          }
        }
        
        toast({
            title: "Transaction Added",
            description: `A new transaction for ${totalAmountCurrency} ${resolvedTransactionTotal} has been successfully added.`,
        });

        router.push(`/transactions/${saved.id}`);

    } catch (error) {
        console.error("Error adding transaction: ", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not save the transaction. Please try again.",
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  const addTransactionSubblock = (nextSubblock: TransactionSubblockForm) => {
    const key = normalizeTransactionBlockKey(nextSubblock.key || nextSubblock.label);
    const label = nextSubblock.label.trim();

    if (!key || !label) {
      toast({
        variant: 'destructive',
        title: 'Subblock name required',
        description: 'Enter a label and key for the transaction subblock.',
      });
      return;
    }

    if (transactionSubblocks.some((subblock) => normalizeTransactionBlockKey(subblock.key) === key)) {
      toast({
        variant: 'destructive',
        title: 'Duplicate subblock',
        description: `${key} already exists in this transaction.`,
      });
      return;
    }

    const requiresValue = ['custom_amount', 'percent_of', 'included_percent', 'multiply'].includes(nextSubblock.mode);
    if (requiresValue && !nextSubblock.value.trim()) {
      toast({
        variant: 'destructive',
        title: 'Value required',
        description: 'Enter an amount, percentage, or referenced key for this subblock.',
      });
      return;
    }

    setTransactionSubblocks((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        key,
        label,
        mode: nextSubblock.mode,
        value: nextSubblock.value.trim(),
        referenceKey: normalizeTransactionBlockKey(nextSubblock.referenceKey),
      },
    ]);
    setSubblockForm(emptyTransactionSubblockForm);
  };

  const applySavedTransactionBlock = (blockId: string) => {
    setSelectedTransactionBlockId(blockId);
    if (blockId === 'none') {
      setSelectedTransactionBlockId('');
      setTransactionSubblocks([baseTransactionSubblock]);
      return;
    }

    const block = savedTransactionBlocks.find((item) => item.id === blockId);
    if (!block) return;

    setTransactionSubblocks(
      block.subblocks.map((subblock) => ({
        ...subblock,
        id: crypto.randomUUID(),
      }))
    );
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="space-y-2">
          <Button asChild variant="ghost" className="w-fit -ml-3 text-muted-foreground hover:text-foreground">
            <Link href="/transactions">
              <ArrowLeft className="h-4 w-4" />
              Back to transactions
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Add Transaction</h1>
            <p className="text-muted-foreground">Fill in the essentials and save.</p>
          </div>
        </div>

        <form onSubmit={handleAddTransaction} className="space-y-6">
          <div className="space-y-4">
            <div ref={setFieldErrorRef('title')} className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                ref={titleRef}
                id="title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  clearError('title');
                }}
                placeholder="e.g., Client payment, office rent, salary"
                required
                aria-invalid={Boolean(errors.title)}
                className={errors.title ? 'border-destructive focus-visible:ring-destructive' : undefined}
              />
              {errors.title ? <p className="text-sm font-medium text-destructive">{errors.title}</p> : null}
              {!showDescription && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-fit gap-2"
                  onClick={() => setShowDescription(true)}
                >
                  <Check className="h-4 w-4" />
                  Need description
                </Button>
              )}
            </div>
            {showDescription && (
              <div className="space-y-2">
                <Label htmlFor="description">Description <span className="text-muted-foreground">(Optional)</span></Label>
                <Textarea
                  ref={descriptionRef}
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a short note"
                  rows={3}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="party">Party <span className="text-muted-foreground">(Optional)</span></Label>
              <Combobox
                options={(parties ?? []).map((party) => ({
                  value: party.id,
                  label: `${party.name} (${party.type})`,
                }))}
                value={partyId}
                onChange={setPartyId}
                placeholder="Select party"
                searchPlaceholder="Search parties..."
                notFoundMessage="No parties found. Add one in Party."
              />
              {recommendedParties.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="text-xs text-muted-foreground">Recommended:</span>
                  {recommendedParties.map((party) => (
                    <Button
                      key={party.id}
                      type="button"
                      variant={partyId === party.id ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 rounded-full px-3 text-xs"
                      onClick={() => setPartyId(party.id)}
                    >
                      {party.name}
                    </Button>
                  ))}
                </div>
              ) : null}
            </div>
            <div ref={setFieldErrorRef('date')} className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <DateChoiceInput
                value={date}
                onChange={(value) => {
                  setDate(value);
                  clearError('date');
                }}
                className={errors.date ? 'rounded-md border border-destructive p-3' : undefined}
              />
              {errors.date ? <p className="text-sm font-medium text-destructive">{errors.date}</p> : null}
            </div>
            <div ref={setFieldErrorRef('direction')} className="space-y-2">
              <Label htmlFor="direction">Direction</Label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {transactionDirections.map((item) => {
                  const isActive = direction === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => {
                        setDirection(item.value);
                        clearError('direction');
                      }}
                      aria-pressed={isActive}
                      className={cn(
                        "flex items-start gap-3 rounded-lg border p-4 text-left transition-colors",
                        isActive
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                          : "border-border hover:border-primary/40 hover:bg-muted/40",
                        errors.direction && !isActive ? "border-destructive/60" : undefined
                      )}
                    >
                      <div className={cn(
                        "mt-0.5 rounded-full p-2",
                        isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}>
                        {item.value === 'incoming' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                      </div>
                      <div className="space-y-1">
                        <div className="font-medium">{item.label}</div>
                        <div className="text-sm text-muted-foreground">{item.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
              {errors.direction ? <p className="text-sm font-medium text-destructive">{errors.direction}</p> : null}
            </div>
            <div ref={setFieldErrorRef('category')} className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Combobox
                options={categories}
                value={category}
                onChange={(v) => {
                  setCategory(v as any);
                  clearError('category');
                }}
                placeholder="Select category"
                searchPlaceholder="Search categories..."
                notFoundMessage="No category found."
                ariaInvalid={Boolean(errors.category)}
              />
              {errors.category ? <p className="text-sm font-medium text-destructive">{errors.category}</p> : null}
            </div>
            <div ref={setFieldErrorRef('totalAmount')} className="space-y-2">
              <Label htmlFor="amount">Transaction amount</Label>
              <CurrencyAmountInput
                id="amount"
                currency={totalAmountCurrency}
                amount={totalAmount}
                onCurrencyChange={(value) => {
                  setTotalAmountCurrency(value);
                  clearError('currency');
                  clearError('totalAmount');
                }}
                onAmountChange={(value) => {
                  setTotalAmount(value);
                  clearError('totalAmount');
                }}
                currencyPlaceholder="Type a country name, then press space"
                amountPlaceholder="0.00"
                placeholder="0.00"
                required
                aria-invalid={Boolean(errors.currency || errors.totalAmount)}
                className={errors.currency || errors.totalAmount ? 'border-destructive focus-within:ring-destructive' : undefined}
              />
              {errors.currency ? <p className="text-sm font-medium text-destructive">{errors.currency}</p> : null}
              {errors.totalAmount ? <p className="text-sm font-medium text-destructive">{errors.totalAmount}</p> : null}
            </div>
            <div className="space-y-4 rounded-lg border p-4">
              <div className="space-y-1">
                <h2 className="font-semibold">Transaction subblocks</h2>
                <p className="text-sm text-muted-foreground">
                  Add VAT, tax, quantity, rate, discounts, taxable amount, and final amount from
                  this transaction amount.
                </p>
              </div>

              {savedTransactionBlocks.length > 0 ? (
                <div className="space-y-2">
                  <Label htmlFor="savedTransactionBlock">Use saved block setup</Label>
                  <Select value={selectedTransactionBlockId || 'none'} onValueChange={applySavedTransactionBlock}>
                    <SelectTrigger id="savedTransactionBlock">
                      <SelectValue placeholder="Select saved transaction block" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No saved setup</SelectItem>
                      {savedTransactionBlocks.map((block) => (
                        <SelectItem key={block.id} value={block.id}>
                          {block.fieldName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                {transactionSubblockTemplates.map((template) => (
                  <Button
                    key={template.templateLabel}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 rounded-full px-3 text-xs"
                    onClick={() => addTransactionSubblock(template)}
                  >
                    + {template.templateLabel}
                  </Button>
                ))}
              </div>

              <div className="grid gap-4 rounded-lg bg-muted/30 p-4 md:grid-cols-5">
                <div className="space-y-2">
                  <Label htmlFor="subblockLabel">Label</Label>
                  <Input
                    id="subblockLabel"
                    value={subblockForm.label}
                    onChange={(event) => {
                      const label = event.target.value;
                      setSubblockForm((current) => ({
                        ...current,
                        label,
                        key: current.key || normalizeTransactionBlockKey(label),
                      }));
                    }}
                    placeholder="VAT"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subblockKey">Key</Label>
                  <Input
                    id="subblockKey"
                    value={subblockForm.key}
                    onChange={(event) =>
                      setSubblockForm((current) => ({
                        ...current,
                        key: normalizeTransactionBlockKey(event.target.value),
                      }))
                    }
                    placeholder="vat"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subblockMode">Calculation</Label>
                  <Select
                    value={subblockForm.mode}
                    onValueChange={(value) =>
                      setSubblockForm((current) => ({
                        ...current,
                        mode: value as TransactionSubblockCalculationMode,
                      }))
                    }
                  >
                    <SelectTrigger id="subblockMode">
                      <SelectValue placeholder="Mode" />
                    </SelectTrigger>
                    <SelectContent>
                      {transactionSubblockCalculationModeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subblockReference">Reference</Label>
                  <Select
                    value={subblockForm.referenceKey || 'none'}
                    onValueChange={(value) =>
                      setSubblockForm((current) => ({
                        ...current,
                        referenceKey: value === 'none' ? '' : value,
                      }))
                    }
                  >
                    <SelectTrigger id="subblockReference">
                      <SelectValue placeholder="Reference" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No reference</SelectItem>
                      {transactionSubblocks.map((subblock) => (
                        <SelectItem key={subblock.id} value={normalizeTransactionBlockKey(subblock.key)}>
                          {subblock.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subblockValue">Value</Label>
                  <Input
                    id="subblockValue"
                    value={subblockForm.value}
                    onChange={(event) =>
                      setSubblockForm((current) => ({ ...current, value: event.target.value }))
                    }
                    placeholder="13, 100, quantity"
                  />
                </div>
                <div className="flex items-end md:col-span-5">
                  <Button type="button" onClick={() => addTransactionSubblock(subblockForm)}>
                    Add subblock
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {transactionSubblockRows.map((subblock) => (
                  <div key={subblock.id} className="flex items-start justify-between gap-4 rounded-md border bg-card p-3">
                    <div className="space-y-1">
                      <div className="font-medium">{subblock.label}</div>
                      <div className="font-mono text-xs text-muted-foreground">{subblock.key}</div>
                      <div className="text-xs text-muted-foreground">{describeTransactionSubblock(subblock)}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right font-semibold">
                        {formatTransactionBlockNumber(subblock.amount)}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setTransactionSubblocks((current) =>
                            current.filter((item) => item.id !== subblock.id)
                          )
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-lg bg-muted/40 p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">
                    {hasCalculatedTransactionTotal ? 'Calculated final amount' : 'Current transaction amount'}
                  </span>
                  <span className="text-lg font-semibold">
                    {totalAmountCurrency ? `${totalAmountCurrency} ` : ''}
                    {formatTransactionBlockNumber(resolvedTransactionTotal)}
                  </span>
                </div>
              </div>
            </div>
            <div ref={setFieldErrorRef('status')} className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Combobox
                options={transactionStatuses}
                value={status}
                onChange={(v) => {
                  setStatus(v as any);
                  clearError('status');
                  clearError('accountId');
                  clearError('amountPaid');
                }}
                placeholder="Select status"
                searchPlaceholder="Search statuses..."
                notFoundMessage="No status found."
                ariaInvalid={Boolean(errors.status)}
              />
              {errors.status ? <p className="text-sm font-medium text-destructive">{errors.status}</p> : null}
            </div>

            {(status === 'paid' || status === 'partially_paid') && (
              <div ref={setFieldErrorRef('accountId')} className="space-y-2">
                <Label htmlFor="account">Account</Label>
                <Combobox
                  options={accounts}
                  value={accountId}
                  onChange={(value) => {
                    setAccountId(value);
                    clearError('accountId');
                  }}
                  placeholder="Select account"
                  searchPlaceholder="Search accounts..."
                  notFoundMessage="No account found."
                  ariaInvalid={Boolean(errors.accountId)}
                />
                {errors.accountId ? <p className="text-sm font-medium text-destructive">{errors.accountId}</p> : null}
              </div>
            )}

            {status === 'partially_paid' && (
              <div ref={setFieldErrorRef('amountPaid')} className="space-y-2">
                <Label htmlFor="amount_paid">Amount paid</Label>
                <CurrencyAmountInput
                  id="amount_paid"
                  currency={totalAmountCurrency}
                  amount={amountPaid}
                  onCurrencyChange={(value) => {
                    setTotalAmountCurrency(value);
                    clearError('currency');
                    clearError('totalAmount');
                    clearError('amountPaid');
                  }}
                  onAmountChange={(value) => {
                    setAmountPaid(value);
                    clearError('amountPaid');
                  }}
                  currencyPlaceholder="Type a country name, then press space"
                  amountPlaceholder="0.00"
                  placeholder="0.00"
                  required
                  aria-invalid={Boolean(errors.amountPaid)}
                  className={errors.amountPaid ? 'border-destructive focus-within:ring-destructive' : undefined}
                />
                {errors.amountPaid ? <p className="text-sm font-medium text-destructive">{errors.amountPaid}</p> : null}
              </div>
            )}

            {(status === 'unpaid' || status === 'partially_paid') && (
              <div className="space-y-2">
                <Label htmlFor="due_on">Due date <span className="text-muted-foreground">(Optional)</span></Label>
                <Input id="due_on" type="date" value={dueOn} onChange={(e) => setDueOn(e.target.value)} className={!dueOn ? 'text-muted-foreground' : ''} />
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => router.push('/transactions')}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save transaction
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
