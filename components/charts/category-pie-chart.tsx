'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';
import { useTransactionsList } from '@/core/hooks/api';

const COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
    'hsl(var(--primary))',
    'hsl(var(--accent))',
];

export function CategoryPieChart() {
      const { data: transactions } = useTransactionsList();

    const data = useMemo(() => {
        const categoryTotals: {[key: string]: number} = {};
        (transactions ?? []).forEach(t => {
            if (['purchase', 'expense'].includes(t.transaction_type)) {
                if(categoryTotals[t.category]) {
                    categoryTotals[t.category] += t.total_amount;
                } else {
                    categoryTotals[t.category] = t.total_amount;
                }
            }
        });

        return Object.entries(categoryTotals).map(([name, value]) => ({ name, value }));

    }, [transactions]);

    const RADIAN = Math.PI / 180;
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        if (percent < 0.05) return null;

        return (
            <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
            {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    if (data.length === 0) {
        return (
            <div className="flex h-full items-center justify-center text-muted-foreground">
                <p>No expense data available.</p>
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height={350}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={120}
                    dataKey="value"
                >
                    {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip 
                    contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 'var(--radius)'
                    }}
                     formatter={(value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value as number)}
                />
                <Legend iconSize={10} wrapperStyle={{fontSize: '0.8rem'}} />
            </PieChart>
        </ResponsiveContainer>
    );
}
