import { AppShell } from '@/components/layout/app-shell';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';

export default function TransactionsPage() {
  return (
    <AppShell>
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">All Transactions</h1>
        <RecentTransactions />
      </div>
    </AppShell>
  );
}
