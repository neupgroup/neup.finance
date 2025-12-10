'use client';

import { motion } from 'framer-motion';
import { transactions } from '@/lib/mock-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import React from 'react';

const useStableRandoms = (count: number) => {
  const [randoms, setRandoms] = React.useState<number[]>([]);
  React.useEffect(() => {
    setRandoms(Array.from({ length: count }, () => Math.random()));
  }, [count]);
  return randoms;
};

export function FinancialUniverse() {
  const revenues = transactions.filter(t => t.type === 'credit');
  const expenses = transactions.filter(t => t.type === 'debit');
  const totalRevenue = revenues.reduce((acc, t) => acc + t.amount, 0);

  const revenueRandoms = useStableRandoms(revenues.length);
  const expenseRandoms = useStableRandoms(expenses.length);
  
  if (revenueRandoms.length === 0 || expenseRandoms.length === 0) {
    return null; // Don't render until random values are generated
  }

  return (
    <Card className="h-full min-h-[400px] md:min-h-[500px] overflow-hidden">
      <CardHeader>
        <CardTitle>Financial Universe</CardTitle>
        <CardDescription>Your finances visualized as a solar system.</CardDescription>
      </CardHeader>
      <CardContent className="relative h-full pb-0 flex items-center justify-center">
        <TooltipProvider>
            <div className="w-full h-full relative">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <motion.div 
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full bg-primary/50 cursor-pointer"
                            style={{ width: 100 + Math.log(totalRevenue) * 10, height: 100 + Math.log(totalRevenue) * 10 }}
                            whileHover={{ scale: 1.1 }}
                            animate={{ scale: [1, 1.05, 1], transition: { duration: 5, repeat: Infinity } }}
                        >
                            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-accent/50 to-primary blur-xl"></div>
                            <div className="z-10 text-center">
                                <p className="text-xl font-bold text-primary-foreground">${totalRevenue.toLocaleString()}</p>
                                <p className="text-xs text-primary-foreground/80">Total Revenue</p>
                            </div>
                        </motion.div>
                    </TooltipTrigger>
                    <TooltipContent><p>Total Revenue</p></TooltipContent>
                </Tooltip>

                {revenues.map((rev, i) => {
                    const angle = revenueRandoms[i] * 2 * Math.PI;
                    const radius = 120 + revenueRandoms[i] * 50;
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    const size = 20 + Math.log(rev.amount) * 3;

                    return (
                        <Tooltip key={rev.id}>
                            <TooltipTrigger asChild>
                                <motion.div
                                    className="absolute rounded-full bg-chart-2 flex items-center justify-center cursor-pointer"
                                    style={{
                                        width: size,
                                        height: size,
                                        top: `calc(50% + ${y}px - ${size/2}px)`,
                                        left: `calc(50% + ${x}px - ${size/2}px)`,
                                    }}
                                    animate={{ 
                                        scale: [1, 1.1, 1],
                                        transition: { duration: 3 + revenueRandoms[i] * 2, repeat: Infinity, delay: revenueRandoms[i] }
                                    }}
                                    whileHover={{ scale: 1.2, zIndex: 10 }}
                                >
                                    <ArrowUpRight className="h-4 w-4 text-primary-foreground" />
                                </motion.div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{rev.name}: ${rev.amount.toLocaleString()}</p>
                            </TooltipContent>
                        </Tooltip>
                    )
                })}

                {expenses.map((exp, i) => {
                    const angle = expenseRandoms[i] * 2 * Math.PI;
                    const radius = 200 + expenseRandoms[i] * 80;
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    const size = 15 + Math.log(Math.abs(exp.amount)) * 2;
                    return (
                        <Tooltip key={exp.id}>
                            <TooltipTrigger asChild>
                                <motion.div
                                    className="absolute rounded-full bg-destructive flex items-center justify-center cursor-pointer"
                                    style={{
                                        width: size,
                                        height: size,
                                        top: `calc(50% + ${y}px - ${size/2}px)`,
                                        left: `calc(50% + ${x}px - ${size/2}px)`,
                                    }}
                                    animate={{
                                        rotate: 360,
                                        transition: { duration: 10 + expenseRandoms[i] * 10, repeat: Infinity, ease: "linear" }
                                    }}
                                    whileHover={{ scale: 1.3, zIndex: 10 }}
                                >
                                     <ArrowDownLeft className="h-3 w-3 text-destructive-foreground" />
                                </motion.div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{exp.name}: ${Math.abs(exp.amount).toLocaleString()}</p>
                            </TooltipContent>
                        </Tooltip>
                    );
                })}
            </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
