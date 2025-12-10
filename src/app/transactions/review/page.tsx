'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { transactions, type Transaction, type TransactionCategory, type TransactionStatus, type TransactionType } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ArrowLeft, Loader } from 'lucide-react';

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
const transactionTypes: {value: TransactionType, label: TransactionType}[] = [
    {value: 'sale', label: 'sale'}, 
    {value: 'purchase', label: 'purchase'}, 
    {value: 'refund', label: 'refund'}, 
    {value: 'expense', label: 'expense'}, 
    {value: 'payroll', label: 'payroll'}, 
    {value: 'income', label: 'income'},
    {value: 'other', label: 'other'}
];
const transactionStatuses: {value: TransactionStatus, label: TransactionStatus}[] = [
    {value: 'unpaid', label: 'unpaid'},
    {value: 'partially_paid', label: 'partially_paid'},
    {value: 'paid', label: 'paid'},
    {value: 'canceled', label: 'canceled'}
];
const currencies = [
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'JPY', label: 'JPY - Japanese Yen' },
    { value: 'INR', label: 'INR - Indian Rupee' },
    { value: 'NPR', label: 'NPR - Nepali Rupee' },
];


function ReviewTransactionForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    const [hydrated, setHydrated] = useState(false);
    
    // Form state
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
    
    useEffect(() => {
        const transactionData = searchParams.get('data');
        if (transactionData) {
            try {
                const parsedData = JSON.parse(transactionData);
                setTitle(parsedData.title || '');
                setDescription(parsedData.description || '');
                setDate(parsedData.date || new Date().toISOString().split('T')[0]);
                setTransactionType(parsedData.transaction_type || '');
                setCategory(parsedData.category || '');
                setCurrency(parsedData.currency?.toUpperCase() || 'USD');
                setTotalAmount(parsedData.total_amount || '');
                setStatus(parsedData.status || '');
                setRecipient(parsedData.recipient || '');
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
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Could not read AI-generated transaction data.'
                });
            }
        }
        setHydrated(true);
    }, [searchParams, toast]);

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

    const handleCommitTransaction = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !date || !transactionType || !category || !currency || totalAmount === '' || !status) {
            toast({
                variant: "destructive",
                title: "Missing Fields",
                description: "Please fill out all required fields.",
            });
            return;
        }
        
        let finalAmountPaid = 0;
        if (status === 'paid') {
            finalAmountPaid = totalAmount;
        } else if (status === 'partially_paid') {
            finalAmountPaid = typeof amountPaid === 'number' ? amountPaid : 0;
        }

        const newTransaction: Transaction = {
            id: (transactions.length + 1).toString(),
            title,
            description,
            accountId: accountId,
            category: category as TransactionCategory,
            transaction_type: transactionType as TransactionType,
            total_amount: totalAmount,
            total_paid: finalAmountPaid,
            balance_due: totalAmount - finalAmountPaid,
            status: status as TransactionStatus,
            date,
            currency,
            recipient,
            due_on: dueOn || undefined,
            created_at: new Date().toISOString(),
        };
        
        console.log('Committing New Transaction:', newTransaction);
        transactions.push(newTransaction);
        
        toast({
            title: "Transaction Committed",
            description: `A new transaction for ${currency} ${totalAmount} has been successfully created.`,
        });

        router.push(`/transactions/${newTransaction.id}`);
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
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} required className={!date ? 'text-muted-foreground' : ''}/>
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="recipient">Recipient (Optional)</Label>
                    <Input id="recipient" value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="e.g., John Doe" />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="type">Type</Label>
                    <Combobox
                        options={transactionTypes}
                        value={transactionType}
                        onChange={(v) => setTransactionType(v as any)}
                        placeholder="Select transaction type"
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Combobox
                        options={categories}
                        value={category}
                        onChange={(v) => setCategory(v as any)}
                        placeholder="Select a category"
                    />
                </div>
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Combobox
                        options={currencies}
                        value={currency}
                        onChange={setCurrency}
                        placeholder="Select a currency"
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="amount">Total Amount</Label>
                    <Input id="amount" type="number" value={totalAmount} onChange={e => setTotalAmount(e.target.value === '' ? '' : parseFloat(e.target.value))} placeholder="0.00" required />
                </div>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Combobox
                    options={transactionStatuses}
                    value={status}
                    onChange={(v) => setStatus(v as any)}
                    placeholder="Select status"
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
                    />
                </div>
            )}
             {status === 'partially_paid' && (
                <div className="grid gap-2">
                    <Label htmlFor="amount_paid">Amount Paid</Label>
                    <Input id="amount_paid" type="number" value={amountPaid} onChange={e => setAmountPaid(e.target.value === '' ? '' : parseFloat(e.target.value))} placeholder="0.00" required />
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
                <Button type="submit">Commit Transaction</Button>
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
