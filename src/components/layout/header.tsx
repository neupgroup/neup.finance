'use client';

import Image from 'next/image';
import {
  CircleUser,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { CommandCenter } from '../chat/command-center';

export function Header() {
  const userAvatar = PlaceHolderImages.find(p => p.id === 'user-avatar');

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b px-4 md:px-6 sticky top-0 z-30 bg-background/80 backdrop-blur-sm">
      <SidebarTrigger />
      <div className="flex w-full items-center justify-end gap-2 md:gap-4">
        <CommandCenter />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              {userAvatar ? (
                  <Image
                      src={userAvatar.imageUrl}
                      width={36}
                      height={36}
                      alt={userAvatar.description}
                      data-ai-hint={userAvatar.imageHint}
                      className="rounded-full"
                  />
              ) : (
                  <CircleUser className="h-6 w-6" />
              )}
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem>Support</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
