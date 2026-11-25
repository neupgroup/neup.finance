
'use client';

/*
::neup.documentation::main-sidebar-navigation
::title Main Sidebar Navigation

Defines the primary sidebar destinations for the finance app shell.

::end
*/

import { usePathname, useSearchParams } from 'next/navigation';
import {
  ArrowLeftRight,
  BarChart,
  FileText,
  Home,
  Landmark,
  Settings,
  BookText,
  Users,
  BriefcaseBusiness,
  Repeat2,
  PlusCircle,
} from 'lucide-react';
import { NavLink } from '@neup/components/ui/nav-link';
import { useSidebar } from '@neup/components/ui/sidebar';
import type { MouseEvent } from 'react';

const menuItems = [
  { href: '/home', label: 'Dashboard', icon: Home },
  { href: '/finaccounts', label: 'Accounts', icon: Landmark },
  { href: '/party', label: 'Party', icon: Users },
  { href: '/documents', label: 'Documents', icon: PlusCircle },
  { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { href: '/projections', label: 'Projections', icon: BarChart },
  { href: '/report', label: 'Reports', icon: FileText },
  { href: '/journal', label: 'Journal', icon: BookText },
];

export function MainNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { setOpenMobile } = useSidebar();
  const withProject = (href: string) => {
    const url = new URL(href, 'https://sidebar.local');
    searchParams.forEach((value, key) => {
      if (!url.searchParams.has(key)) url.searchParams.set(key, value);
    });
    const projectId = searchParams.get('project')?.trim();
    if (projectId) url.searchParams.set('project', projectId);
    return `${url.pathname}${url.search}${url.hash}`;
  };

  const handleLinkClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const currentProjectId = new URLSearchParams(window.location.search).get('project')?.trim();
    if (currentProjectId) {
      const target = new URL(event.currentTarget.href, window.location.origin);
      target.searchParams.set('project', currentProjectId);
      event.currentTarget.href = `${target.pathname}${target.search}${target.hash}`;
    }
    setOpenMobile(false);
  };

  return (
    <nav className="grid items-start gap-2">
      {menuItems.map((item, index) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <NavLink
            key={index}
            href={withProject(item.href)}
            active={isActive}
            alignment="left"
            className="w-full"
            onClick={handleLinkClick}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        );
      })}
      <NavLink
        href={withProject('/switch')}
        active={pathname.startsWith('/switch')}
        alignment="left"
        className="w-full"
        onClick={handleLinkClick}
      >
        <Repeat2 className="h-5 w-5" />
        Switch project
      </NavLink>
      <div className="pt-2">
        <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground">
          <BriefcaseBusiness className="h-5 w-5" />
          Manage
        </div>
        <NavLink
          href={withProject('/manage/accounts')}
          active={pathname.startsWith('/manage/accounts')}
          alignment="left"
          className="w-full"
          onClick={handleLinkClick}
        >
          <Landmark className="h-5 w-5" />
          Accounts
        </NavLink>
      </div>
      <div className="mt-auto">
        <NavLink
          href={withProject('/settings')}
          active={pathname.startsWith('/settings')}
          alignment="left"
          className="w-full"
          onClick={handleLinkClick}
        >
          <Settings className="h-5 w-5" />
          Settings
        </NavLink>
      </div>
    </nav>
  );
}
