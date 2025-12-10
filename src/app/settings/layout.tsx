
'use client';

import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const settingsNav = [
    { name: 'Appearance', href: '/settings/appearance' },
    { name: 'Defaults', href: '/settings/defaults' },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <AppShell>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
            <h1 className="text-2xl font-bold tracking-tight mb-4">Settings</h1>
            <Card>
                <CardContent className="p-2">
                    <nav className="flex flex-col gap-1">
                        {settingsNav.map(item => (
                            <Link key={item.href} href={item.href}>
                                <Button variant={pathname === item.href ? 'default' : 'ghost'} className="w-full justify-start">
                                    {item.name}
                                </Button>
                            </Link>
                        ))}
                    </nav>
                </CardContent>
            </Card>
        </div>
        <div className="md:col-span-3">
          {children}
        </div>
      </div>
    </AppShell>
  );
}
