
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { type Transaction, type TransactionCategory, type TransactionStatus, type TransactionType } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { useUser } from '@/auth/provider';
import { createTransaction } from '@/hooks/api';
import { ArrowLeft, Loader, Sparkles, Wallet } from 'lucide-react';

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
const transactionTypes: {value: TransactionType, label: string}[] = [
    {value: 'sale', label: 'Sale'}, 
    {value: 'purchase', label: 'Purchase'}, 
    {value: 'refund', label: 'Refund'}, 
    {value: 'expense', label: 'Expense'}, 
    {value: 'payroll', label: 'Payroll'}, 
    {value: 'income', label: 'Income'},
    {value: 'other', label: 'Other'}
];
const transactionStatuses: {value: TransactionStatus, label: string}[] = [
    {value: 'unpaid', label: 'Unpaid'},
    {value: 'partially_paid', label: 'Partially paid'},
    {value: 'paid', label: 'Paid'},
    {value: 'canceled', label: 'Canceled'}
];
const currencies = [
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'JPY', label: 'JPY - Japanese Yen' },
    { value: 'INR', label: 'INR - Indian Rupee' },
    { value: 'NPR', label: 'NPR - Nepali Rupee' },
];

const statusMeta: Record<TransactionStatus, { label: string; description: string; tone: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    unpaid: {
        label: 'Unpaid',
        description: 'Nothing has been settled yet.',
        tone: 'secondary',
    },
    partially_paid: {
        label: 'Partially paid',
        description: 'Some cash has moved, but balance remains.',
        tone: 'default',
    },
    paid: {
        label: 'Paid',
        description: 'Fully settled and ready to post.',
        tone: 'default',
    },
    canceled: {
        label: 'Canceled',
        description: 'Kept for history but excluded from totals.',
        tone: 'destructive',
    },
};

function formatCurrency(currency: string, value: number) {
    if (!currency) {
        return value.toFixed(2);
    }

    return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
    }).format(value);
}

function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
    return (
        <div className="rounded-lg border bg-card p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
            <p className="mt-2 text-xl font-semibold tracking-tight">{value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
        </div>
    );
}

function SectionBlock({
    title,
    description,
    icon: Icon,
    children,
}: {
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    children: React.ReactNode;
}) {
    return (
        <section className="space-y-4 rounded-lg border bg-card p-5 shadow-sm sm:p-6">
            <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <Icon className="h-4 w-4" />
                </div>
                <div>
                    <h2 className="text-base font-semibold tracking-tight">{title}</h2>
                    <p className="text-sm text-muted-foreground">{description}</p>
                </div>
            </div>
            {children}
        </section>
    );
}


