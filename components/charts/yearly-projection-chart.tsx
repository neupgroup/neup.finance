'use client';

import { useMemo, useRef, useState } from 'react';
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useUser } from '@/core/providers/auth';
import { useProjectBooks, useProjections, useProjectFinAccountTransactions, useTransactionsList } from '@/core/hooks/api';
import { type Projection, type Transaction } from '@/core/lib/ledger';
import { addDays, addMonths, differenceInCalendarDays, endOfMonth, format, isLastDayOfMonth, startOfDay, startOfMonth, endOfDay as getEndOfDay, eachDayOfInterval } from 'date-fns';
import { ChevronLeft, ChevronRight, Loader, ZoomIn, ZoomOut } from 'lucide-react';
import { Card, CardContent } from '@neup/components/ui/card';

const rangeOptions = [
    { id: '1-day', label: '1 day', days: 1 },
    { id: '2-days', label: '2 days', days: 2 },
    { id: '3-days', label: '3 days', days: 3 },
    { id: '7-days', label: 'weekly', days: 7 },
    { id: '15-days', label: '15 days', days: 15 },
    { id: '1-month', label: 'monthly', months: 1 },
    { id: '2-months', label: '2 months', months: 2 },
    { id: '3-months', label: '3 months', months: 3 },
    { id: '6-months', label: '6 months', months: 6 },
    { id: '1-year', label: 'yearly', months: 12 },
] as const;

type RangeOption = (typeof rangeOptions)[number];
type ChartBucket = { start: Date; end: Date; label: string };

// Match bucket resolution to the selected range: daily, three-day, weekly, or monthly.
function createBuckets(option: RangeOption, now: Date, periodOffset: number): ChartBucket[] {
    if ('months' in option && option.months === 12) {
        const firstMonth = addMonths(startOfMonth(now), periodOffset - Math.floor((option.months - 1) / 2));
        return Array.from({ length: option.months }, (_, index) => {
            const month = addMonths(firstMonth, index);
            return { start: startOfMonth(month), end: endOfMonth(month), label: format(month, 'MMM yy') };
        });
    }

    const dayCount = 'days' in option ? option.days : option.months * 30;
    const bucketSize = 'days' in option ? 1 : option.months < 3 ? 3 : 7;
    const firstDay = addDays(startOfDay(now), periodOffset - Math.floor((dayCount - 1) / 2));
    const lastDay = addDays(firstDay, dayCount - 1);
    const bucketCount = Math.ceil(dayCount / bucketSize);

    return Array.from({ length: bucketCount }, (_, index) => {
        const start = addDays(firstDay, index * bucketSize);
        const daysInBucket = Math.min(bucketSize, differenceInCalendarDays(lastDay, start) + 1);
        const end = getEndOfDay(addDays(start, daysInBucket - 1));
        return { start, end, label: format(start, 'MMM d') };
    });
}

// Count scheduled occurrences in a bucket, beginning no earlier than today.
function countProjectionOccurrences(projection: Projection, bucket: ChartBucket, today: Date): number {
    const startDate = new Date(projection.date);
    const endDate = projection.endsOn ? new Date(projection.endsOn) : null;
    const effectiveStart = startDate > bucket.start ? startDate : bucket.start;
    const forecastStart = today > effectiveStart ? today : effectiveStart;
    const effectiveEnd = endDate && endDate < bucket.end ? endDate : bucket.end;
    if (forecastStart > effectiveEnd) return 0;

    if (!projection.isRecurring || projection.recurrence === 'Once') {
        return startDate >= forecastStart && startDate <= effectiveEnd ? 1 : 0;
    }

    return eachDayOfInterval({ start: startOfDay(forecastStart), end: startOfDay(effectiveEnd) }).filter((day) => {
        const daysSinceStart = differenceInCalendarDays(day, startOfDay(startDate));
        if (daysSinceStart < 0) return false;
        switch (projection.recurrence) {
            case 'Daily': return true;
            case 'Weekly': return daysSinceStart % 7 === 0;
            case 'Monthly': return day.getDate() === startDate.getDate() || (isLastDayOfMonth(day) && isLastDayOfMonth(startDate));
            case 'Yearly': return day.getMonth() === startDate.getMonth() && day.getDate() === startDate.getDate();
            default: return false;
        }
    }).length;
}

