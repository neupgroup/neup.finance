'use client';

import { ArrowLeft, Loader, Pencil, Printer, Mail, Phone } from 'lucide-react';
import { Button } from '@neup/components/ui/button';
import { LinkButton } from '@neup/components/ui/link-button';
import { useAccountProfile, useFinAccountTransactions, useParties, useProjectBooks, useSelectedProject } from '@/core/hooks/api';

type DocumentParty = {
  id: string;
  name?: string;
  type?: string;
  taxinfo?: unknown;
  contacts?: { type: string; value: string }[];
};

// Read optional strings from the flexible branding and tax metadata objects.
function getText(record: unknown, key: string) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return '';
  const value = (record as Record<string, unknown>)[key];
  return typeof value === 'string' ? value.trim() : '';
}

// Format the transaction date consistently in the document preview and printout.
function formatDocumentDate(value: string) {
  return new Date(value).toLocaleString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

// Format a currency amount using its transaction currency code.
function formatDocumentAmount(value: number) {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

// Convert a monetary amount to readable English words for receipt vouchers.
function amountInWords(value: number) {
  const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const underThousand = (number: number): string => {
    if (number < 20) return ones[number];
    if (number < 100) return `${tens[Math.floor(number / 10)]}${number % 10 ? ` ${ones[number % 10]}` : ''}`;
    return `${ones[Math.floor(number / 100)]} hundred${number % 100 ? ` ${underThousand(number % 100)}` : ''}`;
  };
  const integerToWords = (number: number): string => {
    if (number === 0) return 'zero';
    const parts: string[] = [];
    const groups: Array<[number, string]> = [[1_000_000_000, 'billion'], [1_000_000, 'million'], [1_000, 'thousand'], [1, '']];
    let remainder = Math.floor(number);
    for (const [size, label] of groups) {
      const count = Math.floor(remainder / size);
      if (count) parts.push(`${underThousand(count)}${label ? ` ${label}` : ''}`);
      remainder %= size;
    }
    return parts.join(' ');
  };
  const amount = Math.abs(Number.isFinite(value) ? value : 0);
  const whole = Math.floor(amount);
  const fraction = Math.round((amount - whole) * 100);
  return `${integerToWords(whole)}${fraction ? ` and ${fraction}/100` : ''}`;
}

// Capitalize number words while leaving scale units such as hundred and thousand lowercase.
function formatReceiptAmountWords(value: number) {
  return amountInWords(value).replace(/\b[a-z]+\b/g, (word) =>
    ['hundred', 'thousand', 'million', 'billion'].includes(word) ? word : `${word[0].toUpperCase()}${word.slice(1)}`,
  );
}

// Render one bank transaction as a client-side document with route-specific controls.
export function FinAccountTransactionDocument({ accountId, transactionId, projectId, mode, documentType = 'bank-transaction' }: {
  accountId: string;
  transactionId: string;
  projectId?: string;
  mode: 'detail' | 'print';
  documentType?: string;
}) {
  const accountHref = `/finaccounts/${encodeURIComponent(accountId)}${projectId ? `?project=${encodeURIComponent(projectId)}` : ''}`;
  const detailHref = `/finaccounts/${encodeURIComponent(accountId)}/${encodeURIComponent(transactionId)}${projectId ? `?project=${encodeURIComponent(projectId)}` : ''}`;
  const amendHref = `/finaccounts/${encodeURIComponent(accountId)}/${encodeURIComponent(transactionId)}/ammend${projectId ? `?project=${encodeURIComponent(projectId)}` : ''}`;
  const printHref = `/print/${encodeURIComponent(transactionId)}?source=banktransaction&id=${encodeURIComponent(transactionId)}&type=bank-transaction&accountId=${encodeURIComponent(accountId)}${projectId ? `&project=${encodeURIComponent(projectId)}` : ''}`;
  const { data: transactions, isLoading: areTransactionsLoading } = useFinAccountTransactions(accountId, projectId);
  const { project, isLoading: isProjectLoading } = useSelectedProject(projectId);
  const { data: parties, isLoading: arePartiesLoading } = useParties(projectId);
  const { data: books } = useProjectBooks(projectId);
  const { data: accountProfile } = useAccountProfile();
  const transaction = transactions?.find((entry) => entry.id === transactionId);
  const recipient = (parties as DocumentParty[] | undefined)?.find((entry) => entry.id === transaction?.partyId);
  const recipientName = recipient?.name?.trim() || transaction?.party?.name?.trim() || '';
  const projectDetails = project?.details;
  const branding = projectDetails && typeof projectDetails === 'object' && !Array.isArray(projectDetails)
    ? (projectDetails as Record<string, unknown>).branding
    : null;
  const companyName = project?.name || project?.account?.displayName || '';
  const companyLogo = getText(branding, 'logo');
  const companyTaxNumber = getText(branding, 'panNumber');
  const companyTaxType = getText(branding, 'taxType') || 'PAN';
  const recipientTaxInfo = recipient?.taxinfo ?? transaction?.party?.taxinfo;
  const recipientTaxNumber = getText(recipientTaxInfo, 'taxNumber');
  const recipientTaxType = getText(recipientTaxInfo, 'taxType') || 'PAN';
  const contact = (type: string) => recipient?.contacts?.find((entry) => entry.type === type)?.value;
  const isLoading = areTransactionsLoading || isProjectLoading || arePartiesLoading;
  const paymentAccount = books?.find((book) => book.id === accountId);
  const paymentMethod = paymentAccount?.type?.toLowerCase() === 'bank' ? 'Bank Payment' : paymentAccount?.type?.toLowerCase() === 'cash' ? 'Cash' : paymentAccount?.type ?? transaction?.finAccountId ?? '—';
  const isCashAccount = paymentAccount?.type?.toLowerCase() === 'cash';
  const documentTitles: Record<string, string> = {
    'bank-transaction': 'Bank Transaction Document',
    payment_advise: 'Payment Advice',
    payment_receipt: 'Payment Receipt',
    payment_voucher: 'Payment Voucher',
    receipt_voucher: 'Receipt Voucher',
  };
  const documentTitle = documentTitles[documentType] ?? 'Bank Transaction Document';
  const isIncoming = transaction?.direction === 'in';
  const isPaymentAdvice = documentType === 'payment_advise';
  const isReceiptVoucher = documentType === 'receipt_voucher';

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader className="h-7 w-7 animate-spin" /></div>;
  }

  if (!transaction) {
    return <main className="mx-auto max-w-xl p-8 text-center"><h1 className="text-2xl font-semibold">Transaction not found</h1><LinkButton href={accountHref} className="mt-5">Back to account</LinkButton></main>;
  }

  return (
    <main className="transaction-document-page min-h-screen bg-background px-4 py-6 text-foreground sm:px-8 sm:py-10">
      <style jsx global>{`
        @page { size: A4 portrait; margin: 14mm; }
        .transaction-document-sheet { width: min(100%, 210mm); min-height: 265mm; margin: 0 auto; background: hsl(var(--card)); color: hsl(var(--card-foreground)); }
.transaction-document-company-logo { width: 52px; height: 52px; object-fit: contain; }
        @media print {
          @page { size: A4 portrait; margin: 14mm; }
          html, body { background: white !important; }
          body * { visibility: hidden !important; }
          .transaction-document-sheet, .transaction-document-sheet * { visibility: visible !important; color: #111827 !important; }
          .transaction-document-page { min-height: 0 !important; padding: 0 !important; background: white !important; }
          .transaction-document-navigation, .transaction-document-actions { display: none !important; }
          .transaction-document-sheet { position: absolute; top: 0; left: 0; width: 100% !important; min-height: 0 !important; margin: 0 !important; box-shadow: none !important; }
          .transaction-document-content { padding: 0 !important; }
          .transaction-document-keep { break-inside: avoid; }
        }
        @media print and (orientation: landscape) {
          @page { size: A4 landscape; margin: 12mm; }
        }
      `}</style>

      <div className="transaction-document-navigation mx-auto mb-5 flex w-full max-w-[210mm] items-center justify-between gap-3">
        <LinkButton href={mode === 'detail' ? accountHref : detailHref} variant="text" preIcon={<ArrowLeft className="mr-2 h-4 w-4" />}>
          {mode === 'detail' ? 'Back to account' : 'Back to transaction'}
        </LinkButton>
      </div>

      <article className="transaction-document-sheet flex flex-col overflow-hidden rounded-lg border border-border shadow-xl">
        <div className="transaction-document-content flex flex-1 flex-col p-8 sm:p-12">
          <header className="flex flex-col justify-between gap-6 border-b border-border pb-7 sm:flex-row sm:items-start">
            <div className="flex min-w-0 flex-col items-start gap-4">
              {companyLogo ? <img src={companyLogo} alt={`${companyName || 'Company'} logo`} className="transaction-document-company-logo" /> : null}
              <div className="min-w-0">
                {companyName ? <h1 className="text-2xl font-bold tracking-tight">{companyName}</h1> : null}
                {companyTaxNumber ? <p className="mt-1 text-sm">{companyTaxType}: {companyTaxNumber}</p> : null}
                {getText(branding, 'location') ? <p className="mt-1 text-sm text-muted-foreground">{getText(branding, 'location')}</p> : null}
                {getText(branding, 'phone') || getText(branding, 'email') ? <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
                  {getText(branding, 'phone') ? <span className="inline-flex items-center gap-2"><Phone className="h-4 w-4" />{getText(branding, 'phone')}</span> : null}
                  {getText(branding, 'email') ? <span className="inline-flex items-center gap-2 break-all"><Mail className="h-4 w-4 shrink-0" />{getText(branding, 'email')}</span> : null}
                </div> : null}
              </div>
            </div>
            {isReceiptVoucher ? <div className="text-left sm:text-right"><p className="text-sm font-bold">Receipt Voucher</p><p className="mt-2 text-sm text-muted-foreground">{formatDocumentDate(transaction.activityOn)}</p></div> : null}
          </header>

          {isPaymentAdvice ? (
            <section className="transaction-document-keep mt-7 space-y-0">
              <div className="border-b border-border pb-5 text-center"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Payment Advice</p><h2 className="mt-2 text-2xl font-bold">Payment has been sent</h2><p className="mt-2 text-sm text-muted-foreground">Please use the details below to identify and reconcile this payment.</p></div>
              <div className="grid gap-4 rounded-sm border border-border p-5 sm:grid-cols-2"><div><p className="text-xs uppercase tracking-wide text-muted-foreground">Payee</p><p className="mt-1 font-semibold">{recipientName || '—'}</p></div><div><p className="text-xs uppercase tracking-wide text-muted-foreground">Payment date</p><p className="mt-1 font-medium">{formatDocumentDate(transaction.activityOn)}</p></div><div><p className="text-xs uppercase tracking-wide text-muted-foreground">Payment reference</p><p className="mt-1 font-medium">{transaction.title}</p></div><div><p className="text-xs uppercase tracking-wide text-muted-foreground">Payment method</p><p className="mt-1 font-medium">{transaction.finAccountId || 'Bank transfer'}</p></div></div>
              <div className="flex items-end justify-between border-b-2 border-border pb-4"><span className="text-sm font-semibold uppercase tracking-wide">Amount paid</span><span className="text-3xl font-bold">{transaction.currency} {formatDocumentAmount(transaction.amount)}</span></div>
              {transaction.description ? <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Payment details</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{transaction.description}</p></div> : null}
              <p className="text-sm text-muted-foreground">If you have questions about this payment, please contact {companyName || 'the sender'}.</p>
            </section>
          ) : isReceiptVoucher ? (
            <section className="transaction-document-keep mt-7 space-y-0">
              <p className="text-base leading-7">Received a sum of:</p>
              <div className="text-left text-base leading-8">
                <p><span className="border-b border-dotted border-foreground/70">{transaction.currency === 'NPR' ? 'NRS' : transaction.currency} {formatReceiptAmountWords(transaction.amount)} only ({transaction.currency} {formatDocumentAmount(transaction.amount)})</span></p>
                <p><span className="font-semibold">On</span> <span className="border-b border-dotted border-foreground/70">{formatDocumentDate(transaction.activityOn)}</span></p>
                <p><span className="font-semibold">For</span> <span className="border-b border-dotted border-foreground/70">{transaction.title}</span></p>
              </div>
              <div className="pt-8 text-base leading-7">
                <p className="font-semibold">From:</p>
                <p><span className="border-b border-dotted border-foreground/70">{recipientName || '—'}</span> by <span className="border-b border-dotted border-foreground/70">{paymentMethod}</span></p>
                {recipientTaxNumber ? <p>{recipientTaxType}: <span className="border-b border-dotted border-foreground/70">{recipientTaxNumber}</span></p> : null}
                {contact('address') ? <p><span className="border-b border-dotted border-foreground/70">{contact('address')}</span></p> : null}
                <div className="flex flex-wrap gap-x-5 gap-y-1">
                  {contact('phone') ? <span className="border-b border-dotted border-foreground/70">{contact('phone')}</span> : null}
                  {contact('email') ? <span className="border-b border-dotted border-foreground/70">{contact('email')}</span> : null}
                </div>
              </div>
              {transaction.description ? <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Notes</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{transaction.description}</p></div> : null}
              <div className={`mt-auto pt-36 text-sm ${isCashAccount ? 'grid grid-cols-2 items-end' : 'flex justify-start'}`}>
                {isCashAccount ? <div className="w-fit border-t border-border pt-2"><p className="font-semibold">Received by:</p><p>{accountProfile?.displayName || '________________'}</p></div> : null}
                <div className={`w-fit border-t border-border pt-2 ${isCashAccount ? 'ml-auto text-right' : 'text-left'}`}><p className="font-semibold">Verified by:</p><p>{accountProfile?.displayName || '________________'}</p></div>
              </div>
            </section>
          ) : (
            <section className="transaction-document-keep mt-7 rounded-sm border border-border p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{documentTitle}</p>
              <p className="mt-3 text-base font-normal">{transaction.currency} {formatDocumentAmount(transaction.amount)} was {isIncoming ? 'received' : 'sent'}{recipientName ? ` ${isIncoming ? 'from' : 'to'} ${recipientName}` : ''} on {formatDocumentDate(transaction.activityOn)}</p>
              <h2 className="mt-1 text-lg font-medium leading-tight">{transaction.title}</h2>
            </section>
          )}

          {recipientName && !isReceiptVoucher ? <section className="transaction-document-keep mt-6 border border-border p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{isIncoming ? 'Received from' : documentType === 'payment_advise' ? 'Payment to' : 'Pay to'}</p>
              <p className="mt-2 text-base font-semibold">{recipientName}</p>
              {recipientTaxNumber ? <p className="mt-2 text-xs">{recipientTaxType}: {recipientTaxNumber}</p> : null}
              {contact('address') ? <p className="mt-2 text-xs text-muted-foreground">{contact('address')}</p> : null}
              {contact('phone') ? <p className="mt-1 text-xs text-muted-foreground">Phone: {contact('phone')}</p> : null}
              {contact('email') ? <p className="mt-1 break-all text-xs text-muted-foreground">Email: {contact('email')}</p> : null}
            </section> : null}

          {transaction.description ? <section className="mt-7 border-t border-border pt-5"><h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Description</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{transaction.description}</p></section> : null}

          {documentType !== 'receipt_voucher' ? <footer className="mt-auto border-t border-border pt-3">
            <p className="text-xs text-muted-foreground">{documentType === 'payment_advise' ? 'Please use this advice as the payment reference.' : documentType === 'payment_voucher' ? 'Authorized payment voucher.' : documentType === 'payment_receipt' ? 'Received with thanks.' : 'This document records the bank transaction.'}</p>
          </footer> : null}
        </div>
      </article>

      <div className="transaction-document-actions mx-auto mt-5 flex w-full max-w-[210mm] items-center justify-between gap-3">
        <LinkButton href={amendHref} variant="outlined" size="sm" preIcon={<Pencil className="mr-2 h-4 w-4" />}>Amend transaction</LinkButton>
        {mode === 'detail'
          ? <LinkButton href={printHref} variant="outlined" size="sm" preIcon={<Printer className="mr-2 h-4 w-4" />}>Print document</LinkButton>
          : <Button onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print document</Button>}
      </div>
    </main>
  );
}
