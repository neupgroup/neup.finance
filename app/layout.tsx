import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@neup/core/utils';
import { Outfit } from 'next/font/google';
import ClientLayout from './layout.client';
import { getLayoutAccount } from './layout.server';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'Neup.Ledger',
  description: 'The first surreal-AI financial universe that simplifies accounts for everyone.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const account = await getLayoutAccount();

  return (
    <html lang="en" suppressHydrationWarning className={outfit.variable}>
      <body className={cn("font-body antialiased")}>
        <ClientLayout account={account}>{children}</ClientLayout>
      </body>
    </html>
  );
}
