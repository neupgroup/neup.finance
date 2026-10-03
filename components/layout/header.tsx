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
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@neup/components/ui/avatar';

type HeaderProps = {
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

export function Header({ displayLabel, avatarSrc }: HeaderProps) {
  const { setTheme } = useTheme();
  const { signOut } = useAuthActions();
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');

  useEffect(() => {
    fetch('/api/projects', { credentials: 'include' })
      .then((response) => response.ok ? response.json() : [])
      .then((items: ProjectOption[]) => {
        setProjects(items);
        setSelectedProjectId(items.find((item) => item.selected)?.id ?? '');
      })
      .catch(() => setProjects([]));
  }, []);

  const selectProject = async (projectId: string) => {
    const response = await fetch('/api/projects/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ projectId }),
    });
    if (!response.ok) return;
    setSelectedProjectId(projectId);
    window.location.reload();
  };


  const handleLogout = async () => {
    await signOut();
    router.push('/onboarding');
  }

  return (
    <div className="flex w-full items-center justify-end gap-2 md:gap-4">
      {projects.length > 0 && (
        <select
          aria-label="Current project"
          className="max-w-40 rounded-md border bg-background px-2 py-1 text-sm"
          value={selectedProjectId}
          onChange={(event) => {
            if (event.target.value === '__new__') router.push('/projects/new');
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
          <Link href="/settings/appearance">
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
