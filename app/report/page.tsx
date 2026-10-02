'use client';

/*
::neup.documentation::financial-reports-page
::title Financial Reports Page

Renders the dashboard report cards and charts, including receivable and payable
sections that group outstanding balances by their real transaction currency.

::end
*/

import React from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@neup/components/ui/card';
import { ArrowDown, ArrowUp, Banknote, Landmark, Minus, Scale } from 'lucide-react';
import { IncomeExpenseChart } from '@/components/charts/income-expense-chart';
import { CategoryPieChart } from '@/components/charts/category-pie-chart';
import { useUser } from '@/core/providers/auth';
import { useTransactionsList, useUserAccounts } from '@/core/hooks/api';

type CurrencyTotals = Record<string, number>;

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
    const { user } = useUser();
    const { data: transactions } = useTransactionsList(user?.uid);
    const { data: accounts } = useUserAccounts(user?.uid);

    const { income, expenses, assets, liabilities, netWorth, receivables, payables } = React.useMemo(() => {
        let income = 0;
        let expenses = 0;
        const payables: CurrencyTotals = {};
        const receivables: CurrencyTotals = {};

        (transactions ?? []).forEach(t => {
            if (['sale', 'income', 'refund'].includes(t.transaction_type)) {
                income += t.total_amount;
            }
            if (['purchase', 'expense'].includes(t.transaction_type)) {
                expenses += t.total_amount;
            }
            if (t.status === 'unpaid' || t.status === 'partially_paid') {
                const currency = t.currency || 'USD';
                 if (['sale', 'income'].includes(t.transaction_type)) {
                    receivables[currency] = (receivables[currency] ?? 0) + t.balance_due;
                } else if (['purchase', 'expense', 'payroll'].includes(t.transaction_type)) {
                    payables[currency] = (payables[currency] ?? 0) + t.balance_due;
                }
            }
        });
        
        const assets = (accounts ?? []).reduce((sum, account) => sum + account.balance, 0);
        const liabilities = Object.values(payables).reduce((sum, amount) => sum + amount, 0);
        const netWorth = assets - liabilities;

        return { income, expenses, assets, liabilities, netWorth, receivables, payables };
    }, [accounts, transactions]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    }

    const formatAmountWithCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
    };

    const formatCurrencyTotals = (totals: CurrencyTotals) => {
        const entries = Object.entries(totals).filter(([, amount]) => amount !== 0);
        if (entries.length === 0) {
            return formatAmountWithCurrency(0, 'USD');
        }

        return entries
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([currency, amount]) => formatAmountWithCurrency(amount, currency))
            .join(' · ');
    };

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
                        <span className="text-3xl font-bold text-green-500">{formatCurrencyTotals(receivables)}</span>
                    </div>
                     <ul className="text-sm text-muted-foreground space-y-2">
                        {(transactions ?? []).filter(t => t.balance_due > 0 && ['sale', 'income'].includes(t.transaction_type)).map(t => (
                            <li key={t.id} className="flex justify-between"><span>{t.title} (from {t.party?.name || t.recipient})</span> <span>{formatAmountWithCurrency(t.balance_due, t.currency)}</span></li>
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
                        <span className="text-3xl font-bold text-red-500">{formatCurrencyTotals(payables)}</span>
                    </div>
                     <ul className="text-sm text-muted-foreground space-y-2">
                        {(transactions ?? []).filter(t => t.balance_due > 0 && ['purchase', 'expense'].includes(t.transaction_type)).map(t => (
                            <li key={t.id} className="flex justify-between"><span>{t.title} (to {t.party?.name || t.recipient})</span> <span>{formatAmountWithCurrency(t.balance_due, t.currency)}</span></li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </div>

      </div>
    </AppShell>
  );
}
