'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader, Printer } from 'lucide-react';
import { Button } from '@neup/components/ui/button';
import { LinkButton } from '@neup/components/ui/link-button';
import { useDocumentInvoice, useDocumentProforma, useDocumentQuotation } from '@/core/hooks/api';

function money(value: number | string, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format(Number(value) || 0);
}

// Display a saved quotation or invoice with matching document styling.
export default function SalesDocumentView({ id, type }: { id: string; type: 'quotation' | 'invoice' | 'proforma-invoice' }) {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project')?.trim();
  const documentLabel = type === 'quotation' ? 'Quotation' : type === 'invoice' ? 'Invoice' : 'Proforma Invoice';
  const backHref = `/documents/sales?type=${type}${projectId ? `&project=${encodeURIComponent(projectId)}` : ''}`;
  const quotationQuery = useDocumentQuotation(type === 'quotation' ? id : null);
  const invoiceQuery = useDocumentInvoice(type === 'invoice' ? id : null);
  const proformaQuery = useDocumentProforma(type === 'proforma-invoice' ? id : null);
  const { quotation } = quotationQuery;
  const { invoice } = invoiceQuery;
  const { proforma } = proformaQuery;
  const isLoading = quotationQuery.isLoading || invoiceQuery.isLoading || proformaQuery.isLoading;
  const error = quotationQuery.error ?? invoiceQuery.error ?? proformaQuery.error;
  const record = type === 'invoice' ? invoice : type === 'proforma-invoice' ? proforma : quotation;
  const listLabel = type === 'quotation' ? 'quotations' : type === 'invoice' ? 'invoices' : 'proforma invoices';

  if (isLoading) return <div className="flex min-h-72 items-center justify-center"><Loader className="h-7 w-7 animate-spin" /></div>;
  if (error || !record) return <main className="mx-auto max-w-4xl py-12 text-center"><h1 className="text-2xl font-bold">{documentLabel} not found</h1><p className="mt-2 text-muted-foreground">This {documentLabel.toLowerCase()} could not be loaded for the current project.</p><LinkButton href={backHref} className="mt-5">Back to {listLabel}</LinkButton></main>;

  const details = record.details ?? {};
  const currency = record.currency;
  const deadline = 'dueDate' in record ? record.dueDate : record.expires;

  return (
    <main className="mx-auto max-w-5xl space-y-5">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <LinkButton href={backHref} variant="text" preIcon={<ArrowLeft className="mr-2 h-4 w-4" />}>Back to {listLabel}</LinkButton>
        <Button onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print {documentLabel}</Button>
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
      </article>
    </main>
  );
}
