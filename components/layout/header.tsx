'use client';

import { useEffect, useState } from 'react';

import {
  LogOut,
  Moon,
  Settings,
  Sun,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@neup/components/ui/button';
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
import { Avatar, AvatarFallback, AvatarImage } from '@neup/components/ui/avatar';
import { useUser } from '@/core/providers/auth';
import { useAccountProfile } from '@/core/hooks/api';
import { Logo } from '../icons';

type ShellIdentity = {
  displayLabel: string;
  avatarSrc: string | null;
};

type ProjectOption = { id: string; name: string; roles: string[]; selected: boolean };

function getInitials(value?: string | null) {
  if (!value) return 'A';
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'A';
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
}

function getShellIdentityKey(userId?: string | null) {
  return userId ? `shell_identity_${userId}` : null;
}

function readShellIdentity(userId?: string | null): ShellIdentity {
  if (typeof window === 'undefined') return { displayLabel: '...', avatarSrc: null };
  const key = getShellIdentityKey(userId);
  if (!key) return { displayLabel: '...', avatarSrc: null };
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return { displayLabel: '...', avatarSrc: null };
    const parsed = JSON.parse(raw) as Partial<ShellIdentity> & { label?: string };
    return {
      displayLabel: typeof parsed.displayLabel === 'string' && parsed.displayLabel.trim()
        ? parsed.displayLabel
        : typeof parsed.label === 'string' && parsed.label.trim() ? parsed.label : '...',
      avatarSrc: typeof parsed.avatarSrc === 'string' && parsed.avatarSrc.trim() ? parsed.avatarSrc : null,
    };
  } catch {
    return { displayLabel: '...', avatarSrc: null };
  }
}

function useShellIdentity() {
  const { user } = useUser();
  const { data: userProfile } = useAccountProfile();
  const [identity, setIdentity] = useState<ShellIdentity>(() => readShellIdentity(user?.uid));

  useEffect(() => {
    setIdentity(readShellIdentity(user?.uid));
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid || !userProfile) return;
    const nextIdentity: ShellIdentity = {
      displayLabel: userProfile.displayName || user.displayName || 'My Account',
      avatarSrc: userProfile.displayImage || user.photoURL || null,
    };
    setIdentity(nextIdentity);
    const key = getShellIdentityKey(user.uid);
    if (key) window.localStorage.setItem(key, JSON.stringify(nextIdentity));
  }, [user?.uid, user?.displayName, user?.photoURL, userProfile]);

  return identity;
}

export function HeaderBrand() {
  const { displayLabel } = useShellIdentity();
  return (
    <Link href="/" className="hidden items-center gap-2 font-semibold md:flex">
      <Logo className="h-8 w-8" />
      <span className="flex flex-col">
        <span>Neup.Ledger</span>
        <span className="text-xs font-normal text-muted-foreground">{displayLabel}</span>
      </span>
    </Link>
  );
}

export function Header() {
  const { displayLabel, avatarSrc } = useShellIdentity();
  const { setTheme } = useTheme();
  const { signOut } = useAuthActions();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');

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

  useEffect(() => {
    const project = new URLSearchParams(window.location.search).get('project');
    const projectsUrl = new URL('/bridge/api.v1/projects', window.location.origin);
    if (project) projectsUrl.searchParams.set('project', project);
    fetch(`${projectsUrl.pathname}${projectsUrl.search}`, { credentials: 'include' })
      .then((response) => response.ok ? response.json() : [])
      .then((items: ProjectOption[]) => {
        setProjects(items);
        setSelectedProjectId(project ?? items.find((item) => item.selected)?.id ?? '');
      })
      .catch(() => setProjects([]));
  }, []);

  const selectProject = async (projectId: string) => {
    const response = await fetch('/bridge/api.v1/projects/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ projectId }),
    });
    if (!response.ok) return;
    setSelectedProjectId(projectId);
    const url = new URL(window.location.href);
    url.searchParams.set('project', projectId);
    window.location.assign(url.toString());
  };


  const handleLogout = async () => {
    await signOut();
    router.push('/switch');
  }

  return (
    <div className="flex w-full items-center justify-end gap-2 md:gap-4">
      {projects.length > 0 && (
        <select
          aria-label="Current project"
          className="max-w-40 rounded-md border bg-background px-2 py-1 text-sm"
          value={selectedProjectId}
          onChange={(event) => {
            if (event.target.value === '__new__') {
              const url = new URL('/switch/new', window.location.origin);
              url.searchParams.set('project', selectedProjectId);
              router.push(`${url.pathname}${url.search}`);
            }
            else void selectProject(event.target.value);
          }}
        >
          {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          <option value="__new__">Create project…</option>
        </select>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarImage src={avatarSrc || undefined} alt="User avatar" />
              <AvatarFallback>
                {getInitials(displayLabel)}
              </AvatarFallback>
            </Avatar>
            <span className="sr-only">Toggle user menu</span>
          </Button>
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
