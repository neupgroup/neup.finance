'use client';

import { notFound } from 'next/navigation';
import { useParams, useSearchParams } from 'next/navigation';
import { TransactionPrintPage } from '@/app/print/transaction-print-page';
import SalesDocumentView from './sales-document-view';

const documentTypes = new Set([
  'quotation',
  'sales-order',
  'proforma-invoice',
  'invoice',
  'customer-payment',
  'credit-note',
]);

// Display a saved transaction using the selected sales document view.
export default function DocumentViewPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const type = searchParams.get('type') ?? '';

  if (!params.id || !documentTypes.has(type)) notFound();

  if (type === 'quotation' || type === 'invoice' || type === 'proforma-invoice') return <SalesDocumentView id={params.id} type={type} />;
  return <TransactionPrintPage id={params.id} type={type} />;
}
