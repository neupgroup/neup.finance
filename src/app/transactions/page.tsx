'use client';

import { AppShell } from '@/components/layout/app-shell';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { AddTransactionDialog } from '@/components/transactions/add-transaction-dialog';

export default function TransactionsPage() {
  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">All Transactions</h1>
          <AddTransactionDialog />
        </div>
        <RecentTransactions />
      </div>
    </AppShell>
  );
}
