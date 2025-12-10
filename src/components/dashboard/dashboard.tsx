import { RecentTransactions } from './recent-transactions';
import { Integrations } from './integrations';
import { SmartProjections } from './smart-projections';
import { ExpenseAutopilot } from './expense-autopilot';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

export function Dashboard() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>A list of your recent transactions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <RecentTransactions />
                </CardContent>
            </Card>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                <ExpenseAutopilot />
                <Integrations />
            </div>
        </div>
        <div className="space-y-6 md:space-y-8">
            <SmartProjections />
        </div>
    </div>
  );
}
