'use client';

import { AppShell } from '@/components/layout/app-shell';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TransactionsPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">All Transactions</h1>
          <Link href="/transactions/add">
            <Button>
              <PlusCircle className="mr-2" />
              Add Transaction
            </Button>
          </Link>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Transactions</CardTitle>
                <CardDescription>A list of all your transactions.</CardDescription>
            </CardHeader>
            <CardContent>
                 <RecentTransactions />
            </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
