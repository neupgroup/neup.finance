'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowUpRight, Plus, ReceiptText } from 'lucide-react';
import { Badge } from '@neup/components/ui/badge';
import { LinkButton } from '@neup/components/ui/link-button';
import { Skeleton } from '@neup/components/ui/skeleton';
import { useDocumentInvoices, useDocumentProformas, useDocumentQuotations, useDocumentSalesOrders, useTransactionsList } from '@/core/hooks/api';

const documentTypes = [
  ['quotation', 'Quotation'],
  ['sales-order', 'Sales Order'],
  ['proforma-invoice', 'Proforma Invoice'],
  ['customer-payment', 'Customer Payment'],
  ['invoice', 'Invoice'],
  ['credit-note', 'Credit Note'],
  ['purchase-order', 'Purchase Order'],
  ['purchase-bill', 'Purchase Bill'],
  ['supplier-payment', 'Supplier Payment'],
  ['debit-note', 'Debit Note'],
  ['purchase', 'Purchase'],
] as const;

type DocumentType = (typeof documentTypes)[number][0];

const salesDocumentTypes = new Set<DocumentType>(['quotation', 'sales-order', 'proforma-invoice', 'invoice']);
const transactionDocumentTypes = new Set<DocumentType>([
  'customer-payment', 'credit-note', 'purchase-order', 'purchase-bill', 'supplier-payment', 'debit-note', 'purchase',
]);

type DocumentListItem = {
  id: string;
  title: string;
  reference: string;
  date: string;
  status: string;
  type: DocumentType;
  currency: string;
  amount: number;
  href: string;
};

// Resolve a transaction's document stage, using saved type metadata or legacy category fields.
function getTransactionDocumentType(transaction: Record<string, any>): DocumentType | null {
  const details = transaction.details && typeof transaction.details === 'object' && !Array.isArray(transaction.details)
    ? transaction.details as Record<string, unknown>
    : {};
  const savedType = details.documentType;
  if (typeof savedType === 'string' && documentTypes.some(([value]) => value === savedType)) {
    return savedType as DocumentType;
  }

  const category = String(transaction.category ?? '').toLowerCase();
  const transactionType = String(transaction.transaction_type ?? '').toLowerCase();
  if (category === 'receivable') return 'customer-payment';
  if (category === 'payable') return 'supplier-payment';
  if (category === 'purchase') return transactionType === 'income' ? 'debit-note' : 'purchase';
  if (category === 'sales') return transactionType === 'expense' ? 'credit-note' : null;
  return null;
}

