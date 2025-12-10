'use client';

import { AppShell } from '@/components/layout/app-shell';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';

export default function TransactionsPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">All Transactions</h1>
          <Link href="/transactions/add">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Transaction
            </Button>
          </Link>
        </div>
        <RecentTransactions />
      </div>
    </AppShell>
  );
}
