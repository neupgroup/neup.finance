import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';

export default function TransactionsPage() {
  return (
    <AppShell>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
            <CardDescription>View and manage all your transactions.</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentTransactions />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
