'use client';

import { useEffect } from 'react';

import {
  LogOut,
  Moon,
  Settings,
  Sun,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent
} from '@neup/components/ui/dropdown-menu';
import { useAuthActions } from '@/core/providers/auth';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Userbar } from '@neup/components/element/userbar';
import { Logo } from '../icons';

export type HeaderAccount = {
  displayName: string | null;
  displayImage: string | null;
  neupid: string | null;
};

function getShellIdentity(account: HeaderAccount | null) {
  return {
    displayLabel: account?.displayName?.trim() || 'My Account',
    avatarSrc: account?.displayImage || null,
    neupid: account?.neupid || '',
  };
}

export function HeaderBrand({ account }: { account: HeaderAccount | null }) {
  return (
    <Link href="/" className="hidden items-center gap-2 font-semibold md:flex">
      <Logo className="h-8 w-8" />
      <span>Neup.Ledger</span>
    </Link>
  );
}

export function Header({ account }: { account: HeaderAccount | null }) {
  const { displayLabel, avatarSrc, neupid } = getShellIdentity(account);
  const { setTheme } = useTheme();
  const { signOut } = useAuthActions();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const projectId = new URLSearchParams(window.location.search).get('project');
    if (!projectId) return;

    const addProject = (value: string | URL) => {
      const url = new URL(value.toString(), window.location.origin);
      if (url.origin !== window.location.origin || url.pathname.startsWith('/api') || url.pathname.startsWith('/_next')) {
        return value.toString();
      }
      if (!url.searchParams.has('project')) url.searchParams.set('project', projectId);
      return `${url.pathname}${url.search}${url.hash}`;
    };

    const originalPushState = window.history.pushState.bind(window.history);
    const originalReplaceState = window.history.replaceState.bind(window.history);
    window.history.pushState = (state, unused, url) => {
      originalPushState(state, unused, url == null ? url : addProject(url.toString()));
    };
    window.history.replaceState = (state, unused, url) => {
      originalReplaceState(state, unused, url == null ? url : addProject(url.toString()));
    };

    const preserveProject = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest('a') : null;
      if (!target || target.target === '_blank') return;
      const href = target.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      const url = new URL(href, window.location.origin);
      if (url.origin !== window.location.origin || url.pathname.startsWith('/bridge/api.v1')) return;
      if (!url.searchParams.has('project')) {
        url.searchParams.set('project', projectId);
        target.setAttribute('href', `${url.pathname}${url.search}${url.hash}`);
      }
    };

    document.addEventListener('click', preserveProject, true);
    return () => {
      document.removeEventListener('click', preserveProject, true);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, []);

  const handleLogout = async () => {
    await signOut();
    router.push('/switch');
  }

  return (
    <div className="flex w-full items-center justify-end gap-2 md:gap-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Userbar
            displayName={displayLabel}
            displayImage={avatarSrc}
            neupid={neupid}
            role="button"
            tabIndex={0}
            aria-label="Toggle user menu"
            className="cursor-pointer"
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{displayLabel}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <Link href={`/settings/appearance${searchParams.get('project') ? `?project=${encodeURIComponent(searchParams.get('project')!)}` : ''}`}>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4"/>
              <span>Settings</span>
            </DropdownMenuItem>
          </Link>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="ml-2">Toggle theme</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => setTheme('light')}>Light</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')}>Dark</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')}>System</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
