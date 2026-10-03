
'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@neup/components/ui/button';
import { Input } from '@neup/components/ui/input';
import { Label } from '@neup/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { CurrencyAmountInput } from '@/components/ui/currency-amount-input';
import { DateChoiceInput } from '@/components/ui/date-choice-input';
import {
  transactionCategoryOptions,
  transactionStatusOptions,
  type Transaction,
  type TransactionCategory,
  type TransactionStatus,
  type TransactionType,
} from '@/core/lib/ledger';
import { useToast } from '@neup/components/ui/toast';
import { Textarea } from '@neup/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@neup/components/ui/card';
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, Loader } from 'lucide-react';
import { useUser } from '@/core/providers/auth';
import { createTransaction, useParties, useProjectBooks } from '@/core/hooks/api';
import { cn } from '@neup/core/utils';
type TransactionDirection = 'incoming' | 'outgoing';

const transactionDirections: {value: TransactionDirection, label: string, description: string}[] = [
    {value: 'incoming', label: 'Incoming', description: 'Money coming in'},
    {value: 'outgoing', label: 'Outgoing', description: 'Money going out'},
];
function ReviewTransactionForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const { user } = useUser();
    const { data: parties } = useParties();
    const { data: accounts } = useProjectBooks();

    const [hydrated, setHydrated] = useState(false);
    
    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [direction, setDirection] = useState<TransactionDirection | ''>('');
    const [category, setCategory] = useState<TransactionCategory | ''>('');
    const [currency, setCurrency] = useState('');
    const [totalAmount, setTotalAmount] = useState<number | ''>('');
    const [status, setStatus] = useState<TransactionStatus | ''>('');
    const [accountId, setAccountId] = useState('');
    const [partyId, setPartyId] = useState('');
    const [amountPaid, setAmountPaid] = useState<number | ''>('');
    const [dueOn, setDueOn] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const accountOptions = useMemo(
        () => (accounts ?? []).map((account) => ({
            value: account.name,
            label: `${account.name} (${account.type})`,
        })),
        [accounts]
    );
    
    useEffect(() => {
        const transactionData = searchParams.get('data');
        if (transactionData) {
            try {
                const parsedData = JSON.parse(transactionData);
                setTitle(parsedData.title || '');
                setDescription(parsedData.description || '');
                setDate(parsedData.date || new Date().toISOString().split('T')[0]);
                setDirection(['sale', 'refund', 'income'].includes(parsedData.transaction_type) ? 'incoming' : 'outgoing');
                setCategory(parsedData.category || '');
                setCurrency(parsedData.currency?.toUpperCase() || 'USD');
                setTotalAmount(parsedData.total_amount || '');
                setStatus(parsedData.status || '');
                setAmountPaid(parsedData.total_paid || '');
                setDueOn(parsedData.due_on || '');

                if (parsedData.total_amount && parsedData.total_paid !== undefined && parsedData.total_amount === parsedData.total_paid) {
                    setStatus('paid');
                } else if (parsedData.total_paid > 0) {
                    setStatus('partially_paid');
                } else {
                    setStatus('unpaid');
                }

            } catch (error) {
                console.error("Failed to parse transaction data from URL", error);
                toast({
                    name: 'app',
                    state: 'error',
                    title: 'Error',
                    description: 'Could not read AI-generated transaction data.'
                });
            }
        }
        setHydrated(true);
    }, [searchParams, toast]);

    useEffect(() => {
        if (!parties?.length || partyId) {
            return;
        }

        const transactionData = searchParams.get('data');
        if (!transactionData) {
            return;
        }

        try {
            const parsedData = JSON.parse(transactionData);
            const parsedRecipient = typeof parsedData.recipient === 'string' ? parsedData.recipient.trim() : '';
            if (!parsedRecipient) {
                return;
            }

            const matchedParty = parties.find((party) => party.name.toLowerCase() === parsedRecipient.toLowerCase());
            if (matchedParty) {
                setPartyId(matchedParty.id);
            }
        } catch (error) {
            console.error("Failed to map recipient to party", error);
        }
    }, [parties, partyId, searchParams]);

    const balanceDue = useMemo(() => {
        const total = typeof totalAmount === 'number' ? totalAmount : 0;
        let paid;

        if (status === 'paid') {
            paid = total;
        } else if (status === 'partially_paid') {
            paid = typeof amountPaid === 'number' ? amountPaid : 0;
        } else { // unpaid or canceled
            paid = 0;
        }
        
        return total - paid;
    }, [totalAmount, amountPaid, status]);

    const handleCommitTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !date || !direction || !category || !currency || totalAmount === '' || !status || !user) {
            toast({
                name: 'app',
                state: "error",
                title: "Missing Fields",
                description: "Please fill out all required fields.",
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
        const transactionType: TransactionType = direction === 'incoming' ? 'income' : 'expense';

        try {
            const newTransaction = {
                title,
                description,
                accountId: accountId,
                partyId: partyId || undefined,
                category: category as TransactionCategory,
                transaction_type: transactionType,
                total_amount: totalAmount as number,
                total_paid: finalAmountPaid,
                balance_due: (totalAmount as number) - finalAmountPaid,
                status: status as TransactionStatus,
                date,
                currency,
                recipient: parties?.find((party) => party.id === partyId)?.name,
                due_on: dueOn || undefined,
                userId: user.uid,
            };
            const saved = await createTransaction(newTransaction);
            
            toast({
                name: 'app',
                title: "Transaction Committed",
                description: `A new transaction for ${currency} ${totalAmount} has been successfully created.`,
            });

            router.push(`/transactions/${saved.id}`);
        } catch (error) {
            console.error("Error committing transaction: ", error);
            toast({
                name: 'app',
                state: "error",
                title: "Error",
                description: "Could not save the transaction. Please try again.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!hydrated) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader className="h-6 w-6 animate-spin" />
            </div>
        );
    }
    
    return (
         <form onSubmit={handleCommitTransaction} className="grid gap-6">
            <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Monthly Salary" required />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g., Invoice #123 details" />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="party">Party (Optional)</Label>
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
            </div>
            <div className="grid gap-2">
                <Label htmlFor="date">Date</Label>
                <DateChoiceInput value={date} onChange={setDate} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="direction">Direction</Label>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {transactionDirections.map((item) => {
                            const isActive = direction === item.value;
                            return (
                                <button
                                    key={item.value}
                                    type="button"
                                    onClick={() => setDirection(item.value)}
                                    aria-pressed={isActive}
                                    className={cn(
                                        "flex items-start gap-3 rounded-lg border p-4 text-left transition-colors",
                                        isActive
                                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                            : "border-border hover:border-primary/40 hover:bg-muted/40"
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
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Combobox
                        options={transactionCategoryOptions}
                        value={category}
                        onChange={(v) => setCategory(v as any)}
                        placeholder="Select a category"
                    />
                </div>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="amount">Total Amount</Label>
                <CurrencyAmountInput
                    id="amount"
                    currency={currency}
                    amount={totalAmount}
                    onCurrencyChange={setCurrency}
                    onAmountChange={setTotalAmount}
                    currencyPlaceholder="Type a country name, then press space"
                    amountPlaceholder="0.00"
                    placeholder="0.00"
                    required
                />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Combobox
                    options={transactionStatusOptions}
                    value={status}
                    onChange={(v) => setStatus(v as any)}
                    placeholder="Select status"
                />
            </div>
             {(status === 'paid' || status === 'partially_paid') && (
                 <div className="grid gap-2">
                    <Label htmlFor="account">Account</Label>
                        <Combobox
                        options={accountOptions}
                        value={accountId}
                        onChange={setAccountId}
                        placeholder="Select an account"
                    />
                </div>
            )}
             {status === 'partially_paid' && (
                <div className="grid gap-2">
                    <Label htmlFor="amount_paid">Amount Paid</Label>
                    <CurrencyAmountInput
                        id="amount_paid"
                        currency={currency}
                        amount={amountPaid}
                        onCurrencyChange={setCurrency}
                        onAmountChange={setAmountPaid}
                        currencyPlaceholder="Type a country name, then press space"
                        amountPlaceholder="0.00"
                        placeholder="0.00"
                        required
                    />
                </div>
            )}

            {(status === 'partially_paid' || status === 'unpaid') && (
                <div className="grid gap-2">
                    <Label>Balance Due</Label>
                    <Input value={balanceDue.toFixed(2)} readOnly className="bg-muted" />
                </div>
            )}

            {(status === 'unpaid' || status === 'partially_paid') && (
                <div className="grid gap-2">
                    <Label htmlFor="due_on">Due On (Optional)</Label>
                    <Input id="due_on" type="date" value={dueOn} onChange={e => setDueOn(e.target.value)} className={!dueOn ? 'text-muted-foreground' : ''}/>
                </div>
            )}

            <div className="flex justify-start gap-2 mt-4">
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader className="mr-2 h-4 w-4 animate-spin"/> : null}
                    Commit Transaction
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push('/')}>Cancel</Button>
            </div>
        </form>
    )
}

export default function ReviewTransactionPage() {
    const router = useRouter();

    return (
        <AppShell>
        <div className="mx-auto max-w-2xl space-y-6">
            <Button variant="ghost" onClick={() => router.back()} className="-ml-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
            </Button>
            <Card>
                <CardHeader>
                    <CardTitle>Review Transaction</CardTitle>
                    <CardDescription>
                        AI has processed your request. Please review, edit, and commit the transaction.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Suspense fallback={<div className="flex items-center justify-center py-12"><Loader className="h-6 w-6 animate-spin" /></div>}>
                         <ReviewTransactionForm />
                    </Suspense>
                </CardContent>
            </Card>
        </div>
        </AppShell>
    );
}