// Generate distinct shades for each currency's revenue and expense series.
function generateShades(color: string, count: number) {
    const [hue, saturation, lightness] = color.match(/\d+/g)!.map(Number);
    return Array.from({ length: count }, (_, index) => `hsl(${hue}, ${saturation}%, ${Math.max(10, lightness - index * 10)}%)`);
}

export function YearlyProjectionChart() {
    const { isUserLoading } = useUser();
    const { data: accounts, isLoading: areAccountsLoading } = useProjectBooks();
    const { data: projections, isLoading: areProjectionsLoading } = useProjections('Active');
    const { data: transactions, isLoading: areTransactionsLoading } = useTransactionsList();
    const { data: accountTransactions, isLoading: areAccountTransactionsLoading } = useProjectFinAccountTransactions();
    const [selectedRangeId, setSelectedRangeId] = useState('1-year');
    const [periodOffset, setPeriodOffset] = useState(0);
    const navigationRef = useRef<{ direction: -1 | 1; lastPressedAt: number; streak: number } | null>(null);
    const selectedRange = rangeOptions.find(({ id }) => id === selectedRangeId) ?? rangeOptions[rangeOptions.length - 1];
    const selectedRangeIndex = rangeOptions.findIndex(({ id }) => id === selectedRangeId);
    const zoomIn = () => {
        if (selectedRangeIndex > 0) {
            setSelectedRangeId(rangeOptions[selectedRangeIndex - 1].id);
            setPeriodOffset(0);
            navigationRef.current = null;
        }
    };
    const zoomOut = () => {
        if (selectedRangeIndex < rangeOptions.length - 1) {
            setSelectedRangeId(rangeOptions[selectedRangeIndex + 1].id);
            setPeriodOffset(0);
            navigationRef.current = null;
        }
    };
    const moveTimeline = (direction: -1 | 1) => {
        const now = Date.now();
        const previous = navigationRef.current;
        const streak = previous && previous.direction === direction && now - previous.lastPressedAt < 700
            ? previous.streak + 1
            : 1;
        const step = streak <= 3 ? 1 : streak <= 6 ? 2 : 4;
        navigationRef.current = { direction, lastPressedAt: now, streak };
        setPeriodOffset((offset) => offset + direction * step);
    };

    const { data, currencies } = useMemo(() => {
        if (!accounts || !projections || !transactions || !accountTransactions) return { data: [], currencies: [] };

        const allCurrencies = [...new Set([
            ...accounts.map((account) => account.currency).filter((currency): currency is string => Boolean(currency && currency !== 'ALL')),
            ...projections.map((projection) => projection.currency),
            ...transactions.map((transaction) => transaction.currency),
            ...accountTransactions.map((transaction) => transaction.currency),
        ])];
        const incomeColors = generateShades('216 70% 50%', allCurrencies.length);
        const now = new Date();
        const today = startOfDay(now);
        const buckets = createBuckets(selectedRange, now, periodOffset);
        const legacyTransactions = transactions as Transaction[];
        const mirroredLineIds = new Set(accountTransactions.flatMap((transaction) => {
            const sourceId = transaction.details?.sourceTransactionLineId;
            return typeof sourceId === 'string' ? [sourceId] : [];
        }));

        const chartData = buckets.map((bucket) => {
            const totals: Record<string, string | number> = { name: bucket.label };
            allCurrencies.forEach((currency) => {
                totals[`income-${currency}`] = 0;
                totals[`expense-${currency}`] = 0;
            });

            projections.forEach((projection) => {
                const occurrences = countProjectionOccurrences(projection, bucket, today);
                if (!occurrences) return;
                const key = projection.type === 'Income' ? `income-${projection.currency}` : `expense-${projection.currency}`;
                totals[key] = Number(totals[key]) + projection.amount * occurrences;
            });

            legacyTransactions.forEach((transaction) => {
                if (transaction.status === 'canceled' || transaction.status === 'Canceled') return;
                if (transaction.lines?.some((line) => line.id && mirroredLineIds.has(line.id))) return;
                const transactionDetails = transaction.details && typeof transaction.details === 'object' && !Array.isArray(transaction.details)
                    ? transaction.details as Record<string, unknown>
                    : {};
                if (transactionDetails.entryKind === 'invoice_revenue') return;
                const transactionDate = new Date(transaction.transaction_date ?? transaction.date);
                if (transactionDate < bucket.start || transactionDate > bucket.end || transactionDate > now) return;
                const amount = Number(transaction.final_amount ?? transaction.total_amount ?? 0);
                const isRevenue = ['sale', 'income', 'refund'].includes(transaction.transaction_type.toLowerCase());
                const isExpense = ['purchase', 'expense', 'payroll'].includes(transaction.transaction_type.toLowerCase());
                if (!isRevenue && !isExpense) return;
                const key = isRevenue ? `income-${transaction.currency}` : `expense-${transaction.currency}`;
                totals[key] = Number(totals[key]) + Math.abs(amount);
            });

            accountTransactions.forEach((transaction) => {
                if (transaction.status !== 'active') return;
                const transactionDate = new Date(transaction.activityOn);
                if (transactionDate < bucket.start || transactionDate > bucket.end || transactionDate > now) return;
                const details = transaction.details && typeof transaction.details === 'object' ? transaction.details : {};
                const amount = Number(details.accountAmount ?? transaction.amount);
                const key = transaction.direction === 'in' ? `income-${transaction.currency}` : `expense-${transaction.currency}`;
                totals[key] = Number(totals[key]) + Math.abs(amount);
            });

            return totals;
        });

        allCurrencies.forEach((currency) => {
            chartData.forEach((point) => {
                point[`remaining-${currency}`] =
                    Number(point[`income-${currency}`] ?? 0) - Number(point[`expense-${currency}`] ?? 0);
                delete point[`income-${currency}`];
                delete point[`expense-${currency}`];
            });
        });

        const currencyDetails = allCurrencies.map((currency, index) => ({
            currency,
            remainingColor: incomeColors[index],
        }));
        return { data: chartData, currencies: currencyDetails };
    }, [accounts, projections, transactions, accountTransactions, selectedRange, periodOffset]);

    const isLoading = isUserLoading || areAccountsLoading || areProjectionsLoading || areTransactionsLoading || areAccountTransactionsLoading;
    if (isLoading) {
        return <div className="flex h-[350px] items-center justify-center text-muted-foreground"><Loader className="mr-3 h-6 w-6 animate-spin" /><p>Calculating your future...</p></div>;
    }

    if (data.length === 0 || currencies.length === 0) {
        return <div className="flex h-[350px] items-center justify-center text-muted-foreground"><p>No projection data to display. Add some projections to get started.</p></div>;
    }

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                <div role="group" aria-label="Chart zoom" className="flex items-center gap-1 rounded-md border p-1">
                    <button type="button" onClick={zoomOut} disabled={selectedRangeIndex === rangeOptions.length - 1} className="flex items-center gap-1.5 rounded px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40">
                        <ZoomOut className="h-4 w-4" /> Zoom out
                    </button>
                    <span aria-live="polite" className="min-w-20 px-2 text-center text-sm font-medium capitalize text-foreground">{selectedRange.label}</span>
                    <button type="button" onClick={zoomIn} disabled={selectedRangeIndex === 0} className="flex items-center gap-1.5 rounded px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40">
                        <ZoomIn className="h-4 w-4" /> Zoom in
                    </button>
                </div>
                <div role="group" aria-label="Timeline navigation" className="flex items-center gap-1 rounded-md border p-1">
                    <button type="button" onClick={() => moveTimeline(-1)} aria-label="Previous date range" className="flex items-center gap-1 rounded px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                        <ChevronLeft className="h-4 w-4" /> Previous
                    </button>
                    <button type="button" onClick={() => moveTimeline(1)} aria-label="Next date range" className="flex items-center gap-1 rounded px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                        Next <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>
            <Card>
              <CardContent className="p-4 pt-6 sm:p-6 sm:pt-8">
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => value.toLocaleString('en-US')} />
                    <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}
                        formatter={(value: number, name: string) => {
                            const currency = name.split('-')[1] || 'USD';
                            return [new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value), `Remaining (${currency})`];
                        }}
                        cursor={{ fill: 'hsl(var(--muted))' }}
                    />
                    <Legend />
                    {currencies.map(({ currency, remainingColor }) => (
                        <defs key={`defs-${currency}`}>
                            <linearGradient id={`colorRemaining-${currency}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={remainingColor} stopOpacity={0.8} />
                                <stop offset="95%" stopColor={remainingColor} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                    ))}
                    {currencies.map(({ currency, remainingColor }) => <Area key={`remaining-${currency}`} type="monotone" dataKey={`remaining-${currency}`} name={`Remaining (${currency})`} stroke={remainingColor} fill={`url(#colorRemaining-${currency})`} baseValue={0} />)}
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
        </div>
    );
}
