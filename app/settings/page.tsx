'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import { Input } from '@neup/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@neup/components/ui/card';
import { Badge } from '@neup/components/ui/badge';
import { Button } from '@neup/components/ui/button';

type SettingsItem = {
  title: string;
  description: string;
  href: string;
  section: string;
  comingSoon?: boolean;
};

const settingsSections: { title: string; description: string; items: SettingsItem[] }[] = [
  {
    title: 'General',
    description: 'Manage general site configuration and system information.',
    items: [
      {
        title: 'Appearance',
        description: 'Theme preferences and display behavior.',
        href: '/settings/appearance',
        section: 'General',
      },
      {
        title: 'Defaults',
        description: 'Default currency and transaction type.',
        href: '/settings/defaults',
        section: 'General',
      },
    ],
  },
  {
    title: 'Permission Management',
    description: 'Manage user roles and access levels.',
    items: [
      {
        title: 'Users & Permissions',
        description: 'Review access and role controls.',
        href: '/settings/payprofiles',
        section: 'Permission Management',
      },
    ],
  },
  {
    title: 'Payments',
    description: 'Configure payment gateways and view account charges.',
    items: [
      {
        title: 'Payment Gateway Setup (Coming Soon)',
        description: 'Prepare gateway connections and billing settings.',
        href: '/settings/payprofiles',
        section: 'Payments',
        comingSoon: true,
      },
      {
        title: 'Total Account Charges (Coming Soon)',
        description: 'Summaries and paid/unpaid fee breakdowns.',
        href: '/settings/payprofiles',
        section: 'Payments',
        comingSoon: true,
      },
    ],
  },
  {
    title: 'Integrations',
    description: 'Connect external services and manage automation.',
    items: [
      {
        title: 'Transaction Blocks',
        description: 'Rule-based blocks for account, book, or profile flows.',
        href: '/settings/transaction-blocks',
        section: 'Integrations',
      },
    ],
  },
  {
    title: 'Data',
    description: 'Export and move your ledger data when you need an offline copy.',
    items: [
      {
        title: 'Export',
        description: 'Download transactions, books, parties, and projections as JSON.',
        href: '/settings/export',
        section: 'Data',
      },
      {
        title: 'Import',
        description: 'Upload transaction CSV or JSON rows.',
        href: '/transactions/import',
        section: 'Data',
      },
    ],
  },
];

export default function SettingsPage() {
  const [query, setQuery] = useState('');

  const filteredSections = useMemo(() => {
    const search = query.trim().toLowerCase();

    if (!search) {
      return settingsSections;
    }

    return settingsSections
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            item.title.toLowerCase().includes(search) ||
            item.description.toLowerCase().includes(search) ||
            item.section.toLowerCase().includes(search)
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [query]);

  return (

      <div className="space-y-4">
        <section className="space-y-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-sm text-muted-foreground">
            Manage your application settings, integrations, and configurations.
            </p>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search for settings or support..."
              className="h-11 rounded-md pl-10"
            />
          </div>
        </section>

        {filteredSections.map((section) => (
          <section key={section.title} className="space-y-3">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold tracking-tight">{section.title}</h2>
              <p className="text-sm text-muted-foreground">{section.description}</p>
            </div>

            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="divide-y">
                  {section.items.map((item) => (
                    <Link
                      key={item.title}
                      href={item.href}
                      className="group flex items-center justify-between px-5 py-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-base font-semibold">{item.title}</h3>
                          {item.comingSoon ? <Badge variant="secondary">Coming Soon</Badge> : null}
                        </div>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="shrink-0 rounded-full">
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </Button>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        ))}
      </div>

  );
}