// Format a document amount using its saved currency.
function formatDocumentAmount(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

// Build a stable URL that keeps the selected project in the document flow.
function withProject(href: string, projectId: string | null) {
  const url = new URL(href, 'https://documents.local');
  if (projectId) url.searchParams.set('project', projectId);
  return `${url.pathname}${url.search}${url.hash}`;
}

// Show placeholder rows that match the document list while its records load.
function DocumentListSkeleton() {
  return (
    <div className="overflow-hidden divide-y rounded-lg border" aria-label="Loading documents" aria-busy="true">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="flex items-center justify-between gap-4 bg-card p-4">
          <div className="flex min-w-0 items-center gap-3">
            <Skeleton className="h-5 w-5 shrink-0" />
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-3 w-48 max-w-full" />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-4" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Display sales and purchase lifecycle records together with their stage and current status.
export default function SalesDocumentsPage() {
  const searchParams = useSearchParams();
  const type = searchParams.get('type') ?? '';
  const selectedType = documentTypes.find(([value]) => value === type);
  const projectId = searchParams.get('project')?.trim() || null;
  const { data: transactions, isLoading: areTransactionsLoading } = useTransactionsList();
  const { quotations, isLoading: areQuotationsLoading } = useDocumentQuotations(!selectedType || type === 'quotation');
  const { salesOrders, isLoading: areSalesOrdersLoading } = useDocumentSalesOrders(!selectedType || type === 'sales-order');
  const { proformas, isLoading: areProformasLoading } = useDocumentProformas(!selectedType || type === 'proforma-invoice');
  const { invoices, isLoading: areInvoicesLoading } = useDocumentInvoices(!selectedType || type === 'invoice');

  const documentItems: DocumentListItem[] = [
    ...quotations.map((record) => ({
      id: record.id,
      title: record.subject,
      reference: record.referenceNumber,
      date: record.date,
      status: record.status,
      type: 'quotation' as const,
      currency: record.currency,
      amount: Number(record.total),
      href: `/documents/${encodeURIComponent(record.id)}?type=quotation`,
    })),
    ...salesOrders.map((record) => ({
      id: record.id,
      title: record.subject,
      reference: record.referenceNumber,
      date: record.date,
      status: record.status,
      type: 'sales-order' as const,
      currency: record.currency,
      amount: Number(record.total),
      href: `/documents/${encodeURIComponent(record.id)}?type=sales-order`,
    })),
    ...proformas.map((record) => ({
      id: record.id,
      title: record.subject,
      reference: record.referenceNumber,
      date: record.date,
      status: record.status,
      type: 'proforma-invoice' as const,
      currency: record.currency,
      amount: Number(record.total),
      href: `/documents/${encodeURIComponent(record.id)}?type=proforma-invoice`,
    })),
    ...invoices.map((record) => ({
      id: record.id,
      title: record.subject,
      reference: record.referenceNumber,
      date: record.date,
      status: record.status,
      type: 'invoice' as const,
      currency: record.currency,
      amount: Number(record.total),
      href: `/documents/${encodeURIComponent(record.id)}?type=invoice`,
    })),
    ...(transactions ?? [])
      .flatMap((record) => {
        const recordType = getTransactionDocumentType(record);
        if (!recordType) return [];
        const label = documentTypes.find(([value]) => value === recordType)?.[1] ?? 'Document';
        return [{
        id: record.id,
        title: record.title,
        reference: record.reference_number ?? record.referenceNumber ?? label,
        date: record.date,
        status: record.status,
        type: recordType,
        currency: record.currency,
        amount: Number(record.total_amount),
        href: `/transactions/${encodeURIComponent(record.id)}`,
        }];
      }),
  ];

  const displayedItems = (selectedType
    ? documentItems.filter((item) => item.type === selectedType[0])
    : documentItems
  ).sort((first, second) => new Date(second.date).getTime() - new Date(first.date).getTime());

  const isLoading = (!selectedType || type === 'quotation') && areQuotationsLoading
    || (!selectedType || type === 'sales-order') && areSalesOrdersLoading
    || (!selectedType || type === 'proforma-invoice') && areProformasLoading
    || (!selectedType || type === 'invoice') && areInvoicesLoading
    || (!selectedType || transactionDocumentTypes.has(type as DocumentType)) && areTransactionsLoading;
  const newHref = selectedType
    ? salesDocumentTypes.has(selectedType[0])
      ? withProject(`/documents/new?type=${encodeURIComponent(selectedType[0])}`, projectId)
      : selectedType[0] === 'purchase'
        ? withProject('/documents/add', projectId)
        : withProject(`/transactions/new?record=${encodeURIComponent(selectedType[0])}`, projectId)
    : withProject('/documents/new?type=invoice', projectId);
  const newLabel = selectedType ? selectedType[0] === 'purchase' ? 'Add a document' : `New ${selectedType[1]}` : 'New Invoice';

  return (
    <main className="mx-auto max-w-5xl space-y-6">
      <div className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
              <Badge variant="outline">{selectedType ? 'Documents' : 'All stages'}</Badge>
            </div>
            <p className="text-muted-foreground">Track sales and purchase documents, payments, and their current status in one place.</p>
          </div>
        </div>
      </div>

      <nav aria-label="Filter documents" className="flex flex-wrap gap-2">
        <Link href={withProject('/documents', projectId)} aria-current={!selectedType ? 'page' : undefined} className={`rounded-md border px-3 py-2 text-sm transition-colors hover:bg-muted ${!selectedType ? 'border-primary bg-primary/10 font-medium text-foreground' : 'text-muted-foreground'}`}>
          All stages
        </Link>
        {documentTypes.map(([value, label]) => (
          <Link key={value} href={withProject(`/documents?type=${value}`, projectId)} aria-current={type === value ? 'page' : undefined} className={`rounded-md border px-3 py-2 text-sm transition-colors hover:bg-muted ${type === value ? 'border-primary bg-primary/10 font-medium text-foreground' : 'text-muted-foreground'}`}>
            {label}
          </Link>
        ))}
      </nav>

      <Link href={withProject('/documents/add', projectId)} className="flex items-center justify-between gap-4 rounded-lg border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-muted/40">
        <span className="flex min-w-0 items-center gap-3">
          <span className="rounded-full bg-muted p-2"><Plus className="h-5 w-5 text-muted-foreground" /></span>
          <span className="min-w-0">
            <span className="block font-semibold">Add document</span>
            <span className="block text-sm text-muted-foreground">Choose a sales, purchase, or accounting record to create.</span>
          </span>
        </span>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </Link>

      {isLoading ? (
        <DocumentListSkeleton />
      ) : displayedItems.length ? (
        <div className="overflow-hidden divide-y rounded-lg border">
          {displayedItems.map((item) => {
            const label = documentTypes.find(([value]) => value === item.type)?.[1] ?? 'Document';
            const detailsHref = withProject(item.href, projectId);

            return (
              <Link key={`${item.type}-${item.id}`} href={detailsHref} className="flex items-center justify-between gap-4 bg-card p-4 transition-colors hover:bg-muted/50">
                <span className="flex min-w-0 items-center gap-3">
                  <ReceiptText className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-medium">{item.title}</span>
                      <Badge variant="outline">{label}</Badge>
                      <Badge variant="secondary" className="capitalize">{String(item.status).replaceAll('_', ' ')}</Badge>
                    </span>
                    <span className="block text-sm text-muted-foreground">{item.reference} · {new Date(item.date).toLocaleDateString()}</span>
                  </span>
                </span>
                <span className="flex items-center gap-2 whitespace-nowrap font-medium">
                  {formatDocumentAmount(item.amount, item.currency)}
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </span>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed px-6 py-12 text-center">
          <ReceiptText className="mx-auto h-8 w-8 text-muted-foreground" />
          <h2 className="mt-3 font-semibold">No {selectedType ? `${selectedType[1].toLowerCase()} records` : 'documents'} yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">Create a {selectedType ? selectedType[1].toLowerCase() : 'document'} to see it here.</p>
          <LinkButton href={newHref} className="mt-4" preIcon={<Plus className="mr-2 h-4 w-4" />}>{newLabel}</LinkButton>
        </div>
      )}
    </main>
  );
}
