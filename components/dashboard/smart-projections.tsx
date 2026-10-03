'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@neup/components/ui/card';
import { Button } from '@neup/components/ui/button';
import { Input } from '@neup/components/ui/input';
import { Label } from '@neup/components/ui/label';
import { Slider } from '@neup/components/ui/slider';
import { projectFutureSavings } from '@/core/ai/flows/project-future-savings';
import { Loader } from 'lucide-react';
import { useTransactionsList } from '@/core/hooks/api';

export function SmartProjections() {
  const { data: transactions } = useTransactionsList();
  const [savingsGoal, setSavingsGoal] = useState(10000);
  const [projection, setProjection] = useState<{ monthsToGoal: number; projectedSavings: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timeWarp, setTimeWarp] = useState(0);

  const { currentIncome, currentSpending, currentSavings } = useMemo(() => {
    const transactionList = transactions ?? [];
    const income = transactionList.filter(t => t.transaction_type === 'sale' || t.transaction_type === 'refund' || t.transaction_type === 'income').reduce((sum, t) => sum + t.total_amount, 0);
    const spending = transactionList.filter(t => t.transaction_type === 'purchase' || t.transaction_type === 'expense' || t.transaction_type === 'payroll').reduce((sum, t) => sum + Math.abs(t.total_amount), 0);
    return { currentIncome: income, currentSpending: spending, currentSavings: income - spending };
  }, [transactions]);

  const handleProjection = async () => {
    setIsLoading(true);
    try {
      const result = await projectFutureSavings({
        currentIncome,
        currentSpending,
        currentSavings,
        savingsGoal,
        interestRate: 0.02,
      });
      setProjection(result);
      setTimeWarp(result.monthsToGoal);
    } catch (error) {
      console.error('Projection error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const projectedValue = useMemo(() => {
    if (!projection) return currentSavings;
    const monthlyNet = currentIncome - currentSpending;
    if (monthlyNet <= 0) return currentSavings;

    let futureValue = currentSavings;
    for (let i = 0; i < timeWarp; i++) {
        futureValue += monthlyNet;
        futureValue *= (1 + 0.02 / 12);
    }
    return futureValue;
  }, [timeWarp, projection, currentSavings, currentIncome, currentSpending]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Smart Projections</CardTitle>
        <CardDescription>Peer into your financial future.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="savings-goal">Savings Goal</Label>
          <div className="flex gap-2">
            <Input
              id="savings-goal"
              type="number"
              value={savingsGoal}
              onChange={(e) => setSavingsGoal(Number(e.target.value))}
              className="bg-card"
            />
            <Button onClick={handleProjection} disabled={isLoading}>
              {isLoading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
              Project
            </Button>
          </div>
        </div>
        {projection && (
          <div className="space-y-4 rounded-lg border p-4">
            <p className="text-sm">
                Months to reach goal: <span className="font-bold text-accent">{projection.monthsToGoal}</span>
            </p>
            <div className="space-y-2">
              <Label>Time Warp: {timeWarp} months</Label>
              <Slider
                value={[timeWarp]}
                max={Math.max(120, projection.monthsToGoal * 1.5)}
                step={1}
                onValueChange={(value) => setTimeWarp(value[0])}
              />
            </div>
            <div className="text-center">
                <p className="text-xs text-muted-foreground">Projected Savings</p>
                <p className="text-3xl font-bold text-accent">
                    ${projectedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
