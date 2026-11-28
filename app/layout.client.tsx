'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import HeaderSidebarLayout, { type SidebarLinkGroup } from '@neup/components/layout/headerSidebar.v1';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/core/providers/auth';
import {
  ArrowLeftRight,
  BarChart,
  BookText,
  BriefcaseBusiness,
  FileText,
  FolderKanban,
  Home,
  Landmark,
  ListTree,
  Building2,
  ContactRound,
  Repeat2,
  PlusCircle,
  Settings,
  Users,
} from 'lucide-react';
import { Logo } from '@/components/icons';
import type { HeaderAccount } from '@/components/layout/header';

const sidebarGroups: SidebarLinkGroup[] = [
  {
    label: 'Workspace',
    links: [
      { href: '/home', label: 'Dashboard', icon: Home },
      { href: '/finaccounts', label: 'Accounts', icon: Landmark },
      { href: '/chart-of-accounts', label: 'Chart of Accounts', icon: ListTree },
      { href: '/party', label: 'Party', icon: Users },
      { href: '/documents', label: 'Documents', icon: PlusCircle },
      { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
      { href: '/projections', label: 'Projections', icon: BarChart },
      { href: '/report', label: 'Reports', icon: FileText },
      { href: '/journal', label: 'Journal', icon: BookText },
    ],
  },
  {
    label: 'Projects',
    links: [
      { href: '/projects', label: 'Home', icon: Building2 },
      { href: '/projects/profile', label: 'Profile', icon: ContactRound },
      { href: '/projects/teams', label: 'Teams', icon: Users },
    ],
  },
  {
    label: 'Manage',
    links: [
      { href: '/switch', label: 'Switch project', icon: Repeat2 },
      { href: '/projects', label: 'Projects', icon: FolderKanban },
      { href: '/manage/accounts', label: 'Accounts', icon: BriefcaseBusiness },
      { href: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

// Render the shared navigation shell and retain active project query parameters in links.
function AppShell({ children, account }: {
  children: ReactNode;
  account: HeaderAccount | null;
}) {
  const searchParams = useSearchParams();
  const isEmbedded = searchParams.get('embedded') === 'true'
    && Boolean(searchParams.get('app')?.trim());
  const projectId = searchParams.get('project')?.trim();
  const withCurrentQuery = (href: string) => {
    const destination = new URL(href, 'https://ledger.local');
    searchParams.forEach((value, key) => {
      if (!destination.searchParams.has(key)) destination.searchParams.set(key, value);
    });
    return `${destination.pathname}${destination.search}${destination.hash}`;
  };

  const QueryAwareLink = ({ href, ...props }: React.ComponentProps<typeof Link>) => (
    <Link href={withCurrentQuery(typeof href === 'string' ? href : href.pathname ?? '/')} {...props} />
  );

  useEffect(() => {
    if (!projectId) return;

    const preserveProject = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest('a') : null;
      if (!target || target.target === '_blank') return;
      const href = target.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      const destination = new URL(href, window.location.origin);
      if (destination.origin !== window.location.origin || destination.pathname.startsWith('/bridge/api.v1')) return;
      if (!destination.searchParams.has('project')) destination.searchParams.set('project', projectId);
      target.setAttribute('href', `${destination.pathname}${destination.search}${destination.hash}`);
    };

    document.addEventListener('click', preserveProject, true);
    return () => document.removeEventListener('click', preserveProject, true);
  }, [projectId]);

  const sidebarLinks = sidebarGroups.map(group => ({
    ...group,
    links: group.links.map(link => {
      return {
        ...link,
        href: withCurrentQuery(link.href),
      };
    }),
  }));

  if (isEmbedded) {
    return <>{children}</>;
  }

  return (
    <HeaderSidebarLayout
      sidebarlinks={sidebarLinks}
      pofileBarInfo={{
        href: withCurrentQuery('/profile'),
        displayName: account?.displayName ?? null,
        displayImage: account?.displayImage ?? null,
        neupid: account?.neupid ?? null,
      }}
      headerLinks={[
        <QueryAwareLink key="brand" href="/home" className="flex items-center gap-2 font-semibold text-foreground">
          <Logo className="h-8 w-8" />
          <span>Neup.Ledger</span>
        </QueryAwareLink>,
      ]}
    >
      {children}
    </HeaderSidebarLayout>
  );
}

// Provide client-side app context and the shared navigation shell.
export default function ClientLayout({
  children,
  account,
}: {
  children: ReactNode;
  account: HeaderAccount | null;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <AppShell account={account}>{children}</AppShell>
      </AuthProvider>
    </ThemeProvider>
  );
}
