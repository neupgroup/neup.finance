'use client';

import React from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { transactions } from '@/lib/mock-data';
import { ArrowDown, ArrowUp, Banknote, Landmark, Minus, Scale } from 'lucide-react';
import { IncomeExpenseChart } from '@/components/charts/income-expense-chart';
import { CategoryPieChart } from '@/components/charts/category-pie-chart';


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

export default function ReportPage() {

    const { income, expenses, assets, liabilities, netWorth, receivables, payables } = React.useMemo(() => {
        let income = 0;
        let expenses = 0;
        let payables = 0;
        let receivables = 0;

        transactions.forEach(t => {
            if (['sale', 'income', 'refund'].includes(t.transaction_type)) {
                income += t.total_amount;
            }
            if (['purchase', 'expense'].includes(t.transaction_type)) {
                expenses += t.total_amount;
            }
            if (t.status === 'unpaid' || t.status === 'partially_paid') {
                 if (['sale', 'income'].includes(t.transaction_type)) {
                    receivables += t.balance_due;
                } else if (['purchase', 'expense', 'payroll'].includes(t.transaction_type)) {
                    payables += t.balance_due;
                }
            }
        });
        
        // Simplified asset/liability calculation
        const assets = 12500.75 + 42000.00 + 350.50; // from initial accounts
        const liabilities = payables;
        const netWorth = assets - liabilities;

        return { income, expenses, assets, liabilities, netWorth, receivables, payables };
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    }

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
            <p className="text-muted-foreground">An overview of your financial health.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Net Worth" value={formatCurrency(netWorth)} icon={<Scale className="h-4 w-4 text-muted-foreground" />} description="Assets minus Liabilities" colorClass="text-primary" />
            <StatCard title="Total Assets" value={formatCurrency(assets)} icon={<Landmark className="h-4 w-4 text-muted-foreground" />} description="What you own" colorClass="text-green-500" />
            <StatCard title="Total Liabilities" value={formatCurrency(liabilities)} icon={<Banknote className="h-4 w-4 text-muted-foreground" />} description="What you owe" colorClass="text-red-500" />
            <StatCard title="Net Income" value={formatCurrency(income-expenses)} icon={<Minus className="h-4 w-4 text-muted-foreground" />} description="Income minus Expenses" colorClass={income - expenses >= 0 ? "text-green-500" : "text-red-500"} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <Card className="lg:col-span-3">
                <CardHeader>
                    <CardTitle>Income vs. Expense</CardTitle>
                    <CardDescription>A summary of your cash flow for the last 30 days.</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                    <IncomeExpenseChart />
                </CardContent>
            </Card>
            <Card className="lg:col-span-2">
                 <CardHeader>
                    <CardTitle>Spending by Category</CardTitle>
                    <CardDescription>How your expenses are distributed.</CardDescription>
                </CardHeader>
                <CardContent>
                    <CategoryPieChart />
                </CardContent>
            </Card>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Accounts Receivable</CardTitle>
                    <CardDescription>Money owed to you that you are expecting to receive.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center">
                        <ArrowUp className="h-6 w-6 text-green-500 mr-2" />
                        <span className="text-3xl font-bold text-green-500">{formatCurrency(receivables)}</span>
                    </div>
                     <ul className="text-sm text-muted-foreground space-y-2">
                        {transactions.filter(t => t.balance_due > 0 && ['sale', 'income'].includes(t.transaction_type)).map(t => (
                            <li key={t.id} className="flex justify-between"><span>{t.title} (from {t.recipient})</span> <span>{formatCurrency(t.balance_due)}</span></li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Accounts Payable</CardTitle>
                    <CardDescription>Money you owe to others.</CardDescription>
                </CardHeader>
                 <CardContent className="space-y-4">
                    <div className="flex items-center">
                        <ArrowDown className="h-6 w-6 text-red-500 mr-2" />
                        <span className="text-3xl font-bold text-red-500">{formatCurrency(payables)}</span>
                    </div>
                     <ul className="text-sm text-muted-foreground space-y-2">
                        {transactions.filter(t => t.balance_due > 0 && ['purchase', 'expense'].includes(t.transaction_type)).map(t => (
                            <li key={t.id} className="flex justify-between"><span>{t.title} (to {t.recipient})</span> <span>{formatCurrency(t.balance_due)}</span></li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </div>

      </div>
    </AppShell>
  );
}
