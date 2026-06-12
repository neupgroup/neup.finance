
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowLeftRight,
  BarChart,
  Bot,
  FileText,
  Home,
  Landmark,
  Settings,
  BookText,
  Users,
} from 'lucide-react';
import { Button } from '../ui/button';
import { useSidebar } from '../ui/sidebar';

const menuItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/assets', label: 'Assets', icon: Landmark },
  { href: '/recipients', label: 'Recipients', icon: Users },
  { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { href: '/projections', label: 'Projections', icon: BarChart },
  { href: '/report', label: 'Reports', icon: FileText },
  { href: '/journal', label: 'Journal', icon: BookText },
  { href: '/chat', label: 'Chat', icon: Bot },
];

export function MainNav() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  const handleLinkClick = () => {
    setOpenMobile(false);
  };

  return (
    <nav className="grid items-start gap-2">
      {menuItems.map((item, index) => {
        const isActive = pathname.startsWith(item.href) && (item.href !== '/' || pathname === '/');
        return (
          <Link key={index} href={item.href} onClick={handleLinkClick}>
            <Button
              variant={isActive ? 'default' : 'ghost'}
              className="w-full justify-start gap-2"
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Button>
          </Link>
        );
      })}
       <div className="mt-auto">
          <Link href="/settings/appearance" onClick={handleLinkClick}>
              <Button
                variant={pathname.startsWith('/settings') ? 'default' : 'ghost'}
                className="w-full justify-start gap-2"
              >
                  <Settings className="h-5 w-5" />
                  Settings
              </Button>
          </Link>
       </div>
    </nav>
  );
}
