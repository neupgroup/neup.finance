
'use client';

import { useRouter } from 'next/navigation';
import { useUser } from '@/core/providers/auth';
import { useUserProfile, useTransactionById, useTransactionLines } from '@/core/hooks/api';
import { Button } from '@neup/components/ui/button';
import { ArrowLeft, Printer, Loader } from 'lucide-react';
import { Logo } from '@/components/icons';
import {
    formatInvoiceCurrency,
    getInvoiceLineAmount,
    getInvoiceRecipientName,
    getInvoiceSubtotal,
    getInvoiceTaxAmount,
} from '@/services/transactions/invoice';

/*
::neup.documentation::transaction-print-page
::function TransactionPrintPage(props)

Renders a printable transaction invoice.

::param external props
::datatype { id: string }
::required true

The transaction identifier to print.

::returns
::datatype JSX.Element

The printable transaction invoice UI.

::end
*/
export function TransactionPrintPage({ id }: { id: string }) {
    const router = useRouter();

    const { user } = useUser();

    const { data: userProfile } = useUserProfile(user?.uid);

    const { data: transaction, isLoading: isTransactionLoading } = useTransactionById(id);
    
    const { data: lines, isLoading: areLinesLoading } = useTransactionLines(id);

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
    
    const subtotal = getInvoiceSubtotal(transaction, lines);
    const taxAmount = getInvoiceTaxAmount(transaction, subtotal);
    const recipientName = getInvoiceRecipientName(transaction);
    const invoiceLines = lines && lines.length > 0 ? lines : undefined;

    return (
        <div className="min-h-screen bg-slate-200 text-slate-950 print:bg-white">
            <style jsx global>{`
                @page {
                    size: A4;
                    margin: 0;
                }

                @media print {
                    html,
                    body {
                        background: white !important;
                    }
                }
            `}</style>

            <div className="sticky top-0 z-10 border-b bg-background/95 px-4 py-3 shadow-sm backdrop-blur print:hidden">
                <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
                    <Button variant="ghost" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Transaction
                    </Button>
                    <Button onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" /> Print Invoice
                    </Button>
                </div>
            </div>

            <div className="overflow-auto px-4 py-8 print:overflow-visible print:p-0">
                <article className="mx-auto flex min-h-[297mm] w-[210mm] flex-col bg-white p-[18mm] shadow-2xl ring-1 ring-black/10 print:h-[297mm] print:w-[210mm] print:shadow-none print:ring-0">
                    <header className="border-b border-slate-200 pb-10">
                        <div className="space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-white">
                                    <Logo className="h-9 w-9" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">From</p>
                                    <h2 className="mt-1 text-2xl font-semibold">{userProfile?.displayName || 'Your Company'}</h2>
                                    {userProfile?.connection_id && (
                                        <p className="mt-1 text-sm text-slate-500">{userProfile.connection_id}</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Invoice to</p>
                                <p className="mt-2 text-xl font-semibold">{recipientName}</p>
                                <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
                                    {transaction.description || 'Transaction invoice generated from your finance ledger.'}
                                </p>
                            </div>
                        </div>
                    </header>

                    <section className="flex-1 py-8">
                        <table className="w-full border-collapse text-left text-sm">
                            <thead>
                                <tr className="border-y border-slate-200 text-xs uppercase tracking-[0.18em] text-slate-500">
                                    <th className="py-4 font-semibold">Description</th>
                                    <th className="py-4 text-right font-semibold">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {invoiceLines ? invoiceLines.map((line) => (
                                    <tr key={line.id}>
                                        <td className="py-5 pr-8 align-top">
                                            <p className="font-semibold">{line.line_title}</p>
                                            {line.description && <p className="mt-1 text-xs leading-5 text-slate-500">{line.description}</p>}
                                        </td>
                                        <td className="py-5 text-right align-top font-semibold">
                                            {formatInvoiceCurrency(getInvoiceLineAmount(transaction.transaction_type, line), line.currency)}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td className="py-5 pr-8 align-top">
                                            <p className="font-semibold">{transaction.title}</p>
                                            {transaction.description && <p className="mt-1 text-xs leading-5 text-slate-500">{transaction.description}</p>}
                                        </td>
                                        <td className="py-5 text-right align-top font-semibold">
                                            {formatInvoiceCurrency(transaction.total_amount, transaction.currency)}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </section>

                    <section className="grid grid-cols-[1fr_280px] gap-10 border-t border-slate-200 pt-8">
                        <div className="rounded-2xl bg-slate-50 p-5">
                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Notes</p>
                            <p className="mt-3 text-sm leading-6 text-slate-600">
                                Thank you for your business. Please reference invoice #{transaction.id} when making payment.
                            </p>
                        </div>

                        <dl className="space-y-3 text-sm">
                            <div className="flex justify-between gap-6">
                                <dt className="text-slate-500">Subtotal</dt>
                                <dd className="font-semibold">{formatInvoiceCurrency(subtotal, transaction.currency)}</dd>
                            </div>
                            {taxAmount > 0 && (
                                <div className="flex justify-between gap-6">
                                    <dt className="text-slate-500">Tax</dt>
                                    <dd className="font-semibold">{formatInvoiceCurrency(taxAmount, transaction.currency)}</dd>
                                </div>
                            )}
                            <div className="flex justify-between gap-6 border-t border-slate-200 pt-3">
                                <dt className="text-slate-500">Total</dt>
                                <dd className="font-semibold">{formatInvoiceCurrency(transaction.total_amount, transaction.currency)}</dd>
                            </div>
                            {transaction.total_paid > 0 && (
                                <div className="flex justify-between gap-6">
                                    <dt className="text-slate-500">Amount paid</dt>
                                    <dd className="font-semibold">-{formatInvoiceCurrency(transaction.total_paid, transaction.currency)}</dd>
                                </div>
                            )}
                            <div className="mt-4 rounded-2xl bg-slate-950 p-5 text-white">
                                <dt className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">Balance due</dt>
                                <dd className="mt-2 text-2xl font-bold">{formatInvoiceCurrency(transaction.balance_due, transaction.currency)}</dd>
                            </div>
                        </dl>
                    </section>
                </article>
            </div>
        </div>
    );
}
