'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import HeaderSidebarLayout, { type SidebarLinkGroup } from '@neup/components/layout/headerSidebar.v1';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/core/providers/auth';
import {
  ArrowLeftRight,
  BarChart,
  BookText,
  BriefcaseBusiness,
  FileText,
  Home,
  Landmark,
  Repeat2,
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
      { href: '/party', label: 'Party', icon: Users },
      { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
      { href: '/projections', label: 'Projections', icon: BarChart },
      { href: '/report', label: 'Reports', icon: FileText },
      { href: '/journal', label: 'Journal', icon: BookText },
    ],
  },
  {
    label: 'Manage',
    links: [
      { href: '/switch', label: 'Switch project', icon: Repeat2 },
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
  const sidebarLinks = sidebarGroups.map(group => ({
    ...group,
    links: group.links.map(link => {
      const destination = new URL(link.href, 'https://ledger.local');
      searchParams.forEach((value, key) => {
        if (!destination.searchParams.has(key)) destination.searchParams.set(key, value);
      });
      return {
        ...link,
        href: `${destination.pathname}${destination.search}${destination.hash}`,
      };
    }),
  }));

  return (
    <HeaderSidebarLayout
      sidebarlinks={sidebarLinks}
      pofileBarInfo={{
        href: '/profile',
        displayName: account?.displayName ?? null,
        displayImage: account?.displayImage ?? null,
        neupid: account?.neupid ?? null,
      }}
      headerLinks={[
        <Link key="brand" href="/home" className="flex items-center gap-2 font-semibold text-foreground">
          <Logo className="h-8 w-8" />
          <span>Neup.Ledger</span>
        </Link>,
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
