
'use client';

import { useMemo } from 'react';
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { type Projection } from '@/lib/mock-data';
import { addMonths, format, startOfMonth, eachDayOfInterval, endOfMonth, isWithinInterval, isAfter, isBefore } from 'date-fns';
import { Loader } from 'lucide-react';

type Account = {
    id?: string;
    name: string;
    type: 'Bank' | 'Cash' | 'Investment' | 'Other';
    balance: number;
    currency: string;
    userId: string;
};

export function YearlyProjectionChart() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const accountsCollection = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return collection(firestore, 'users', user.uid, 'accounts');
    }, [firestore, user?.uid]);
    const { data: accounts, isLoading: areAccountsLoading } = useCollection<Account>(accountsCollection);

    const projectionsQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return query(collection(firestore, 'projections'), where('userId', '==', user.uid), where('status', '==', 'Active'));
    }, [firestore, user?.uid]);
    const { data: projections, isLoading: areProjectionsLoading } = useCollection<Projection>(projectionsQuery);

    const projectionData = useMemo(() => {
        if (!accounts || !projections) return [];

        const startingBalance = accounts.reduce((acc, account) => acc + account.balance, 0);

        const data = [];
        let currentBalance = startingBalance;

        for (let i = 0; i < 12; i++) {
            const date = addMonths(new Date(), i);
            const monthStart = startOfMonth(date);
            const monthEnd = endOfMonth(date);
            const monthName = format(date, 'MMM');
            
            let monthIncome = 0;
            let monthExpense = 0;

            projections.forEach(proj => {
                const projStartDate = new Date(proj.date);
                const projEndDate = proj.endsOn ? new Date(proj.endsOn) : null;
                
                if (proj.isRecurring) {
                    let occurrences = 0;
                    const interval = { start: monthStart, end: monthEnd };

                    // Skip if projection starts after the month ends or ends before the month starts
                    if (isAfter(projStartDate, monthEnd) || (projEndDate && isBefore(projEndDate, monthStart))) {
                        // no-op
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

                    if (proj.type === 'Income') monthIncome += proj.amount * occurrences;
                    else monthExpense += proj.amount * occurrences;
                    
                } else { // One-time projection
                    if (isWithinInterval(projStartDate, { start: monthStart, end: monthEnd })) {
                        if (proj.type === 'Income') monthIncome += proj.amount;
                        else monthExpense += proj.amount;
                    }
                }
            });

            currentBalance += (monthIncome - monthExpense);
            data.push({ name: monthName, balance: currentBalance });
        }

        return data;

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

    return (
        <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={projectionData}>
                <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                    </linearGradient>
                </defs>
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
                    formatter={(value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)}
                />
                <Area type="monotone" dataKey="balance" stroke="hsl(var(--chart-1))" fill="url(#colorBalance)" />
            </AreaChart>
        </ResponsiveContainer>
    );
}
