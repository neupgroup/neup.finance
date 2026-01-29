
'use client';

import { useParams, useRouter } from 'next/navigation';
import { type Transaction, type TransactionLine } from '@/lib/mock-data';
import { useUser, useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Loader } from 'lucide-react';
import { Logo } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import React from 'react';

type UserProfile = {
    displayName: string;
    accountId: string;
    email?: string;
}

const InvoicePage = () => {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const { user } = useUser();
    const firestore = useFirestore();

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);
    const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

    const transactionRef = useMemoFirebase(() => {
        if (!firestore || !id) return null;
        return doc(firestore, 'transactions', id);
    }, [firestore, id]);
    const { data: transaction, isLoading: isTransactionLoading } = useDoc<Transaction>(transactionRef);
    
    const linesRef = useMemoFirebase(() => {
        if (!firestore || !id) return null;
        return collection(firestore, 'transactions', id, 'lines');
    }, [firestore, id]);
    const { data: lines, isLoading: areLinesLoading } = useCollection<TransactionLine>(linesRef);

    const handlePrint = () => {
        window.print();
    };
    
    const isLoading = isTransactionLoading || areLinesLoading;

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background p-4">
                <Loader className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    if (!transaction) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background p-4 text-center">
                <div>
                    <h1 className="text-2xl font-bold">Transaction not found</h1>
                    <p className="text-muted-foreground">The invoice you are looking for does not exist.</p>
                    <Button onClick={() => router.back()} className="mt-4">
                        <ArrowLeft className="mr-2" />
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }
    
    const isCredit = (type: string) => ['sale', 'refund', 'income'].includes(type)
    const subtotal = lines ? lines.reduce((acc, line) => acc + (isCredit(transaction.transaction_type) ? line.credit : line.debit), 0) : transaction.total_amount;
    const taxAmount = transaction.total_amount - subtotal;


    return (
        <div className="bg-background text-foreground min-h-screen">
            <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 print:p-0">
                <div className="flex justify-between items-start mb-8 print:hidden">
                    <Button variant="ghost" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2" /> Back to Transaction
                    </Button>
                    <Button onClick={handlePrint}>
                        <Printer className="mr-2" /> Print Invoice
                    </Button>
                </div>
                
                <div className="border rounded-lg p-8 print:border-none print:shadow-none">
                    <header className="grid grid-cols-2 items-start gap-8 mb-10">
                        <div>
                            <Logo className="h-12 w-12 mb-4" />
                            <h2 className="text-xl font-semibold">{userProfile?.displayName || 'Your Company'}</h2>
                            <p className="text-sm text-muted-foreground">{userProfile?.email || ''}</p>
                        </div>
                        <div className="text-right">
                            <h1 className="text-3xl font-bold uppercase tracking-wider text-primary">Invoice</h1>
                            <p className="text-muted-foreground"># {transaction.id}</p>
                            <div className="mt-2">
                                <Badge variant={transaction.status === 'paid' ? 'default' : 'destructive'} className={cn(
                                    transaction.status === 'paid' && 'bg-green-500/20 text-green-700 dark:bg-green-500/10 dark:text-green-400',
                                    transaction.status === 'unpaid' && 'bg-red-500/20 text-red-700 dark:bg-red-500/10 dark:text-red-400',
                                    'capitalize'
                                )}>{transaction.status.replace('_', ' ')}</Badge>
                            </div>
                        </div>
                    </header>
                    
                    <section className="grid grid-cols-2 gap-8 mb-10">
                        <div>
                            <h3 className="font-semibold mb-2">Bill To:</h3>
                            <p className="font-medium">{transaction.recipient || 'N/A'}</p>
                            {/* Add more recipient details here if available */}
                        </div>
                        <div className="text-right">
                             <div className="grid grid-cols-2 gap-y-1">
                                <span className="font-semibold">Date of Issue:</span>
                                <span>{new Date(transaction.date).toLocaleDateString()}</span>
                                <span className="font-semibold">Due Date:</span>
                                <span>{transaction.due_on ? new Date(transaction.due_on).toLocaleDateString() : 'N/A'}</span>
                            </div>
                        </div>
                    </section>

                    <section className="mb-10">
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[60%]">Description</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {lines && lines.map(line => (
                                    <TableRow key={line.id}>
                                        <TableCell>
                                            <p className="font-medium">{line.line_title}</p>
                                            {line.description && <p className="text-xs text-muted-foreground">{line.description}</p>}
                                        </TableCell>
                                        <TableCell className="text-right">{new Intl.NumberFormat('en-US', { style: 'currency', currency: line.currency }).format(isCredit(transaction.transaction_type) ? line.credit : line.debit)}</TableCell>
                                    </TableRow>
                                ))}
                                {(!lines || lines.length === 0) && (
                                     <TableRow>
                                        <TableCell>
                                            <p className="font-medium">{transaction.title}</p>
                                            {transaction.description && <p className="text-xs text-muted-foreground">{transaction.description}</p>}
                                        </TableCell>
                                        <TableCell className="text-right">{new Intl.NumberFormat('en-US', { style: 'currency', currency: transaction.currency }).format(transaction.total_amount)}</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                            <TableFooter>
                                <TableRow>
                                    <TableCell className="text-right font-semibold">Subtotal</TableCell>
                                    <TableCell className="text-right">{new Intl.NumberFormat('en-US', { style: 'currency', currency: transaction.currency }).format(subtotal)}</TableCell>
                                </TableRow>
                                {taxAmount > 0 && (
                                    <TableRow>
                                        <TableCell className="text-right font-semibold">Tax</TableCell>
                                        <TableCell className="text-right">{new Intl.NumberFormat('en-US', { style: 'currency', currency: transaction.currency }).format(taxAmount)}</TableCell>
                                    </TableRow>
                                )}
                                <TableRow className="text-lg font-bold">
                                    <TableCell className="text-right">Total</TableCell>
                                    <TableCell className="text-right">{new Intl.NumberFormat('en-US', { style: 'currency', currency: transaction.currency }).format(transaction.total_amount)}</TableCell>
                                </TableRow>
                                {transaction.total_paid > 0 && (
                                    <TableRow>
                                        <TableCell className="text-right font-semibold">Amount Paid</TableCell>
                                        <TableCell className="text-right">-{new Intl.NumberFormat('en-US', { style: 'currency', currency: transaction.currency }).format(transaction.total_paid)}</TableCell>
                                    </TableRow>
                                )}
                                <TableRow className="text-lg font-bold">
                                    <TableCell className="text-right">Balance Due</TableCell>
                                    <TableCell className="text-right">{new Intl.NumberFormat('en-US', { style: 'currency', currency: transaction.currency }).format(transaction.balance_due)}</TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </section>
                    
                    <footer className="text-center text-sm text-muted-foreground">
                        <p>Thank you for your business!</p>
                    </footer>
                </div>
            </div>
        </div>
    );
};

export default InvoicePage;
