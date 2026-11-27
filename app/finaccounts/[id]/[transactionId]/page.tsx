'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { FinAccountTransactionDocument } from '@/app/print/fin-account-transaction-document';

// Show the client-rendered transaction document with account-page controls.
export default function FinAccountTransactionDetailPage() {
  const params = useParams<{ id: string; transactionId: string }>();
  const searchParams = useSearchParams();
  return (
    <FinAccountTransactionDocument
      accountId={params.id}
      transactionId={params.transactionId}
      projectId={searchParams.get('project')?.trim()}
      mode="detail"
    />
  );
}
