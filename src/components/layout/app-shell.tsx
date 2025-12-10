'use client';

import React from 'react';
import Link from 'next/link';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarTrigger } from '@/components/ui/sidebar';
import { MainNav } from './main-nav';
import { Logo } from '../icons';
import { Header } from './header';
import { Skeleton } from '@/components/ui/skeleton';

function AppShellContent({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = React.useState(true);
    
    React.useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 500); // Simulate loading
        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen w-full bg-background text-foreground">
                <header className="sticky top-0 z-10 flex h-16 items-center border-b bg-background shadow">
                    <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-4 lg:px-6">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-8 w-8 md:hidden" />
                             <Link href="/" className="flex items-center gap-2 font-semibold">
                                <Logo className="h-8 w-8" />
                                <span className="hidden sm:inline">NeupLedger</span>
                            </Link>
                        </div>
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-9 w-36 rounded-md hidden sm:block" />
                            <Skeleton className="h-9 w-9 rounded-full" />
                        </div>
                    </div>
                </header>
                <div className="mx-auto grid w-full max-w-[1440px] lg:grid-cols-[280px_1fr] xl:grid-cols-[320px_1fr]">
                    <aside className="hidden h-[calc(100vh-4rem)] flex-col border-r lg:sticky lg:top-16 lg:flex">
                        <div className="flex flex-1 flex-col overflow-y-auto p-4 space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="space-y-2 p-2">
                                    {[...Array(2)].map((_, j) => (
                                        <Skeleton key={j} className="h-8 w-full" />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </aside>
                    <main className="min-h-[calc(100vh-4rem)] p-6 lg:p-8">
                        <Skeleton className="h-96 w-full" />
                    </main>
                </div>
            </div>
        );
    }
    
    return (
         <div className="min-h-screen w-full bg-background text-foreground">
            <header className="sticky top-0 z-10 flex h-16 items-center border-b bg-background shadow">
                <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-4 lg:px-6">
                    <div className='flex items-center gap-2'>
                        <SidebarTrigger className="md:hidden"/>
                        <Link href="/" className="items-center gap-2 font-semibold hidden md:flex">
                            <Logo className="h-8 w-8" />
                            <span>NeupLedger</span>
                        </Link>
                    </div>
                    <Header />
                </div>
            </header>
            <div className="mx-auto grid w-full max-w-[1440px] lg:grid-cols-[280px_1fr] xl:grid-cols-[320px_1fr]">
                <Sidebar className="hidden h-[calc(100vh-4rem)] flex-col border-r bg-background lg:sticky lg:top-16 lg:flex p-2">
                    <SidebarContent>
                        <MainNav />
                    </SidebarContent>
                </Sidebar>
                <main className="min-h-[calc(100vh-4rem)] p-4 md:p-6 lg:p-8">
                    <div className="w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}


export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppShellContent>{children}</AppShellContent>
    </SidebarProvider>
  );
}
