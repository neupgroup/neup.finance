'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SidebarProvider, Sidebar, SidebarContent, SidebarTrigger } from '@/components/ui/sidebar';
import { MainNav } from './main-nav';
import { Logo } from '../icons';
import { Header } from './header';
import { useUser } from '@/auth/provider';
import { useUserProfile } from '@/hooks/api';
import { Loader } from 'lucide-react';

// Define a type for the user profile data
type UserProfile = {
    displayName: string;
    accountId: string;
}

function AppShellContent({ children }: { children: React.ReactNode }) {
    const { user, isUserLoading } = useUser();
    const router = useRouter();

    const { data: userProfile, isLoading: isProfileLoading } = useUserProfile(user?.uid);

    useEffect(() => {
        // The middleware now handles the primary redirection logic.
        // This effect can be simplified or used for other client-side-only checks if needed.
        if (!isUserLoading && !user) {
            router.push('/onboarding');
        }
    }, [user, isUserLoading, router]);

    if (isUserLoading || (user && isProfileLoading) || !userProfile) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center bg-background">
                <Loader className="h-10 w-10 animate-spin" />
            </div>
        )
    }
    
    return (
         <div className="min-h-screen w-full bg-background text-foreground">
            <header className="sticky top-0 z-10 flex h-16 items-center border-b bg-background shadow">
                <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-4 lg:px-6">
                    <div className='flex items-center gap-4'>
                        <SidebarTrigger className="md:hidden"/>
                        <Link href="/" className="items-center gap-2 font-semibold hidden md:flex">
                            <Logo className="h-8 w-8" />
                            <div className="flex flex-col">
                                <span>Neup.Ledger</span>
                                {userProfile?.accountId && <span className="text-xs font-normal text-muted-foreground">{userProfile.accountId}</span>}
                            </div>
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
