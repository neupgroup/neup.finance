import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@neup/core/utils';
import BaseRootLayout from '@neup/components/layout/RootLayout';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/core/providers/auth';
import { Outfit } from 'next/font/google';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'Neup.Ledger',
  description: 'The first surreal-AI financial universe that simplifies accounts for everyone.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={outfit.variable}>
      <body className={cn("font-body antialiased")}>
        <BaseRootLayout>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>{children}</AuthProvider>
          </ThemeProvider>
        </BaseRootLayout>
      </body>
    </html>
  );
}