export default function AddTransactionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [transactionType, setTransactionType] = useState<TransactionType | ''>('');
  const [category, setCategory] = useState<TransactionCategory | ''>('');
  const [currency, setCurrency] = useState('');
  const [totalAmount, setTotalAmount] = useState<number | ''>('');
  const [status, setStatus] = useState<TransactionStatus | ''>('');
  const [accountId, setAccountId] = useState('');
  const [recipient, setRecipient] = useState('');
  const [amountPaid, setAmountPaid] = useState<number | ''>('');
  const [dueOn, setDueOn] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

    const finalAmountPaid = useMemo(() => {
    const total = typeof totalAmount === 'number' ? totalAmount : 0;
    if (status === 'paid') {
            return total;
    }

        if (status === 'partially_paid') {
            return typeof amountPaid === 'number' ? amountPaid : 0;
        }

        return 0;
    }, [totalAmount, amountPaid, status]);

    const totalAmountValue = typeof totalAmount === 'number' ? totalAmount : 0;
    const balanceDue = useMemo(() => Math.max(totalAmountValue - finalAmountPaid, 0), [totalAmountValue, finalAmountPaid]);
    const paymentProgress = useMemo(() => {
        if (totalAmountValue <= 0) {
            return 0;
        }

        return Math.min(100, Math.max(0, (finalAmountPaid / totalAmountValue) * 100));
    }, [finalAmountPaid, totalAmountValue]);

    const selectedStatus = status ? statusMeta[status] : null;
    const amountPreview = typeof totalAmount === 'number' && currency ? formatCurrency(currency, totalAmount) : 'Add amount';
    const paidPreview = typeof totalAmount === 'number' && currency ? formatCurrency(currency, finalAmountPaid) : '0.00';
    const balancePreview = typeof totalAmount === 'number' && currency ? formatCurrency(currency, balanceDue) : '0.00';
    const currencyPreview = currencies.find((option) => option.value === currency)?.label ?? 'Choose a currency';
    const typePreview = transactionTypes.find((option) => option.value === transactionType)?.label ?? 'Select type';
    const categoryPreview = category || 'Select category';
    const accountPreview = accountId || 'No account selected';

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !transactionType || !category || !currency || totalAmount === '' || !status || !user) {
      toast({
        variant: "destructive",
        title: "Missing Fields",
        description: "Please fill out all required fields.",
      });
      return;
    }
    if ((status === 'paid' || status === 'partially_paid') && !accountId) {
        toast({
            variant: "destructive",
            title: "Missing Fields",
            description: "Please select an account for paid or partially paid transactions.",
        });
        return;
    }
    
    setIsSubmitting(true);
    let finalAmountPaid = 0;
    if (status === 'paid' && totalAmount) {
        finalAmountPaid = totalAmount;
    } else if (status === 'partially_paid') {
        finalAmountPaid = typeof amountPaid === 'number' ? amountPaid : 0;
    }

    try {
        const newTransaction: Omit<Transaction, 'id' | 'created_at'> = {
            title,
            description,
            accountId: accountId,
            category: category as TransactionCategory,
            transaction_type: transactionType as TransactionType,
            total_amount: totalAmount as number,
            total_paid: finalAmountPaid,
            balance_due: balanceDue,
            status: status as TransactionStatus,
            date,
            currency,
            recipient,
            due_on: dueOn || undefined,
            // reference_document: attachment || undefined, // Not storing files yet
            userId: user.uid,
        };
        const saved = await createTransaction(newTransaction);
        
        toast({
            title: "Transaction Added",
            description: `A new transaction for ${currency} ${totalAmount} has been successfully added.`,
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

  return (
    <AppShell>
            <div className="space-y-6 md:space-y-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-2">
                        <Button asChild variant="ghost" className="w-fit -ml-3 text-muted-foreground hover:text-foreground">
                            <Link href="/transactions">
                                <ArrowLeft className="h-4 w-4" />
                                Back to transactions
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Add Transaction</h1>
                            <p className="text-muted-foreground">
                                Record the movement cleanly so it fits the rest of the ledger.
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[520px]">
                        <StatCard label="Amount" value={amountPreview} detail={currency ? currencyPreview : 'Select a currency'} />
                        <StatCard label="Paid" value={paidPreview} detail={`${paymentProgress.toFixed(0)}% settled`} />
                        <StatCard label="Balance" value={balancePreview} detail={selectedStatus?.description ?? 'Choose status'} />
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.75fr)]">
                    <Card className="shadow-sm">
                        <CardHeader className="space-y-1">
                            <CardTitle>Transaction details</CardTitle>
                            <CardDescription>Use the same language you would use in the books. Short, factual, and easy to scan.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAddTransaction} className="space-y-6">
                                <SectionBlock title="Basics" description="What happened and who it was for." icon={Sparkles}>
                                    <div className="grid gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="title">Title</Label>
                                            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Client payment, office rent, salary" required />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="description">Description <span className="text-muted-foreground">(Optional)</span></Label>
                                            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add context, invoice number, memo, or note" />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="recipient">Recipient <span className="text-muted-foreground">(Optional)</span></Label>
                                            <Input id="recipient" value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="e.g., Acme Ltd., John Doe" />
                                        </div>
                                    </div>
                                </SectionBlock>

                                <SectionBlock title="Classification" description="How the transaction should appear in reports." icon={Wallet}>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="date">Date</Label>
                                            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required className={!date ? 'text-muted-foreground' : ''} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="currency">Currency</Label>
                                            <Combobox
                                                options={currencies}
                                                value={currency}
                                                onChange={setCurrency}
                                                placeholder="Select a currency"
                                                searchPlaceholder="Search currencies..."
                                                notFoundMessage="No currency found."
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="type">Type</Label>
                                            <Combobox
                                                options={transactionTypes}
                                                value={transactionType}
                                                onChange={(v) => setTransactionType(v as any)}
                                                placeholder="Select transaction type"
                                                searchPlaceholder="Search types..."
                                                notFoundMessage="No type found."
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="category">Category</Label>
                                            <Combobox
                                                options={categories}
                                                value={category}
                                                onChange={(v) => setCategory(v as any)}
                                                placeholder="Select a category"
                                                searchPlaceholder="Search categories..."
                                                notFoundMessage="No category found."
                                            />
                                        </div>
                                    </div>
                                </SectionBlock>

                                <SectionBlock title="Payment" description="Track how much is settled and what remains." icon={Wallet}>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="amount">Total amount</Label>
                                            <Input id="amount" type="number" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value === '' ? '' : parseFloat(e.target.value))} placeholder="0.00" required />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="status">Status</Label>
                                            <Combobox
                                                options={transactionStatuses}
                                                value={status}
                                                onChange={(v) => setStatus(v as any)}
                                                placeholder="Select status"
                                                searchPlaceholder="Search statuses..."
                                                notFoundMessage="No status found."
                                            />
                                        </div>

                                        {(status === 'paid' || status === 'partially_paid') && (
                                            <div className="grid gap-2">
                                                <Label htmlFor="account">Account</Label>
                                                <Combobox
                                                    options={accounts}
                                                    value={accountId}
                                                    onChange={setAccountId}
                                                    placeholder="Select an account"
                                                    searchPlaceholder="Search accounts..."
                                                    notFoundMessage="No account found."
                                                />
                                            </div>
                                        )}

                                        {status === 'partially_paid' && (
                                            <div className="grid gap-2">
                                                <Label htmlFor="amount_paid">Amount paid</Label>
                                                <Input id="amount_paid" type="number" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value === '' ? '' : parseFloat(e.target.value))} placeholder="0.00" required />
                                            </div>
                                        )}

                                        {(status === 'unpaid' || status === 'partially_paid') && (
                                            <div className="grid gap-2 md:col-span-2">
                                                <Label htmlFor="due_on">Due on <span className="text-muted-foreground">(Optional)</span></Label>
                                                <Input id="due_on" type="date" value={dueOn} onChange={(e) => setDueOn(e.target.value)} className={!dueOn ? 'text-muted-foreground' : ''} />
                                            </div>
                                        )}

                                        <div className="grid gap-2 md:col-span-2">
                                            <Label>Balance due</Label>
                                            <Input value={typeof totalAmount === 'number' ? formatCurrency(currency, balanceDue) : '0.00'} readOnly className="bg-muted" />
                                        </div>
                                    </div>
                                </SectionBlock>

                                <div className="flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                                    <p className="text-sm text-muted-foreground">
                                        Keep it close to how you would write it in the ledger. The rest of the app uses this same tone.
                                    </p>
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
                        </CardContent>
                    </Card>

                    <div className="space-y-6 lg:sticky lg:top-6">
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle>Ledger summary</CardTitle>
                                <CardDescription>Quick reference for what will be recorded.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 px-4 py-3">
                                    <span className="text-sm text-muted-foreground">Status</span>
                                    <Badge variant={selectedStatus?.tone ?? 'outline'}>{selectedStatus?.label ?? 'Draft'}</Badge>
                                </div>
                                <div className="space-y-3 rounded-lg border bg-card p-4">
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-sm text-muted-foreground">Amount</span>
                                        <span className="text-sm font-medium">{amountPreview}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-sm text-muted-foreground">Paid</span>
                                        <span className="text-sm font-medium">{paidPreview}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-sm text-muted-foreground">Balance</span>
                                        <span className="text-sm font-medium">{balancePreview}</span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${paymentProgress}%` }} />
                                    </div>
                                </div>
                                <div className="grid gap-3 text-sm">
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-muted-foreground">Type</span>
                                        <span className="font-medium">{typePreview}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-muted-foreground">Category</span>
                                        <span className="font-medium">{categoryPreview}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-muted-foreground">Currency</span>
                                        <span className="font-medium">{currencyPreview}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-muted-foreground">Account</span>
                                        <span className="font-medium">{accountPreview}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardContent className="space-y-3 p-5">
                                <p className="text-sm font-medium">Good entries are specific.</p>
                                <p className="text-sm text-muted-foreground">
                                    Use the title for the actual event, the description for context, and the category for reporting. That keeps the ledger useful later.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
    </AppShell>
  );
}
