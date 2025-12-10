'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart,
  CircleDollarSign,
  FileText,
  Home,
  Settings,
  Wallet,
  Zap,
} from 'lucide-react';
import { Button } from '../ui/button';
import { useSidebar } from '../ui/sidebar';

const menuItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/revenue', label: 'Revenue', icon: CircleDollarSign },
  { href: '/expense', label: 'Expenses', icon: Wallet },
  { href: '/projection', label: 'Projections', icon: BarChart },
  { href: '/report', label: 'Reports', icon: FileText },
];

export function MainNav() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  const handleLinkClick = () => {
    setOpenMobile(false);
  }

  return (
    <nav className="grid items-start gap-2">
      {menuItems.map((item, index) => {
        const isActive = pathname === item.href;
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
          <Link href="/settings" onClick={handleLinkClick}>
              <Button
                variant={pathname === '/settings' ? 'default' : 'ghost'}
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
