'use client';

import Link from 'next/link';
import { notFound, useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@neup/components/ui/button';
import { LinkButton } from '@neup/components/ui/link-button';
import { useDocumentInvoice, useDocumentProforma, useDocumentQuotation } from '@/core/hooks/api';

const documentTypes = new Set(['quotation', 'sales-order', 'proforma-invoice', 'invoice', 'customer-payment', 'credit-note']);

// Show saved document information and link to the canonical printable view.
export default function DocumentViewPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const type = searchParams.get('type') ?? '';
  const quotationQuery = useDocumentQuotation(type === 'quotation' ? params.id : null);
  const invoiceQuery = useDocumentInvoice(type === 'invoice' ? params.id : null);
  const proformaQuery = useDocumentProforma(type === 'proforma-invoice' ? params.id : null);
  if (!params.id || !documentTypes.has(type)) notFound();

  const record = type === 'quotation' ? quotationQuery.quotation : type === 'invoice' ? invoiceQuery.invoice : type === 'proforma-invoice' ? proformaQuery.proforma : null;
  const query = type === 'quotation' ? quotationQuery : type === 'invoice' ? invoiceQuery : proformaQuery;
  const project = searchParams.get('project')?.trim();
  const label = type.replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  const printHref = `/print/${encodeURIComponent(params.id)}?type=${encodeURIComponent(type)}${project ? `&project=${encodeURIComponent(project)}` : ''}`;

  if (type === 'quotation' || type === 'invoice' || type === 'proforma-invoice') {
    if (query.isLoading) return <div className="p-8 text-center">Loading {label.toLowerCase()}…</div>;
    if (!record) return <main className="p-8 text-center"><h1 className="text-xl font-semibold">{label} not found</h1></main>;
    return <main className="mx-auto max-w-4xl space-y-6">
      <LinkButton href={`/documents/sales?type=${type}${project ? `&project=${encodeURIComponent(project)}` : ''}`} variant="text" preIcon={<ArrowLeft className="mr-2 h-4 w-4" />}>Back to {label}s</LinkButton>
      <header><p className="text-sm text-muted-foreground">{record.referenceNumber} · {new Date(record.date).toLocaleDateString()}</p><h1 className="text-3xl font-bold">{record.subject}</h1><p className="mt-1 text-muted-foreground">{record.customer.name}</p></header>
      <section className="grid gap-5 rounded-lg border p-5 sm:grid-cols-3"><div><p className="text-sm text-muted-foreground">Status</p><p className="font-medium capitalize">{record.status}</p></div><div><p className="text-sm text-muted-foreground">Total</p><p className="font-semibold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: record.currency }).format(Number(record.total))}</p></div><div><p className="text-sm text-muted-foreground">Date</p><p>{new Date(record.date).toLocaleDateString()}</p></div></section>
      <div className="flex justify-start border-t pt-4"><Link href={printHref}><Button variant="outlined"><Printer className="mr-2 h-4 w-4" />Print {label}</Button></Link></div>
    </main>;
  }

  return <main className="mx-auto max-w-4xl space-y-5"><LinkButton href="/documents" variant="text" preIcon={<ArrowLeft className="mr-2 h-4 w-4" />}>Back to documents</LinkButton><header><h1 className="text-3xl font-bold">{label}</h1><p className="text-muted-foreground">Transaction document {params.id}</p></header><div className="flex justify-start border-t pt-4"><Link href={printHref}><Button variant="outlined"><Printer className="mr-2 h-4 w-4" />View {label}</Button></Link></div></main>;
}
