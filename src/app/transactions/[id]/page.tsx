'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { transactions, transactionLines, type TransactionLine, type TransactionLineCategory } from '@/lib/mock-data';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Paperclip, PlusCircle, Printer } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Combobox } from '@/components/ui/combobox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';

const lineItemCategories: {value: TransactionLineCategory, label: string}[] = [
    {value: 'vat_paid', label: 'VAT Paid'},
    {value: 'vat_return', label: 'VAT Return'},
    {value: 'sales', label: 'Sales'},
    {value: 'referral_paid', label: 'Referral Paid'},
    {value: 'payable', label: 'Payable'},
    {value: 'receivable', label: 'Receivable'},
];

const accounts = [
  { value: 'Checking Account', label: 'Checking Account' },
  { value: 'Savings Account', label: 'Savings Account' },
  { value: 'Wallet', label: 'Wallet' },
];

function DetailItem({ label, value, className }: { label: string; value?: React.ReactNode, className?: string }) {
    if (value === null || value === undefined || value === '') return null;
    return (
        <div className={cn("flex flex-col gap-1", className)}>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="font-medium text-foreground">{value}</p>
        </div>
    );
}

function AddLineItemForm({ transactionId, currency, onAddLine }: { transactionId: string, currency: string, onAddLine: (line: TransactionLine) => void }) {
    const { toast } = useToast();
    const [lineTitle, setLineTitle] = useState('');
    const [description, setDescription] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);
    const [category, setCategory] = useState<TransactionLineCategory | ''>('');
    const [account, setAccount] = useState('');
    const [debit, setDebit] = useState<number | ''>('');
    const [credit, setCredit] = useState<number | ''>('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!lineTitle || !category || !account || (debit === '' && credit === '')) {
            toast({
                variant: 'destructive',
                title: 'Missing Fields',
                description: 'Please fill out all required line item fields.'
            });
            return;
        }

        const newLine: TransactionLine = {
            id: `line${Date.now()}`,
            transaction_id: transactionId,
            line_title: lineTitle,
            description,
            attachment: attachment || undefined,
            category: category as TransactionLineCategory,
            account,
            debit: typeof debit === 'number' ? debit : 0,
            credit: typeof credit === 'number' ? credit : 0,
            currency
        };

        console.log('New Line Item:', newLine);
        onAddLine(newLine);
        
        // Reset form
        setLineTitle('');
        setDescription('');
        setAttachment(null);
        setCategory('');
        setAccount('');
        setDebit('');
        setCredit('');

        toast({
            title: 'Line Item Added',
            description: `${lineTitle} has been added to the transaction.`
        })
    }
    
    return (
        <form onSubmit={handleSubmit} className="grid gap-6 p-4 border rounded-lg mt-4">
            <h3 className="text-lg font-semibold">Add New Line Item</h3>
            <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="line_title">Line Title</Label>
                    <Input id="line_title" value={lineTitle} onChange={e => setLineTitle(e.target.value)} required />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="line_category">Category</Label>
                    <Combobox options={lineItemCategories} value={category} onChange={v => setCategory(v as any)} placeholder="Select category..." />
                </div>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="line_description">Description (Optional)</Label>
                <Textarea id="line_description" value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="line_debit">Debit</Label>
                    <Input id="line_debit" type="number" value={debit} onChange={e => setDebit(e.target.value === '' ? '' : parseFloat(e.target.value))} placeholder="0.00" />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="line_credit">Credit</Label>
                    <Input id="line_credit" type="number" value={credit} onChange={e => setCredit(e.target.value === '' ? '' : parseFloat(e.target.value))} placeholder="0.00" />
                </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
                 <div className="grid gap-2">
                    <Label htmlFor="line_account">Account</Label>
                    <Combobox options={accounts} value={account} onChange={setAccount} placeholder="Select account..." />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="line_attachment">Attachment (Optional)</Label>
                    <Input id="line_attachment" type="file" onChange={e => setAttachment(e.target.files ? e.target.files[0] : null)} />
                </div>
            </div>

            <div className="flex justify-start">
                <Button type="submit">Add Line</Button>
            </div>
        </form>
    );
}


