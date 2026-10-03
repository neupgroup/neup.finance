'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SidebarProvider, Sidebar, SidebarTrigger } from '@neup/components/ui/sidebar';
import { MainNav } from './main-nav';
import { Logo } from '../icons';
import { Header } from './header';
import { useUser } from '@/core/providers/auth';
import { useAccountProfile } from '@/core/hooks/api';

type ShellIdentity = {
    label: string;
    avatarSrc: string | null;
};

function getShellIdentityKey(userId?: string | null) {
    return userId ? `shell_identity_${userId}` : null;
}

function readShellIdentity(userId?: string | null): ShellIdentity {
    if (typeof window === 'undefined') {
        return { label: '...', avatarSrc: null };
    }

    const key = getShellIdentityKey(userId);
    if (!key) return { label: '...', avatarSrc: null };

    try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return { label: '...', avatarSrc: null };
        const parsed = JSON.parse(raw) as Partial<ShellIdentity>;
        return {
            label: typeof parsed.label === 'string' && parsed.label.trim() ? parsed.label : '...',
            avatarSrc: typeof parsed.avatarSrc === 'string' && parsed.avatarSrc.trim() ? parsed.avatarSrc : null,
        };
    } catch {
        return { label: '...', avatarSrc: null };
    }
}

function AppShellContent({ children }: { children: React.ReactNode }) {
    const { user, isUserLoading } = useUser();
    const router = useRouter();

    const { data: userProfile } = useAccountProfile();
    const [shellIdentity, setShellIdentity] = useState<ShellIdentity>(() => readShellIdentity(user?.uid));

    useEffect(() => {
        setShellIdentity(readShellIdentity(user?.uid));
    }, [user?.uid]);

    useEffect(() => {
        if (!user?.uid || !userProfile) return;

        const resolvedLabel = userProfile.displayName || user.displayName || 'My Account';
        const resolvedAvatarSrc = userProfile.displayImage || user.photoURL || null;
        const nextIdentity: ShellIdentity = {
            label: resolvedLabel,
            avatarSrc: resolvedAvatarSrc,
        };

        setShellIdentity(nextIdentity);

        const key = getShellIdentityKey(user.uid);
        if (key) {
            window.localStorage.setItem(key, JSON.stringify(nextIdentity));
        }
    }, [user?.uid, user?.displayName, user?.photoURL, userProfile]);

    useEffect(() => {
        // The middleware now handles the primary redirection logic.
        // This effect can be simplified or used for other client-side-only checks if needed.
        if (!isUserLoading && !user) {
            router.push('/onboarding');
        }
    }, [user, isUserLoading, router]);

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
                                <span className="text-xs font-normal text-muted-foreground">{shellIdentity.label}</span>
                            </div>
                        </Link>
                    </div>
                    <Header
                        displayLabel={shellIdentity.label}
                        avatarSrc={shellIdentity.avatarSrc}
                    />
                </div>
            </header>
            <div className="mx-auto grid w-full max-w-[1440px] lg:grid-cols-[280px_1fr] xl:grid-cols-[320px_1fr]">
                <Sidebar className="hidden h-[calc(100vh-4rem)] flex-col border-r bg-background lg:sticky lg:top-16 lg:flex p-2">
                    <MainNav />
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
