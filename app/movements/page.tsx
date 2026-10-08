'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@neup/components/ui/badge';
import { Skeleton } from '@neup/components/ui/skeleton';
import { ArrowDownLeft, ArrowUpRight, Scale, Inbox } from 'lucide-react';
import { cn } from '@neup/core/utils';
import { stackedCardClassName } from '@/components/ui/stacked-card';
import { StackedEmptyStateRow } from '@/components/ui/stacked-empty-state';

type Movement = { id: string; type: string; amount: number; by: string; referenceId: string; on: string; product: { name: string; code: string; unit: string } };

export default function MovementsPage() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    const project = new URLSearchParams(window.location.search).get('project');
    fetch(`/bridge/api.v1/movements${project ? `?project=${encodeURIComponent(project)}` : ''}`, { credentials: 'include' })
      .then(async (response) => { if (!response.ok) throw new Error('Unable to load movements'); return response.json(); })
      .then(setMovements).catch((reason: Error) => setError(reason.message)).finally(() => setIsLoading(false));
  }, []);

  const stackedTotal = movements.length || 1;
  const movementIcon = (type: string) => type === 'incoming' ? <ArrowDownLeft className="h-5 w-5 text-chart-2" /> : type === 'outgoing' ? <ArrowUpRight className="h-5 w-5 text-destructive" /> : <Scale className="h-5 w-5 text-muted-foreground" />;
  return <div className="space-y-4">
    <div className="space-y-1"><h1 className="text-3xl font-bold tracking-tight">Movements</h1><p className="text-sm text-muted-foreground">Review incoming, outgoing, and balancing stock movements.</p></div>
    <div className="overflow-hidden rounded-lg border">
      {isLoading ? <div className="divide-y">{[0, 1, 2].map((index) => <div key={index} className="flex items-center justify-between bg-card p-4"><div className="flex items-center gap-4"><Skeleton className="h-10 w-10 rounded-full" /><div className="space-y-2"><Skeleton className="h-4 w-36" /><Skeleton className="h-3 w-52" /></div></div><Skeleton className="h-6 w-24" /></div>)}</div> : error ? <p className="p-6 text-sm text-destructive">{error}</p> : movements.length ? movements.map((movement, index) => <div key={movement.id} className={stackedCardClassName(index, stackedTotal, 'flex items-center justify-between gap-4 p-4')}>
        <div className="flex min-w-0 items-center gap-4"><div className={cn('rounded-full p-2', movement.type === 'incoming' ? 'bg-chart-2/20' : movement.type === 'outgoing' ? 'bg-destructive/20' : 'bg-muted')}>{movementIcon(movement.type)}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{movement.product.name}</p><Badge variant="outline" className="capitalize">{movement.type}</Badge></div><p className="text-sm text-muted-foreground">{movement.product.code} · {movement.referenceId} · {new Date(movement.on).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p><p className="text-xs text-muted-foreground">Recorded by {movement.by}</p></div></div>
        <div className="shrink-0 text-right"><p className={cn('font-semibold', movement.type === 'incoming' && 'text-chart-2', movement.type === 'outgoing' && 'text-destructive')}>{movement.type === 'incoming' ? '+' : movement.type === 'outgoing' ? '−' : ''}{movement.amount.toLocaleString()} {movement.product.unit}</p><p className="text-sm text-muted-foreground">Quantity</p></div>
      </div>) : <StackedEmptyStateRow icon={Inbox} title="No movements found" description="Product movements recorded in this project will appear here." className={stackedCardClassName(0, 1, 'bg-card')} />}
    </div>
  </div>;
}
