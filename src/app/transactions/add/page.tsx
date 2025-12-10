

'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { transactions, type Transaction, type TransactionCategory, type TransactionStatus, type TransactionType } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';

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
    {value: 'sale', label: 'Sale'}, 
    {value: 'purchase', label: 'Purchase'}, 
    {value: 'refund', label: 'Refund'}, 
    {value: 'expense', label: 'Expense'}, 
    {value: 'payroll', label: 'Payroll'}, 
    {value: 'other', label: 'Other'}
];
const transactionStatuses: {value: TransactionStatus, label: TransactionStatus}[] = [
    {value: 'unpaid', label: 'Unpaid'},
    {value: 'partially_paid', label: 'Partially Paid'},
    {value: 'paid', label: 'Paid'},
    {value: 'canceled', label: 'Canceled'}
];
const currencies = [
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'JPY', label: 'JPY - Japanese Yen' },
    { value: 'INR', label: 'INR - Indian Rupee' },
];


export default function AddTransactionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
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

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !transactionType || !category || !currency || totalAmount === '' || !status) {
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
      reference_document: attachment || undefined,
      created_at: new Date().toISOString(),
    };
    
    // In a real app, you'd send this to a server.
    // For now we just log it, add it to mock data, and show a success toast.
    console.log('New Transaction:', newTransaction);
    transactions.push(newTransaction);
    
    toast({
      title: "Transaction Added",
      description: `A new transaction for ${currency} ${totalAmount} has been successfully added.`,
    });

    router.push(`/transactions/${newTransaction.id}`);
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Add New Transaction</h1>
            <p className="text-muted-foreground">
                Enter the details of your new transaction below.
            </p>
        </div>
        <div>
            <form onSubmit={handleAddTransaction} className="grid gap-6">
                <div className="grid gap-2">
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Monthly Salary" required />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g., Invoice #123 details" />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="attachment">Attach Document/Image (Optional)</Label>
                    <Input id="attachment" type="file" onChange={e => setAttachment(e.target.files ? e.target.files[0] : null)} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} required className={!date ? 'text-muted-foreground' : ''}/>
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
                    <Label htmlFor="amount">Total Amount</Label>
                    <Input id="amount" type="number" value={totalAmount} onChange={e => setTotalAmount(e.target.value === '' ? '' : parseFloat(e.target.value))} placeholder="0.00" required />
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

                <div className="grid gap-2">
                    <Label htmlFor="recipient">Recipient (Optional)</Label>
                    <Input id="recipient" value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="e.g., John Doe" />
                </div>

                <div className="flex justify-start gap-2 mt-4">
                    <Button type="submit">Save Transaction</Button>
                    <Button type="button" variant="outline" onClick={() => router.push('/transactions')}>Cancel</Button>
                </div>
            </form>
        </div>
    </div>
    </AppShell>
  );
}
