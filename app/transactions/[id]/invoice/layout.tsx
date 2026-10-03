import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Invoice',
  description: 'Transaction Invoice',
};

export default function InvoiceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
