'use client';

import React from 'react';
import { RecentTransactions } from './recent-transactions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@neup/components/ui/card';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { useTransactionsList } from '@/core/hooks/api';

function StatCard({ title, value, icon, description, colorClass }: { title: string, value: string, icon: React.ReactNode, description: string, colorClass?: string }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className={`text-2xl font-bold ${colorClass}`}>{value}</div>
                <p className="text-xs text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    )
}


export function Dashboard() {
      const { data: transactions } = useTransactionsList();

    const { receivables, payables } = React.useMemo(() => {
        let payables = 0;
        let receivables = 0;

        (transactions ?? []).forEach(t => {
            if (t.status === 'unpaid' || t.status === 'partially_paid') {
                 if (['sale', 'income'].includes(t.transaction_type)) {
                    receivables += t.balance_due;
                } else if (['purchase', 'expense', 'payroll'].includes(t.transaction_type)) {
                    payables += t.balance_due;
                }
            }
        });

        return { receivables, payables };
    }, [transactions]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
             <div className="grid gap-4 md:grid-cols-2">
                <StatCard title="Accounts Receivable" value={formatCurrency(receivables)} icon={<ArrowUp className="h-4 w-4 text-muted-foreground" />} description="Money you expect to receive." colorClass="text-green-500" />
                <StatCard title="Accounts Payable" value={formatCurrency(payables)} icon={<ArrowDown className="h-4 w-4 text-muted-foreground" />} description="Money you need to pay." colorClass="text-red-500" />
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>A list of your recent transactions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <RecentTransactions />
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
