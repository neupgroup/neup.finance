
'use client';

import { useMemo } from 'react';
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useUser } from '@/core/providers/auth';
import { useUserAccounts, useProjections } from '@/core/hooks/api';
import { type Projection } from '@/core/lib/ledger';
import { addMonths, format, startOfMonth, endOfMonth, isWithinInterval, isAfter, isBefore, eachDayOfInterval } from 'date-fns';
import { Loader } from 'lucide-react';

type Account = {
    id?: string;
    name: string;
    type: 'Bank' | 'Cash' | 'Investment' | 'Stock' | 'Other';
    balance: number;
    currency: string;
    userId: string;
};

// Helper to generate shades for colors
const generateShades = (color: string, count: number) => {
    const [h, s, l] = color.match(/\d+/g)!.map(Number);
    const shades = [];
    for (let i = 0; i < count; i++) {
        const newL = Math.max(10, l - i * 10);
        shades.push(`hsl(${h}, ${s}%, ${newL}%)`);
    }
    return shades;
}

export function YearlyProjectionChart() {
    const { user, isUserLoading } = useUser();

    const { data: accounts, isLoading: areAccountsLoading } = useUserAccounts(user?.uid);

    const { data: projections, isLoading: areProjectionsLoading } = useProjections(user?.uid, 'Active');

    const { data, currencies } = useMemo(() => {
        if (!accounts || !projections) return { data: [], currencies: [] };

        const allCurrencies = [...new Set(projections.map(p => p.currency))];
        const incomeColors = generateShades('216 70% 50%', allCurrencies.length);
        const expenseColors = generateShades('0 84% 60%', allCurrencies.length);

        const chartData = [];

        for (let i = 0; i < 12; i++) {
            const date = addMonths(new Date(), i);
            const monthStart = startOfMonth(date);
            const monthEnd = endOfMonth(date);
            const monthName = format(date, 'MMM');
            
            const monthTotals: { [key: string]: number } = { name: monthName as any };

            allCurrencies.forEach(currency => {
                monthTotals[`income-${currency}`] = 0;
                monthTotals[`expense-${currency}`] = 0;
            });

            projections.forEach(proj => {
                const projStartDate = new Date(proj.date);
                const projEndDate = proj.endsOn ? new Date(proj.endsOn) : null;
                
                let occurrences = 0;

                if (proj.isRecurring) {
                    const interval = { start: monthStart, end: monthEnd };

                    if (isAfter(projStartDate, monthEnd) || (projEndDate && isBefore(projEndDate, monthStart))) {
                        // Skips projections not in the current month
                    } else {
                        switch(proj.recurrence) {
                            case 'Daily':
                                occurrences = eachDayOfInterval(interval).filter(day => 
                                    (isAfter(day, projStartDate) || day.toDateString() === projStartDate.toDateString()) &&
                                    (!projEndDate || isBefore(day, projEndDate) || day.toDateString() === projEndDate.toDateString())
                                ).length;
                                break;
                            case 'Weekly':
                                occurrences = Math.floor(eachDayOfInterval(interval).filter(day => 
                                    (isAfter(day, projStartDate) || day.toDateString() === projStartDate.toDateString()) &&
                                    (!projEndDate || isBefore(day, projEndDate) || day.toDateString() === projEndDate.toDateString())
                                ).length / 7);
                                break;
                            case 'Monthly':
                                 if ((isAfter(monthStart, projStartDate) || monthStart.getMonth() === projStartDate.getMonth()) && 
                                     (!projEndDate || isBefore(monthStart, projEndDate))) {
                                    occurrences = 1;
                                 }
                                break;
                            case 'Yearly':
                                if (projStartDate.getMonth() === monthStart.getMonth() &&
                                    (!projEndDate || isBefore(monthStart, projEndDate))) {
                                    occurrences = 1;
                                }
                                break;
                        }
                    }

                } else { // One-time projection
                    if (isWithinInterval(projStartDate, { start: monthStart, end: monthEnd })) {
                       occurrences = 1;
                    }
                }
                
                if (occurrences > 0) {
                     if (proj.type === 'Income') {
                        monthTotals[`income-${proj.currency}`] += proj.amount * occurrences;
                    } else {
                        monthTotals[`expense-${proj.currency}`] += proj.amount * occurrences;
                    }
                }
            });
            
            // Add current balance to first month's income
            if (i === 0) {
                accounts.forEach(account => {
                    if (monthTotals[`income-${account.currency}`] !== undefined) {
                        monthTotals[`income-${account.currency}`] += account.balance;
                    } else {
                        // If currency from account wasn't in projections, initialize it.
                        if (!allCurrencies.includes(account.currency)) {
                            allCurrencies.push(account.currency);
                            monthTotals[`income-${account.currency}`] = account.balance;
                            monthTotals[`expense-${account.currency}`] = 0;
                        }
                    }
                });
            }


            chartData.push(monthTotals);
        }

        const currencyDetails = allCurrencies.map((c, i) => ({
            currency: c,
            incomeColor: incomeColors[i] || incomeColors[0],
            expenseColor: expenseColors[i] || expenseColors[0],
        }));

        return { data: chartData, currencies: currencyDetails };

    }, [accounts, projections]);

    const isLoading = isUserLoading || areAccountsLoading || areProjectionsLoading;

    if (isLoading) {
        return (
            <div className="flex h-[350px] items-center justify-center text-muted-foreground">
                <Loader className="mr-3 h-6 w-6 animate-spin" />
                <p>Calculating your future...</p>
            </div>
        )
    }

    if (data.length === 0 || currencies.length === 0) {
         return (
            <div className="flex h-[350px] items-center justify-center text-muted-foreground">
                <p>No projection data to display. Add some projections to get started.</p>
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 'var(--radius)'
                    }}
                    formatter={(value: number, name: string) => {
                        const currency = name.split('-')[1] || 'USD'; // Default to USD if currency is undefined
                        return [new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value), name.split('-')[0]];
                    }}
                    cursor={{ fill: 'hsl(var(--muted))' }}
                />
                <Legend />
                {currencies.map(({ currency, incomeColor, expenseColor }) => (
                    <defs key={`defs-${currency}`}>
                        <linearGradient id={`colorIncome-${currency}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={incomeColor} stopOpacity={0.8}/>
                            <stop offset="95%" stopColor={incomeColor} stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id={`colorExpense-${currency}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={expenseColor} stopOpacity={0.8}/>
                            <stop offset="95%" stopColor={expenseColor} stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                ))}
                 {currencies.map(({ currency, incomeColor }) => (
                     <Area 
                        key={`income-${currency}`}
                        type="monotone" 
                        dataKey={`income-${currency}`}
                        name={`Income (${currency})`}
                        stroke={incomeColor} 
                        fill={`url(#colorIncome-${currency})`}
                    />
                 ))}
                {currencies.map(({ currency, expenseColor }) => (
                     <Area 
                        key={`expense-${currency}`}
                        type="monotone" 
                        dataKey={`expense-${currency}`}
                        name={`Expense (${currency})`}
                        stroke={expenseColor} 
                        fill={`url(#colorExpense-${currency})`}
                    />
                ))}
            </AreaChart>
        </ResponsiveContainer>
    );
}
