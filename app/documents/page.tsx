'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, BookOpen, ClipboardList, FileText, ReceiptText, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@neup/components/ui/card';

const recordGroups = [
  {
    title: 'Sales',
    description: 'Create sales documents and record money received.',
    icon: ArrowUpRight,
    records: [
      ['quotation', 'Quotation', 'Prepare a price offer for a customer.', FileText],
      ['sales-order', 'Sales Order', 'Record a confirmed customer order.', ClipboardList],
      ['proforma-invoice', 'Proforma Invoice', 'Prepare a preliminary invoice.', ReceiptText],
      ['invoice', 'Invoice', 'Bill a customer for goods or services.', ReceiptText],
      ['customer-payment', 'Customer Payment', 'Record money received from a customer.', Wallet],
      ['credit-note', 'Credit Note', 'Record a credit issued to a customer.', FileText],
    ] as const,
  },
  {
    title: 'Purchase',
    description: 'Record supplier orders, bills, and payments.',
    icon: ArrowDownLeft,
    records: [
      ['purchase-order', 'Purchase Order', 'Record an order placed with a supplier.', ClipboardList],
      ['purchase-bill', 'Purchase Bill', 'Record a supplier bill to pay.', ReceiptText],
      ['supplier-payment', 'Supplier Payment', 'Record money paid to a supplier.', Wallet],
      ['debit-note', 'Debit Note', 'Record a debit issued to a supplier.', FileText],
    ] as const,
  },
  {
    title: 'Accounting',
    description: 'Record transfers, quick entries, and journal adjustments.',
    icon: ArrowLeftRight,
    records: [
      ['cash-transfer', 'Cash Transfer', 'Move money between accounts.', ArrowLeftRight],
      ['quick-receipt', 'Quick Receipt (in)', 'Record money received without a sales document.', ArrowUpRight],
      ['quick-payment', 'Quick Payment (out)', 'Record money paid without a purchase document.', ArrowDownLeft],
      ['journal-voucher', 'Journal Voucher', 'Record an accounting adjustment.', BookOpen],
    ] as const,
  },
];

// Show the available record types and link each one to its tailored entry route.
export default function DocumentsPage() {
  const searchParams = useSearchParams();

  const recordHref = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('record', slug);
    if (slug === 'journal-voucher') {
      params.delete('record');
      const project = params.toString();
      return `/documents/accounting/journal-voucher/new${project ? `?${project}` : ''}`;
    }
    return `/transactions/add?${params.toString()}`;
  };

  const salesDocumentHref = (slug: string) => {
    const params = new URLSearchParams();
    params.set('type', slug);
    const projectId = searchParams.get('project')?.trim();
    if (projectId) params.set('project', projectId);
    return `/documents/sales?${params.toString()}`;
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-primary">New record</p>
        <h1 className="text-3xl font-bold tracking-tight">What would you like to record?</h1>
        <p className="text-muted-foreground">Choose a document or accounting entry to get started.</p>
      </header>

      <div className="grid gap-5 lg:grid-cols-3">
        {recordGroups.map((group) => {
          const GroupIcon = group.icon;
          return (
            <Card key={group.title}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className="rounded-lg bg-primary/10 p-2 text-primary"><GroupIcon className="h-5 w-5" /></span>
                  <div>
                    <CardTitle>{group.title}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">{group.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {group.records.map(([slug, label, description, Icon]) => (
                  <Link
                    key={slug}
                    href={group.title === 'Sales' ? salesDocumentHref(slug) : recordHref(slug)}
                    className="group flex items-start gap-3 rounded-lg border p-3 transition-colors hover:border-primary/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{label}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
                    </span>
                  </Link>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
