'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { useUser } from '@/core/providers/auth';
import { useTransactionsList } from '@/core/hooks/api';

export function IncomeExpenseChart() {
  const { user } = useUser();
  const { data: transactions } = useTransactionsList(user?.uid);

  const data = useMemo(() => {
    const thirtyDaysAgo = subDays(new Date(), 30);
    const dateRange = eachDayOfInterval({ start: thirtyDaysAgo, end: new Date() });

    const dailyData = dateRange.map(date => {
      const formattedDate = format(date, 'MMM d');
      return {
        name: formattedDate,
        income: 0,
        expense: 0,
      };
    });

    (transactions ?? []).forEach(t => {
      const transactionDate = new Date(t.date);
      if (transactionDate >= thirtyDaysAgo) {
        const formattedDate = format(transactionDate, 'MMM d');
        const dayData = dailyData.find(d => d.name === formattedDate);
        if (dayData) {
          if (['sale', 'income', 'refund'].includes(t.transaction_type)) {
            dayData.income += t.total_amount;
          } else if (['purchase', 'expense'].includes(t.transaction_type)) {
            dayData.expense += t.total_amount;
          }
        }
      }
    });

    return dailyData;

  }, [transactions]);

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
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
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip
            contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius)'
            }}
            cursor={{ fill: 'hsl(var(--muted))' }}
        />
        <Legend iconSize={10} />
        <Bar dataKey="income" fill="hsl(var(--chart-2))" name="Income" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expense" fill="hsl(var(--destructive))" name="Expense" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
