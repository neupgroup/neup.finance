'use client';

import { ArrowLeft, Loader, Pencil, Printer } from 'lucide-react';
import { Button } from '@neup/components/ui/button';
import { LinkButton } from '@neup/components/ui/link-button';
import { useFinAccountTransactions, useParties, useSelectedProject } from '@/core/hooks/api';

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

// Render one bank transaction as a client-side document with route-specific controls.
export function FinAccountTransactionDocument({ accountId, transactionId, projectId, mode }: {
  accountId: string;
  transactionId: string;
  projectId?: string;
  mode: 'detail' | 'print';
}) {
  const accountHref = `/finaccounts/${encodeURIComponent(accountId)}${projectId ? `?project=${encodeURIComponent(projectId)}` : ''}`;
  const detailHref = `/finaccounts/${encodeURIComponent(accountId)}/${encodeURIComponent(transactionId)}${projectId ? `?project=${encodeURIComponent(projectId)}` : ''}`;
  const amendHref = `/finaccounts/${encodeURIComponent(accountId)}/${encodeURIComponent(transactionId)}/ammend${projectId ? `?project=${encodeURIComponent(projectId)}` : ''}`;
  const printHref = `/print?type=bank-transaction&accountId=${encodeURIComponent(accountId)}&transactionId=${encodeURIComponent(transactionId)}${projectId ? `&project=${encodeURIComponent(projectId)}` : ''}`;
  const { data: transactions, isLoading: areTransactionsLoading } = useFinAccountTransactions(accountId, projectId);
  const { project, isLoading: isProjectLoading } = useSelectedProject(projectId);
  const { data: parties, isLoading: arePartiesLoading } = useParties(projectId);
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
        .transaction-document-company-logo { width: 76px; height: 76px; object-fit: contain; }
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
                {getText(branding, 'phone') ? <p className="mt-1 text-sm text-muted-foreground">Phone: {getText(branding, 'phone')}</p> : null}
                {getText(branding, 'email') ? <p className="mt-1 break-all text-sm text-muted-foreground">Email: {getText(branding, 'email')}</p> : null}
              </div>
            </div>
          </header>

          <section className="transaction-document-keep mt-7 rounded-sm border border-border p-5 sm:p-6">
            <p className="text-base font-normal">
              {transaction.currency}{recipientName ? ` ${formatDocumentAmount(transaction.amount)}` : ''} was {transaction.direction === 'in' ? 'Received' : 'sent'}{recipientName ? ` ${transaction.direction === 'in' ? 'from' : 'to'} ${recipientName}` : ''} on {formatDocumentDate(transaction.activityOn)}
            </p>
            <h2 className="mt-1 text-lg font-medium leading-tight">{transaction.title}</h2>
          </section>

          {recipientName ? <section className="transaction-document-keep mt-6 border border-border p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{transaction.direction === 'in' ? 'Sender' : 'Recipient'}</p>
              <p className="mt-2 text-base font-semibold">{recipientName}</p>
              {recipientTaxNumber ? <p className="mt-2 text-xs">{recipientTaxType}: {recipientTaxNumber}</p> : null}
              {contact('address') ? <p className="mt-2 text-xs text-muted-foreground">{contact('address')}</p> : null}
              {contact('phone') ? <p className="mt-1 text-xs text-muted-foreground">Phone: {contact('phone')}</p> : null}
              {contact('email') ? <p className="mt-1 break-all text-xs text-muted-foreground">Email: {contact('email')}</p> : null}
            </section> : null}

          {transaction.description ? <section className="mt-7 border-t border-border pt-5"><h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Description</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{transaction.description}</p></section> : null}

          <footer className="mt-auto border-t border-border pt-3">
            <p className="text-xs text-muted-foreground">This document records the bank transaction.</p>
          </footer>
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
