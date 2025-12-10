'use client';

import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { transactions } from '@/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Paperclip } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

function DetailItem({ label, value, className }: { label: string; value?: React.ReactNode, className?: string }) {
    if (value === null || value === undefined || value === '') return null;
    return (
        <div className={cn("flex flex-col gap-1", className)}>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="font-medium text-foreground">{value}</p>
        </div>
    );
}


export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;

  const transaction = transactions.find((t) => t.id === id);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  const isCredit = (type: string) => ['sale', 'refund', 'income'].includes(type)

  if (!transaction) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center text-center">
            <Card className="w-full max-w-md p-6">
                 <p className="text-lg font-semibold">Transaction not found.</p>
                <p className="text-muted-foreground mb-4">The transaction you are looking for does not exist.</p>
                <Link href="/transactions">
                    <Button>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Transactions
                    </Button>
                </Link>
            </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
        <div className="max-w-4xl mx-auto space-y-6">
            <Button variant="ghost" onClick={() => router.back()} className="-ml-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
            </Button>
            
            <div className="space-y-6">
                <div>
                    <p className="text-sm text-muted-foreground">{formatDate(transaction.date)}</p>
                    <h1 className="text-3xl font-bold tracking-tight">{transaction.title}</h1>
                    {transaction.description && <p className="text-muted-foreground mt-1">{transaction.description}</p>}
                </div>
                
                <p className={cn("text-4xl font-bold tracking-tight", isCredit(transaction.transaction_type) ? 'text-chart-2' : 'text-foreground')}>{formatCurrency(transaction.total_amount, transaction.currency)}</p>

                <Separator />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <DetailItem label="Status" value={<Badge variant="outline" className="capitalize">{transaction.status.replace('_', ' ')}</Badge>} />
                    <DetailItem label="Category" value={transaction.category} />
                    <DetailItem label="Type" value={<span className="capitalize">{transaction.transaction_type}</span>} />
                    <DetailItem label="Account" value={transaction.accountId} />
                    <DetailItem label="Recipient" value={transaction.recipient} />
                    <DetailItem label="Due On" value={formatDate(transaction.due_on)} />
                </div>

                {(transaction.balance_due > 0) && (
                    <>
                        <Separator />
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 items-start">
                            <DetailItem label="Amount Paid" value={formatCurrency(transaction.total_paid, transaction.currency)} />
                            <DetailItem label="Balance Due" value={<span className="text-destructive font-semibold">{formatCurrency(transaction.balance_due, transaction.currency)}</span>} />
                        </div>
                    </>
                )}

                {transaction.reference_document && (
                    <>
                        <Separator />
                        <DetailItem 
                            label="Attachment" 
                            value={
                                <Link href={typeof transaction.reference_document === 'string' ? transaction.reference_document : '#'} target="_blank" className="flex items-center gap-2 text-primary hover:underline">
                                    <Paperclip className="h-4 w-4" />
                                    <span>{typeof transaction.reference_document === 'string' ? transaction.reference_document.split('/').pop() : transaction.reference_document.name}</span>
                                </Link>
                            }
                        />
                    </>
                )}
            </div>
        </div>
    </AppShell>
  );
}
