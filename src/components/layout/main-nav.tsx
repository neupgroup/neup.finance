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

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';

const menuItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/revenue', label: 'Revenue', icon: CircleDollarSign },
  { href: '/expense', label: 'Expenses', icon: Wallet },
  { href: '/projection', label: 'Projections', icon: BarChart },
  { href: '#', label: 'Integrations', icon: Zap },
  { href: '/report', label: 'Reports', icon: FileText },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <div className="p-2">
      <SidebarMenu>
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <SidebarMenuItem key={item.label}>
              <Link href={item.href}>
                <SidebarMenuButton
                  isActive={isActive}
                  tooltip={{
                    children: item.label,
                    className: 'bg-background border-border text-foreground',
                  }}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
       <SidebarMenu className="mt-auto">
         <SidebarMenuItem>
            <Link href="/settings">
                <SidebarMenuButton
                  isActive={pathname === '/settings'}
                  tooltip={{
                    children: "Settings",
                    className: 'bg-background border-border text-foreground',
                  }}
                >
                    <Settings className="h-5 w-5" />
                    <span>Settings</span>
                </SidebarMenuButton>
            </Link>
         </SidebarMenuItem>
      </SidebarMenu>
    </div>
  );
}
