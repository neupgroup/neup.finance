import { notFound } from 'next/navigation';
import { TransactionPrintPage } from '../transaction-print-page';
import { FinAccountTransactionDocument } from '../fin-account-transaction-document';

const supportedTypes = [
  'payment_advise',
  'payment_receipt',
  'payment_voucher',
  'receipt_voucher',
];

/* Renders a transaction as one of the available payment documents. */
export default async function PrintDocumentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ source?: string; id?: string; type?: string; accountId?: string; project?: string }>;
}) {
  const [{ id: routeId }, query] = await Promise.all([params, searchParams]);
  const id = query.id || routeId;
  const { type } = query;
  if (query.source === 'banktransaction' || type === 'bank-transaction') {
    if (!query.accountId) notFound();
    return <FinAccountTransactionDocument accountId={query.accountId} transactionId={id} projectId={query.project} mode="print" documentType={type === 'bank-transaction' ? undefined : type} />;
  }
  if (['payment_advise', 'payment_receipt', 'payment_voucher', 'receipt_voucher'].includes(type ?? '') && query.accountId) {
    return <FinAccountTransactionDocument accountId={query.accountId} transactionId={id} projectId={query.project} mode="print" documentType={type} />;
  }
  if (!type || !supportedTypes.includes(type)) notFound();
  return <TransactionPrintPage id={id} type={type} />;
}
