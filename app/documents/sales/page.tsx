'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, Plus, ReceiptText } from 'lucide-react';
import { Badge } from '@neup/components/ui/badge';
import { Button } from '@neup/components/ui/button';
import { useDocumentInvoices, useDocumentProformas, useDocumentQuotations, useTransactionsList } from '@/core/hooks/api';

const salesDocumentTypes = [
  ['quotation', 'Quotation'],
  ['sales-order', 'Sales Order'],
  ['proforma-invoice', 'Proforma Invoice'],
  ['invoice', 'Invoice'],
  ['customer-payment', 'Customer Payment'],
  ['credit-note', 'Credit Note'],
] as const;

// Display the selected sales document type and related saved sales transactions.
export default function SalesDocumentsPage() {
  const searchParams = useSearchParams();
  const type = searchParams.get('type') ?? '';
  const selectedType = salesDocumentTypes.find(([value]) => value === type);
  const projectId = searchParams.get('project')?.trim();
  const { data: transactions, isLoading } = useTransactionsList();
  const { quotations, isLoading: areQuotationsLoading } = useDocumentQuotations(type === 'quotation');
  const { invoices, isLoading: areInvoicesLoading } = useDocumentInvoices(type === 'invoice');
  const { proformas, isLoading: areProformasLoading } = useDocumentProformas(type === 'proforma-invoice');
  const salesTransactions = (transactions ?? []).filter((transaction) =>
    ['sales', 'receivable'].includes(String(transaction.category).toLowerCase()) ||
    ['sale', 'income', 'refund'].includes(String(transaction.transaction_type).toLowerCase())
  );
  const withProject = (href: string) => {
    const url = new URL(href, 'https://documents.local');
    if (projectId) url.searchParams.set('project', projectId);
    return `${url.pathname}${url.search}${url.hash}`;
  };
  const newHref = withProject(`/documents/sales/new?type=${encodeURIComponent(selectedType?.[0] ?? 'invoice')}`);

  return (
    <main className="mx-auto max-w-4xl space-y-6">
      <div className="space-y-3">
        <Link href={withProject('/documents')} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to record types
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{selectedType?.[1] ?? 'Sales documents'}</h1>
              {selectedType ? <Badge variant="outline">Sales</Badge> : null}
            </div>
            <p className="text-muted-foreground">{selectedType ? `Review ${selectedType[1].toLowerCase()} records or create a new one.` : 'Choose a sales document type to get started.'}</p>
          </div>
          {selectedType ? <Button asChild><Link href={newHref}><Plus className="mr-2 h-4 w-4" />New {selectedType[1]}</Link></Button> : null}
        </div>
      </div>

      {!selectedType ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {salesDocumentTypes.map(([value, label]) => (
            <Link key={value} href={withProject(`/documents/sales?type=${value}`)} className="rounded-lg border p-4 transition-colors hover:bg-muted/40">
              <span className="font-medium">{label}</span>
              <span className="mt-1 block text-sm text-muted-foreground">Open {label.toLowerCase()} records</span>
            </Link>
          ))}
        </div>
      ) : type === 'quotation' ? (areQuotationsLoading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading quotations…</p>
      ) : quotations.length ? (
        <div className="overflow-hidden divide-y rounded-lg border">
          {quotations.map((quotation) => (
            <Link key={quotation.id} href={withProject(`/documents/${encodeURIComponent(quotation.id)}?type=quotation`)} className="flex items-center justify-between gap-4 p-4 hover:bg-muted/40">
              <span className="flex min-w-0 items-center gap-3">
                <ReceiptText className="h-5 w-5 shrink-0 text-muted-foreground" />
                <span className="min-w-0"><span className="block truncate font-medium">{quotation.subject}</span><span className="block text-sm text-muted-foreground">{quotation.referenceNumber} · {new Date(quotation.date).toLocaleDateString()} · {quotation.status}</span></span>
              </span>
              <span className="flex items-center gap-2 whitespace-nowrap font-medium">{new Intl.NumberFormat('en-US', { style: 'currency', currency: quotation.currency }).format(Number(quotation.total))}<ArrowUpRight className="h-4 w-4 text-muted-foreground" /></span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed px-6 py-12 text-center"><ReceiptText className="mx-auto h-8 w-8 text-muted-foreground" /><h2 className="mt-3 font-semibold">No quotations yet</h2><p className="mt-1 text-sm text-muted-foreground">Create a quotation to see it here.</p><Button asChild className="mt-4"><Link href={newHref}><Plus className="mr-2 h-4 w-4" />New Quotation</Link></Button></div>
      )) : type === 'invoice' ? (areInvoicesLoading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading invoices…</p>
      ) : invoices.length ? (
        <div className="overflow-hidden divide-y rounded-lg border">
          {invoices.map((invoice) => (
            <Link key={invoice.id} href={withProject(`/documents/${encodeURIComponent(invoice.id)}?type=invoice`)} className="flex items-center justify-between gap-4 p-4 hover:bg-muted/40">
              <span className="flex min-w-0 items-center gap-3">
                <ReceiptText className="h-5 w-5 shrink-0 text-muted-foreground" />
                <span className="min-w-0"><span className="block truncate font-medium">{invoice.subject}</span><span className="block text-sm text-muted-foreground">{invoice.referenceNumber} · {new Date(invoice.date).toLocaleDateString()} · {invoice.status}</span></span>
              </span>
              <span className="flex items-center gap-2 whitespace-nowrap font-medium">{new Intl.NumberFormat('en-US', { style: 'currency', currency: invoice.currency }).format(Number(invoice.total))}<ArrowUpRight className="h-4 w-4 text-muted-foreground" /></span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed px-6 py-12 text-center"><ReceiptText className="mx-auto h-8 w-8 text-muted-foreground" /><h2 className="mt-3 font-semibold">No invoices yet</h2><p className="mt-1 text-sm text-muted-foreground">Create an invoice to see it here.</p><Button asChild className="mt-4"><Link href={newHref}><Plus className="mr-2 h-4 w-4" />New Invoice</Link></Button></div>
      )) : type === 'proforma-invoice' ? (areProformasLoading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading proforma invoices…</p>
      ) : proformas.length ? (
        <div className="overflow-hidden divide-y rounded-lg border">
          {proformas.map((proforma) => (
            <Link key={proforma.id} href={withProject(`/documents/${encodeURIComponent(proforma.id)}?type=proforma-invoice`)} className="flex items-center justify-between gap-4 p-4 hover:bg-muted/40">
              <span className="flex min-w-0 items-center gap-3">
                <ReceiptText className="h-5 w-5 shrink-0 text-muted-foreground" />
                <span className="min-w-0"><span className="block truncate font-medium">{proforma.subject}</span><span className="block text-sm text-muted-foreground">{proforma.referenceNumber} · {new Date(proforma.date).toLocaleDateString()} · {proforma.status}</span></span>
              </span>
              <span className="flex items-center gap-2 whitespace-nowrap font-medium">{new Intl.NumberFormat('en-US', { style: 'currency', currency: proforma.currency }).format(Number(proforma.total))}<ArrowUpRight className="h-4 w-4 text-muted-foreground" /></span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed px-6 py-12 text-center"><ReceiptText className="mx-auto h-8 w-8 text-muted-foreground" /><h2 className="mt-3 font-semibold">No proforma invoices yet</h2><p className="mt-1 text-sm text-muted-foreground">Create a proforma invoice to see it here.</p><Button asChild className="mt-4"><Link href={newHref}><Plus className="mr-2 h-4 w-4" />New Proforma Invoice</Link></Button></div>
      )) : isLoading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading sales records…</p>
      ) : salesTransactions.length ? (
        <div className="overflow-hidden rounded-lg border divide-y">
          {salesTransactions.map((transaction) => (
            <Link key={transaction.id} href={withProject(`/documents/${encodeURIComponent(transaction.id)}?type=${encodeURIComponent(selectedType[0])}`)} className="flex items-center justify-between gap-4 p-4 hover:bg-muted/40">
              <span className="flex min-w-0 items-center gap-3">
                <ReceiptText className="h-5 w-5 shrink-0 text-muted-foreground" />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{transaction.title}</span>
                  <span className="block text-sm text-muted-foreground">{new Date(transaction.date).toLocaleDateString()} · {transaction.status}</span>
                </span>
              </span>
              <span className="flex items-center gap-2 whitespace-nowrap font-medium">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: transaction.currency }).format(transaction.total_amount)}
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed px-6 py-12 text-center">
          <ReceiptText className="mx-auto h-8 w-8 text-muted-foreground" />
          <h2 className="mt-3 font-semibold">No sales records yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">Create a {selectedType[1].toLowerCase()} to see it here.</p>
          <Button asChild className="mt-4"><Link href={newHref}><Plus className="mr-2 h-4 w-4" />New {selectedType[1]}</Link></Button>
        </div>
      )}
    </main>
  );
}
