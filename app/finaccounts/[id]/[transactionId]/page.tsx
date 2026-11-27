'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@neup/components/ui/button';
import { LinkButton } from '@neup/components/ui/link-button';
import { useFinAccountTransactions } from '@/core/hooks/api';

// Show the bank transaction details and link to its dedicated print view.
export default function FinAccountTransactionDetailPage() {
  const params = useParams<{ id: string; transactionId: string }>();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project')?.trim();
  const { data: transactions, isLoading } = useFinAccountTransactions(params.id, projectId);
  const transaction = transactions?.find((entry) => entry.id === params.transactionId);
  const accountHref = `/finaccounts/${encodeURIComponent(params.id)}${projectId ? `?project=${encodeURIComponent(projectId)}` : ''}`;
  const documentTypes = transaction?.direction === 'in'
    ? [['payment_receipt', 'Payment Receipt'], ['receipt_voucher', 'Receipt Voucher'], ['payment_advise', 'Payment Advice']]
    : [['payment_voucher', 'Payment Voucher'], ['payment_advise', 'Payment Advice']];
  const makePrintHref = (type: string) => `/print/${encodeURIComponent(params.transactionId)}?source=banktransaction&id=${encodeURIComponent(params.transactionId)}&type=${type}&accountId=${encodeURIComponent(params.id)}${projectId ? `&project=${encodeURIComponent(projectId)}` : ''}`;

  if (isLoading) return <div className="p-8 text-center">Loading transaction…</div>;
  if (!transaction) return <main className="p-8 text-center"><h1 className="text-xl font-semibold">Transaction not found</h1><LinkButton href={accountHref} className="mt-4">Back to account</LinkButton></main>;
  return <main className="mx-auto max-w-4xl space-y-6">
    <LinkButton href={accountHref} variant="text" preIcon={<ArrowLeft className="mr-2 h-4 w-4" />}>Back to account</LinkButton>
    <header><p className="text-sm text-muted-foreground">{new Date(transaction.activityOn).toLocaleDateString()}</p><h1 className="text-3xl font-bold">{transaction.title}</h1></header>
    <section className="grid gap-5 rounded-lg border p-5 sm:grid-cols-2">
      <div><p className="text-sm text-muted-foreground">Amount</p><p className="text-2xl font-semibold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: transaction.currency }).format(transaction.amount)}</p></div>
      <div><p className="text-sm text-muted-foreground">Direction</p><p className="font-medium">{transaction.direction === 'in' ? 'Received' : 'Sent'}</p></div>
      <div><p className="text-sm text-muted-foreground">Status</p><p className="font-medium capitalize">{transaction.status}</p></div>
      <div><p className="text-sm text-muted-foreground">Party</p><p className="font-medium">{transaction.party?.name || '—'}</p></div>
      {transaction.description ? <div className="sm:col-span-2"><p className="text-sm text-muted-foreground">Description</p><p className="whitespace-pre-wrap">{transaction.description}</p></div> : null}
    </section>
    <div className="flex flex-wrap justify-start gap-2 border-t pt-4">
      <Link href={makePrintHref(transaction.direction === 'in' ? 'payment_receipt' : 'payment_voucher')}><Button><Printer className="mr-2 h-4 w-4" />Print document</Button></Link>
      {documentTypes.map(([type, label]) => <Link key={type} href={makePrintHref(type)}><Button variant="outlined"><Printer className="mr-2 h-4 w-4" />{label}</Button></Link>)}
    </div>
  </main>;
}
