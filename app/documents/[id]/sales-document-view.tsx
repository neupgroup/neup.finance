'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, ArrowRight, Loader, Printer, XCircle } from 'lucide-react';
import { Button } from '@neup/components/ui/button';
import { LinkButton } from '@neup/components/ui/link-button';
import { useDocumentInvoice, useDocumentProforma, useDocumentQuotation, useDocumentSalesOrder, updateDocumentLifecycle } from '@/core/hooks/api';
import { useToast } from '@neup/core/hooks/useToast';

function money(value: number | string, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format(Number(value) || 0);
}

// Display a saved sales document with lifecycle actions and its history.
export default function SalesDocumentView({ id, type }: { id: string; type: 'quotation' | 'sales-order' | 'invoice' | 'proforma-invoice' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const projectId = searchParams.get('project')?.trim();
  const documentLabel = type === 'quotation' ? 'Quotation' : type === 'sales-order' ? 'Sales Order' : type === 'invoice' ? 'Invoice' : 'Proforma Invoice';
  const backHref = `/documents?type=${type}${projectId ? `&project=${encodeURIComponent(projectId)}` : ''}`;
  const printHref = `/print/${encodeURIComponent(id)}?type=${type}${projectId ? `&project=${encodeURIComponent(projectId)}` : ''}`;
  const quotationQuery = useDocumentQuotation(type === 'quotation' ? id : null);
  const salesOrderQuery = useDocumentSalesOrder(type === 'sales-order' ? id : null);
  const invoiceQuery = useDocumentInvoice(type === 'invoice' ? id : null);
  const proformaQuery = useDocumentProforma(type === 'proforma-invoice' ? id : null);
  const { quotation } = quotationQuery;
  const { salesOrder } = salesOrderQuery;
  const { invoice } = invoiceQuery;
  const { proforma } = proformaQuery;
  const isLoading = quotationQuery.isLoading || salesOrderQuery.isLoading || invoiceQuery.isLoading || proformaQuery.isLoading;
  const error = quotationQuery.error ?? salesOrderQuery.error ?? invoiceQuery.error ?? proformaQuery.error;
  const record = type === 'invoice' ? invoice : type === 'proforma-invoice' ? proforma : type === 'sales-order' ? salesOrder : quotation;
  const listLabel = type === 'quotation' ? 'quotations' : type === 'sales-order' ? 'sales orders' : type === 'invoice' ? 'invoices' : 'proforma invoices';

  if (isLoading) return <div className="flex min-h-72 items-center justify-center"><Loader className="h-7 w-7 animate-spin" /></div>;
  if (error || !record) return <main className="mx-auto max-w-4xl py-12 text-center"><h1 className="text-2xl font-bold">{documentLabel} not found</h1><p className="mt-2 text-muted-foreground">This {documentLabel.toLowerCase()} could not be loaded for the current project.</p><LinkButton href={backHref} className="mt-5">Back to {listLabel}</LinkButton></main>;

  const details = record.details ?? {};
  const currency = record.currency;
  const deadline = 'dueDate' in record ? record.dueDate : record.expires;
  const isCanceled = ['canceled', 'cancelled'].includes(record.status.toLowerCase());
  const hasPayment = Boolean(record.document?.targetRelationships.some((relationship) => relationship.targetDocument.type === 'customer-payment'));
  const nextLabel = type === 'quotation' ? 'Convert to Sales Order' : type === 'sales-order' ? 'Convert to Proforma Invoice' : 'Generate Invoice';
  const nextType = type === 'quotation' ? 'sales-order' : type === 'sales-order' ? 'proforma-invoice' : 'invoice';

  // Run a lifecycle transition and open the newly created document when applicable.
  const runLifecycleAction = async (action: 'cancel' | 'convert' | 'generate-invoice') => {
    if (action === 'cancel' && !window.confirm(`Cancel ${documentLabel} ${record.referenceNumber}?`)) return;
    setIsUpdating(true);
    try {
      const result = await updateDocumentLifecycle(id, { action });
      if (action === 'cancel') {
        toast({ name: 'app', title: `${documentLabel} canceled`, description: `${record.referenceNumber} has been canceled.` });
        window.location.reload();
      } else if (result.targetId) {
        const targetProject = projectId ? `&project=${encodeURIComponent(projectId)}` : '';
        router.push(`/documents/${encodeURIComponent(result.targetId)}?type=${encodeURIComponent(result.targetType ?? nextType)}${targetProject}`);
      }
    } catch (actionError) {
      toast({ name: 'app', state: 'error', title: 'Could not update document', description: actionError instanceof Error ? actionError.message : 'Please try again.' });
    } finally {
      setIsUpdating(false);
    }
  };

  const paymentHref = `/transactions/new?record=customer-payment&sourceDocumentId=${encodeURIComponent(id)}${projectId ? `&project=${encodeURIComponent(projectId)}` : ''}`;

  return (
    <main className="mx-auto max-w-5xl space-y-5">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <LinkButton href={backHref} variant="text" preIcon={<ArrowLeft className="mr-2 h-4 w-4" />}>Back to {listLabel}</LinkButton>
      </div>
      <article className="space-y-8 rounded-lg border bg-background p-6 shadow-sm md:p-10 print:border-0 print:shadow-none">
        <header className="flex flex-wrap justify-between gap-5 border-b pb-6">
          <div><p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">{documentLabel}</p><h1 className="mt-1 text-3xl font-bold">{record.subject}</h1><p className="mt-2 text-sm text-muted-foreground">Reference {record.referenceNumber}</p></div>
          <dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
            <dt className="text-muted-foreground">Status</dt><dd className="font-medium capitalize">{record.status}</dd>
            <dt className="text-muted-foreground">Date</dt><dd>{new Date(record.date).toLocaleDateString()}</dd>
            <dt className="text-muted-foreground">{type === 'quotation' ? 'Expires' : 'Due Date'}</dt><dd>{new Date(deadline).toLocaleDateString()}</dd>
            <dt className="text-muted-foreground">Currency</dt><dd>{currency} · Rate to NPR {record.exchangeRate}</dd>
          </dl>
        </header>

        <section><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Customer</p><p className="mt-1 font-semibold">{record.customer.name}</p><p className="text-sm text-muted-foreground">{record.customer.type}</p></section>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead className="border-y bg-muted/40 text-left"><tr><th className="px-3 py-3">Item</th><th className="px-3 py-3 text-right">Qty</th><th className="px-3 py-3 text-right">Rate</th><th className="px-3 py-3 text-right">Discount</th><th className="px-3 py-3 text-right">Tax</th><th className="px-3 py-3 text-right">Amount</th></tr></thead>
            <tbody>{record.items.map((item) => (
              <tr key={item.id} className="border-b">
                <td className="px-3 py-3"><p className="font-medium">{item.name}</p>{item.description ? <p className="text-xs text-muted-foreground">{item.description}</p> : null}</td>
                <td className="px-3 py-3 text-right">{item.quantity} {item.unit}</td>
                <td className="px-3 py-3 text-right">{money(item.rate, currency)}</td>
                <td className="px-3 py-3 text-right">{item.discountValue}% · {money(item.discountAmount, currency)}</td>
                <td className="px-3 py-3 text-right">{item.taxRate}% · {money(item.taxAmount, currency)}</td>
                <td className="px-3 py-3 text-right font-medium">{money(item.amount, currency)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>

        <section className="ml-auto w-full max-w-sm space-y-2 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{money(record.subtotal, currency)}</span></div>
          <div className="flex justify-between"><span>Discount</span><span>-{money(record.discountAmount, currency)}</span></div>
          <div className="flex justify-between"><span>Tax</span><span>{money(record.taxTotal, currency)}</span></div>
          <div className="flex justify-between border-t pt-3 text-lg font-bold"><span>Total</span><span>{money(record.total, currency)}</span></div>
        </section>

        {typeof details.notes === 'string' && details.notes ? <section><h2 className="font-semibold">Notes</h2><p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{details.notes}</p></section> : null}
        {typeof details.terms === 'string' && details.terms ? <section><h2 className="font-semibold">Terms and Conditions</h2><p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{details.terms}</p></section> : null}
        {record.document?.events.length ? <section className="space-y-2 border-t pt-5"><h2 className="font-semibold">Document history</h2><ol className="space-y-2">{record.document.events.map((event) => <li key={event.id} className="flex items-center justify-between gap-4 text-sm"><span className="capitalize">{event.type.replaceAll('_', ' ')}</span><time className="text-muted-foreground">{new Date(event.createdAt).toLocaleString()}</time></li>)}</ol></section> : null}
        {record.document?.sourceRelationships.length || record.document?.targetRelationships.length ? <section className="space-y-2 border-t pt-5"><h2 className="font-semibold">Related documents</h2><ul className="space-y-2">{record.document.sourceRelationships.map((relationship) => <li key={relationship.id} className="text-sm"><Link className="text-primary underline-offset-4 hover:underline" href={`/documents/${encodeURIComponent(relationship.sourceDocument.id)}?type=${encodeURIComponent(relationship.sourceDocument.type)}${projectId ? `&project=${encodeURIComponent(projectId)}` : ''}`}>{relationship.type.replaceAll('_', ' ')} · {relationship.sourceDocument.type.replaceAll('-', ' ')}</Link></li>)}{record.document.targetRelationships.map((relationship) => {
          const paymentEvent = relationship.targetDocument.events?.find((event) => event.type === 'payment_recorded');
          const transactionId = paymentEvent?.data.transactionId;
          const href = relationship.targetDocument.type === 'customer-payment' && typeof transactionId === 'string'
            ? `/transactions/${encodeURIComponent(transactionId)}${projectId ? `?project=${encodeURIComponent(projectId)}` : ''}`
            : `/documents/${encodeURIComponent(relationship.targetDocument.id)}?type=${encodeURIComponent(relationship.targetDocument.type)}${projectId ? `&project=${encodeURIComponent(projectId)}` : ''}`;
          return <li key={relationship.id} className="text-sm"><Link className="text-primary underline-offset-4 hover:underline" href={href}>{relationship.type.replaceAll('_', ' ')} · {relationship.targetDocument.type.replaceAll('-', ' ')}</Link></li>;
        })}</ul></section> : null}
      </article>
      <section className="flex flex-wrap items-center gap-3 print:hidden">
        <LinkButton href={printHref} target="_blank" preIcon={<Printer className="mr-2 h-4 w-4" />}>View {documentLabel}</LinkButton>
        {type === 'proforma-invoice' && !hasPayment && !isCanceled ? (
          <LinkButton href={paymentHref} preIcon={<ArrowRight className="mr-2 h-4 w-4" />}>Record Customer Payment</LinkButton>
        ) : null}
        {type === 'proforma-invoice' && hasPayment && !isCanceled ? (
          <Button type="button" onClick={() => runLifecycleAction('generate-invoice')} disabled={isUpdating}>
            {isUpdating ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
            Generate Invoice
          </Button>
        ) : null}
        {(type === 'quotation' || type === 'sales-order') && !isCanceled && record.status.toLowerCase() !== 'converted' ? (
          <Button type="button" onClick={() => runLifecycleAction('convert')} disabled={isUpdating}>
            {isUpdating ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
            {nextLabel}
          </Button>
        ) : null}
        {isCanceled ? <span className="text-sm font-medium text-destructive">This document is canceled.</span> : null}
        {!isCanceled && record.status.toLowerCase() !== 'converted' && type !== 'invoice' && !(type === 'proforma-invoice' && hasPayment) ? (
          <Button type="button" variant="outlined" className="border-destructive text-destructive hover:bg-destructive/10" onClick={() => runLifecycleAction('cancel')} disabled={isUpdating}>
            <XCircle className="mr-2 h-4 w-4" /> Cancel {documentLabel}
          </Button>
        ) : null}
      </section>
    </main>
  );
}
