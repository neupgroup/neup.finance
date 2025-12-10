'use client';

import React from 'react';
import { SidebarProvider, Sidebar, SidebarInset, SidebarHeader, SidebarContent } from '@/components/ui/sidebar';
import { Header } from './header';
import { MainNav } from './main-nav';
import { Logo } from '../icons';
import Link from 'next/link';
import { Button } from '../ui/button';
import { CircleUser } from 'lucide-react';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(true);
  
  React.useEffect(() => {
    const cookieValue = document.cookie
      .split('; ')
      .find((row) => row.startsWith('sidebar_state='))
      ?.split('=')[1];
    if (cookieValue !== undefined) {
      setOpen(cookieValue === 'true');
    }
  }, []);

  return (
    <SidebarProvider open={open} onOpenChange={setOpen}>
        <Sidebar collapsible="icon" className="border-r">
          <SidebarHeader className="h-16 border-b justify-center">
            <Link href="/" className="flex items-center gap-2 font-semibold">
                <Logo className="h-8 w-8" />
                <span className="sr-only">NeupLedger</span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <MainNav />
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
            <Header />
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
              {children}
            </main>
        </SidebarInset>
    </SidebarProvider>
  );
}
