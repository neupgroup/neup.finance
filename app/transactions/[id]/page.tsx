
'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  transactionLineCategoryOptions,
  type Transaction,
  type TransactionLine,
  type TransactionLineCategory,
} from '@/core/lib/ledger';
import { Badge } from '@neup/components/ui/badge';
import { ArrowLeft, Paperclip, PlusCircle, Loader } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@neup/components/ui/button';
import { LinkButton } from '@neup/components/ui/link-button';
import { Separator } from '@neup/components/ui/separator';
import { cn } from '@neup/core/utils';
import { Input } from '@neup/components/ui/input';
import { Label } from '@neup/components/ui/label';
import { Textarea } from '@neup/components/ui/textarea';
import { Combobox } from '@/components/ui/combobox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@neup/components/ui/table';
import { useToast } from '@neup/core/hooks/useToast';
import { Card } from '@neup/components/ui/card';
import { addTransactionLine, useTransactionById, useTransactionLines, useProjectBooks } from '@/core/hooks/api';

function DetailItem({ label, value, className }: { label: string; value?: React.ReactNode, className?: string }) {
    if (value === null || value === undefined || value === '') return null;
    return (
        <div className={cn("flex flex-col gap-1", className)}>
            <p className="text-sm text-muted-foreground">{label}</p>
            <div className="font-medium text-foreground">{value}</div>
        </div>
    );
}

function getTransactionDirection(type: string) {
    return ['sale', 'refund', 'income'].includes(type) ? 'Incoming' : 'Outgoing';
}

function AddLineItemForm({ transactionId, currency, accountOptions, onAddLine }: { transactionId: string, currency: string, accountOptions: Array<{ value: string; label: string }>, onAddLine: (line: TransactionLine) => void }) {
    const { toast } = useToast();
    const [lineTitle, setLineTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<TransactionLineCategory | ''>('');
    const [account, setAccount] = useState('');
    const [debit, setDebit] = useState<number | ''>('');
    const [credit, setCredit] = useState<number | ''>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!lineTitle || !category || !account || (debit === '' && credit === '')) {
            toast({
                name: 'app',
                state: 'error',
                title: 'Missing Fields',
                description: 'Please fill out all required line item fields.'
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const newLine: Omit<TransactionLine, 'id'> = {
                transaction_id: transactionId,
                line_title: lineTitle,
                description,
                category: category as TransactionLineCategory,
                account,
                debit: typeof debit === 'number' ? debit : 0,
                credit: typeof credit === 'number' ? credit : 0,
                currency
            };

            const saved = await addTransactionLine(transactionId, newLine);
            onAddLine({ ...newLine, id: saved.id });

            // Reset form
            setLineTitle('');
            setDescription('');
            setCategory('');
            setAccount('');
            setDebit('');
            setCredit('');

            toast({
                name: 'app',
                title: 'Line Item Added',
                description: `${lineTitle} has been added to the transaction.`
            })

        } catch (error) {
            console.error("Error adding line item:", error);
             toast({
                name: 'app',
                state: 'error',
                title: 'Error',
                description: 'Could not add line item. Please try again.'
            });
        } finally {
            setIsSubmitting(false);
        }
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
                    <Combobox options={transactionLineCategoryOptions} value={category} onChange={v => setCategory(v as any)} placeholder="Select category..." />
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
                    <Combobox options={accountOptions} value={account} onChange={setAccount} placeholder="Select account..." />
                </div>
            </div>

            <div className="flex justify-start">
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader className="mr-2 h-4 w-4 animate-spin"/> : null }
                    Add Line
                </Button>
            </div>
        </form>
    );
}


export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: transaction, isLoading: isTransactionLoading } = useTransactionById(id);
  const { data: lines, isLoading: areLinesLoading } = useTransactionLines(id);
  const { data: accounts } = useProjectBooks();

  const [showAddLineForm, setShowAddLineForm] = useState(false);
  const partyLabel = transaction?.party?.name || transaction?.recipient || 'N/A';
  const accountOptions = (accounts ?? []).map((account) => ({
    value: account.name,
    label: `${account.name} (${account.type})`,
  }));

  const handleAddLine = () => {
      // The useCollection hook will update automatically
      setShowAddLineForm(false);
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  const isCredit = (type: string) => ['sale', 'refund', 'income'].includes(type);

  const isLoading = isTransactionLoading || areLinesLoading;

  if (isLoading) {
      return (

              <div className="flex justify-center items-center h-full">
                  <Loader className="h-8 w-8 animate-spin" />
              </div>

      )
  }

  if (!transaction) {
    return (

        <div className="flex flex-col items-center justify-center text-center">
            <Card className="w-full max-w-md p-6">
                 <p className="text-lg font-semibold">Transaction not found.</p>
                <p className="text-muted-foreground mb-4">The transaction you are looking for does not exist.</p>
                <LinkButton href="/transactions" preIcon={<ArrowLeft className="mr-2 h-4 w-4" />}>Back to Transactions</LinkButton>
            </Card>
        </div>

    );
  }

  return (

        <div className="mx-auto space-y-4">
             <div className="flex justify-between items-center">
                <Button variant="text" onClick={() => router.back()} className="-ml-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
            </div>

            <div className="space-y-4">
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
                    <DetailItem label="Direction" value={getTransactionDirection(transaction.transaction_type)} />
                    <DetailItem label="Account" value={transaction.accountId} />
                    <DetailItem label="Party" value={partyLabel} />
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
                                    <span>Attachment</span>
                                </Link>
                            }
                        />
                    </>
                )}
                 <Separator />

                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold">Line Items</h2>
                        <Button variant="outlined" onClick={() => setShowAddLineForm(prev => !prev)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            {showAddLineForm ? 'Cancel' : 'Add Line Item'}
                        </Button>
                    </div>

                    {showAddLineForm && <AddLineItemForm transactionId={id} currency={transaction.currency} accountOptions={accountOptions} onAddLine={handleAddLine} />}

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
                                {lines && lines.length > 0 ? lines.map(line => (
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

  );
}
