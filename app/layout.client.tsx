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
  const isEmbedded = searchParams.get('embedded') === 'true';
  const embeddedApp = searchParams.get('app')?.trim();
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
    if (!projectId && !isEmbedded) return;

    const preserveAppContext = (value: string | URL) => {
      const destination = new URL(value.toString(), window.location.origin);
      if (destination.origin !== window.location.origin
        || destination.pathname.startsWith('/bridge/api.v1')
        || destination.pathname.startsWith('/api')
        || destination.pathname.startsWith('/_next')) {
        return value.toString();
      }
      if (projectId && !destination.searchParams.has('project')) {
        destination.searchParams.set('project', projectId);
      }
      if (isEmbedded) {
        destination.searchParams.set('embedded', 'true');
        if (embeddedApp && !destination.searchParams.has('app')) {
          destination.searchParams.set('app', embeddedApp);
        }
      }
      return `${destination.pathname}${destination.search}${destination.hash}`;
    };

    const currentUrl = preserveAppContext(window.location.href);
    if (currentUrl !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
      window.history.replaceState(window.history.state, '', currentUrl);
    }

    const originalPushState = window.history.pushState.bind(window.history);
    const originalReplaceState = window.history.replaceState.bind(window.history);
    window.history.pushState = (state, unused, url) => {
      originalPushState(state, unused, url == null ? url : preserveAppContext(url.toString()));
    };
    window.history.replaceState = (state, unused, url) => {
      originalReplaceState(state, unused, url == null ? url : preserveAppContext(url.toString()));
    };

    const preserveAppContextOnLink = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest('a') : null;
      if (!target || target.target === '_blank') return;
      const href = target.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      const nextHref = preserveAppContext(href);
      if (nextHref !== href) target.setAttribute('href', nextHref);
    };

    document.addEventListener('click', preserveAppContextOnLink, true);
    return () => {
      document.removeEventListener('click', preserveAppContextOnLink, true);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, [embeddedApp, isEmbedded, projectId]);

  const sidebarLinks = sidebarGroups.map(group => ({
    ...group,
    links: group.links.map(link => {
      return {
        ...link,
        href: withCurrentQuery(link.href),
      };
    }),
  }));

  return (
    isEmbedded ? (
      <main className="min-h-screen min-w-0 bg-background p-6 text-foreground md:p-10">
        <div className="min-w-0 w-full">{children}</div>
      </main>
    ) : (
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
    )
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
