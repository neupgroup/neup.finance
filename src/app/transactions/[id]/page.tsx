'use client';

import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { transactions, type Transaction } from '@/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

function DetailItem({ label, value }: { label: string; value?: React.ReactNode }) {
    if (!value) return null;
    return (
        <div className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="font-medium">{value}</p>
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

  if (!transaction) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-lg font-semibold">Transaction not found.</p>
            <p className="text-muted-foreground mb-4">The transaction you are looking for does not exist.</p>
            <Link href="/transactions">
                <Button>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Transactions
                </Button>
            </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">{transaction.title}</h1>
                {transaction.description && <p className="text-lg text-muted-foreground mt-1">{transaction.description}</p>}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Transaction Details</CardTitle>
                    <CardDescription>Complete information about this transaction.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-8">
                        <DetailItem label="Status" value={<Badge variant="outline" className="capitalize">{transaction.status.replace('_', ' ')}</Badge>} />
                        <DetailItem label="Date" value={formatDate(transaction.date)} />
                        <DetailItem label="Category" value={transaction.category} />
                        <DetailItem label="Type" value={<span className="capitalize">{transaction.transaction_type}</span>} />
                        <DetailItem label="Account" value={transaction.accountId} />
                        {transaction.recipient && <DetailItem label="Recipient" value={transaction.recipient} />}
                        {transaction.due_on && <DetailItem label="Due On" value={formatDate(transaction.due_on)} />}
                    </div>
                    <Separator />
                     <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        <DetailItem label="Total Amount" value={<span className="font-bold text-lg">{formatCurrency(transaction.total_amount, transaction.currency)}</span>} />
                        <DetailItem label="Amount Paid" value={formatCurrency(transaction.total_paid, transaction.currency)} />
                        <DetailItem label="Balance Due" value={<span className="text-destructive font-semibold">{formatCurrency(transaction.balance_due, transaction.currency)}</span>} />
                    </div>
                    {transaction.reference_document && (
                        <>
                            <Separator />
                            <DetailItem 
                                label="Attachment" 
                                value={
                                    typeof transaction.reference_document === 'string' ? 
                                    <Link href={transaction.reference_document} target="_blank" className="text-primary hover:underline">{transaction.reference_document}</Link> :
                                    (transaction.reference_document as File).name
                                }
                             />
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    </AppShell>
  );
}
