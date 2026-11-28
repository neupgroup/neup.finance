'use client';

import Link from 'next/link';
import { notFound, useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@neup/components/ui/button';
import { LinkButton } from '@neup/components/ui/link-button';
import SalesDocumentView from './sales-document-view';

const documentTypes = new Set(['quotation', 'sales-order', 'proforma-invoice', 'invoice', 'customer-payment', 'credit-note']);

// Show saved document information and link to the canonical printable view.
export default function DocumentViewPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const type = searchParams.get('type') ?? '';
  if (!params.id || !documentTypes.has(type)) notFound();
  const project = searchParams.get('project')?.trim();
  const label = type.replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  const printHref = `/print/${encodeURIComponent(params.id)}?type=${encodeURIComponent(type)}${project ? `&project=${encodeURIComponent(project)}` : ''}`;

  if (type === 'quotation' || type === 'sales-order' || type === 'invoice' || type === 'proforma-invoice') {
    return <SalesDocumentView id={params.id} type={type} />;
  }

  return <main className="mx-auto max-w-4xl space-y-5"><LinkButton href="/documents" variant="text" preIcon={<ArrowLeft className="mr-2 h-4 w-4" />}>Back to documents</LinkButton><header><h1 className="text-3xl font-bold">{label}</h1><p className="text-muted-foreground">Transaction document {params.id}</p></header><div className="flex justify-start border-t pt-4"><Link href={printHref} target="_blank"><Button variant="outlined"><Printer className="mr-2 h-4 w-4" />View {label}</Button></Link></div></main>;
}
