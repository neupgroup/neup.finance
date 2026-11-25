'use client';

import AddTransactionPage from '@/app/transactions/add/page';
import { useSearchParams } from 'next/navigation';
import QuotationForm, { SalesDocumentForm } from './quotation-form';

// Reuse the existing transaction entry flow with the selected sales document type.
export default function NewSalesDocumentPage() {
  const searchParams = useSearchParams();
  if (searchParams.get('type') === 'quotation') return <QuotationForm />;
  if (searchParams.get('type') === 'invoice') return <SalesDocumentForm type="invoice" />;
  return <AddTransactionPage />;
}
