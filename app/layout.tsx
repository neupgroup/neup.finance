import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@neup/core/utils';
import { Suspense } from 'react';
import { Toaster } from '@neup/components/ui/toaster';
import { ProgressBar } from '@neup/components/element/progressbar';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/core/providers/auth';
import { Outfit } from 'next/font/google';
import { SidebarProvider, Sidebar } from '@neup/components/ui/sidebar';
import { Header, HeaderBrand } from '@/components/layout/header';
import { MainNav } from '@/components/layout/main-nav';

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
        <Suspense fallback={null}>
          <ProgressBar />
        </Suspense>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <SidebarProvider className="min-h-0">
              <div className="app-frame w-full bg-background text-foreground">
                <header className="sticky top-0 z-10 flex h-16 items-center border-b bg-background shadow">
                  <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-4 lg:px-6">
                    <div className="flex items-center gap-4">
                      <HeaderBrand />
                    </div>
                    <Header />
                  </div>
                </header>
                <div className="mx-auto grid w-full max-w-[1440px] lg:grid-cols-[280px_1fr] xl:grid-cols-[320px_1fr]">
                  <Sidebar className="hidden h-[calc(100vh-4rem)] flex-col border-r border-sidebar-border p-2 lg:sticky lg:top-16 lg:flex">
                    <MainNav />
                  </Sidebar>
                  <main className="p-4 md:p-6 lg:p-8">
                    <div className="w-full">{children}</div>
                  </main>
                </div>
              </div>
            </SidebarProvider>
          </AuthProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