export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;

  const transaction = transactions.find((t) => t.id === id);
  const [lines, setLines] = useState<TransactionLine[]>(transactionLines.filter(l => l.transaction_id === id));
  const [showAddLineForm, setShowAddLineForm] = useState(false);

  const handleAddLine = (line: TransactionLine) => {
      setLines(prev => [...prev, line]);
      setShowAddLineForm(false);
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  const isCredit = (type: string) => ['sale', 'refund', 'income'].includes(type)

  if (!transaction) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center text-center">
            <Card className="w-full max-w-md p-6">
                 <p className="text-lg font-semibold">Transaction not found.</p>
                <p className="text-muted-foreground mb-4">The transaction you are looking for does not exist.</p>
                <Link href="/transactions">
                    <Button>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Transactions
                    </Button>
                </Link>
            </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
        <div className="mx-auto space-y-6">
             <div className="flex justify-between items-center">
                <Button variant="ghost" onClick={() => router.back()} className="-ml-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <Link href={`/transactions/${id}/invoice`}>
                    <Button variant="outline">
                        <Printer className="mr-2 h-4 w-4" />
                        View Invoice
                    </Button>
                </Link>
            </div>
            
            <div className="space-y-6">
                <div>
                    <p className="text-sm text-muted-foreground">{formatDate(transaction.date)}</p>
                    <h1 className="text-3xl font-bold tracking-tight">{transaction.title}</h1>
                    {transaction.description && <p className="text-muted-foreground mt-1">{transaction.description}</p>}
                </div>
                
                <p className={cn("text-4xl font-bold tracking-tight", isCredit(transaction.transaction_type) ? 'text-chart-2' : 'text-foreground')}>{formatCurrency(transaction.total_amount, transaction.currency)}</p>

                <Separator />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <DetailItem label="Status" value={<Badge variant="outline" className="capitalize">{transaction.status.replace('_', ' ')}</Badge>} />
                    <DetailItem label="Category" value={transaction.category} />
                    <DetailItem label="Type" value={<span className="capitalize">{transaction.transaction_type}</span>} />
                    <DetailItem label="Account" value={transaction.accountId} />
                    <DetailItem label="Recipient" value={transaction.recipient} />
                    <DetailItem label="Due On" value={formatDate(transaction.due_on)} />
                </div>

                {(transaction.balance_due > 0) && (
                    <>
                        <Separator />
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 items-start">
                            <DetailItem label="Amount Paid" value={formatCurrency(transaction.total_paid, transaction.currency)} />
                            <DetailItem label="Balance Due" value={<span className="text-destructive font-semibold">{formatCurrency(transaction.balance_due, transaction.currency)}</span>} />
                        </div>
                    </>
                )}

                {transaction.reference_document && (
                    <>
                        <Separator />
                        <DetailItem 
                            label="Attachment" 
                            value={
                                <Link href={typeof transaction.reference_document === 'string' ? transaction.reference_document : '#'} target="_blank" className="flex items-center gap-2 text-primary hover:underline">
                                    <Paperclip className="h-4 w-4" />
                                    <span>{typeof transaction.reference_document === 'string' ? transaction.reference_document.split('/').pop() : transaction.reference_document.name}</span>
                                </Link>
                            }
                        />
                    </>
                )}
                 <Separator />

                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold">Line Items</h2>
                        <Button variant="outline" onClick={() => setShowAddLineForm(prev => !prev)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            {showAddLineForm ? 'Cancel' : 'Add Line Item'}
                        </Button>
                    </div>

                    {showAddLineForm && <AddLineItemForm transactionId={transaction.id} currency={transaction.currency} onAddLine={handleAddLine} />}
                    
                    <div className="mt-4 border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead className="text-right">Debit</TableHead>
                                    <TableHead className="text-right">Credit</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {lines.length > 0 ? lines.map(line => (
                                    <TableRow key={line.id}>
                                        <TableCell className="font-medium">{line.line_title}</TableCell>
                                        <TableCell className="capitalize">{line.category.replace('_', ' ')}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(line.debit, line.currency)}</TableCell>
                                        <TableCell className="text-right text-green-500">{formatCurrency(line.credit, line.currency)}</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                                            No line items for this transaction.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    </AppShell>
  );
}
