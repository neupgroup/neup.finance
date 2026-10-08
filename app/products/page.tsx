'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@neup/components/ui/badge';
import { Button } from '@neup/components/ui/button';
import { Skeleton } from '@neup/components/ui/skeleton';
import { Package, Inbox, PlusCircle } from 'lucide-react';
import { stackedCardClassName } from '@/components/ui/stacked-card';
import { StackedEmptyStateRow } from '@/components/ui/stacked-empty-state';

type Product = { id: string; name: string; code: string; type: string; category: string; unit: string; price: string | number; currency: string };

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [project, setProject] = useState('');
  useEffect(() => {
    const project = new URLSearchParams(window.location.search).get('project');
    setProject(project ?? '');
    fetch(`/bridge/api.v1/products${project ? `?project=${encodeURIComponent(project)}` : ''}`, { credentials: 'include' })
      .then(async (response) => { if (!response.ok) throw new Error('Unable to load products'); return response.json(); })
      .then(setProducts).catch((reason: Error) => setError(reason.message)).finally(() => setIsLoading(false));
  }, []);

  const addHref = `/products/add${project ? `?project=${encodeURIComponent(project)}` : ''}`;
  const stackedTotal = products.length + 1;
  return <div className="space-y-4">
    <div className="space-y-1"><h1 className="text-3xl font-bold tracking-tight">Products</h1><p className="text-sm text-muted-foreground">Manage goods and services for this project.</p></div>
    <div className="overflow-hidden rounded-lg border">
      {isLoading ? <div className="divide-y"><div className={stackedCardClassName(0, 4, 'flex items-center justify-between p-4')}><div className="flex items-center gap-4"><Skeleton className="h-10 w-10 rounded-full" /><div className="space-y-2"><Skeleton className="h-4 w-36" /><Skeleton className="h-3 w-52" /></div></div><Skeleton className="h-9 w-9 rounded-md" /></div>{[1, 2, 3].map((index) => <div key={index} className="flex items-center justify-between border-b border-border bg-card p-4"><div className="flex items-center gap-4"><Skeleton className="h-10 w-10 rounded-full" /><div className="space-y-2"><Skeleton className="h-4 w-36" /><Skeleton className="h-3 w-52" /></div></div><Skeleton className="h-6 w-24" /></div>)}</div> : error ? <p className="p-6 text-sm text-destructive">{error}</p> : <>
      <Link href={addHref} className="block"><div className={stackedCardClassName(0, stackedTotal, 'flex items-center justify-between p-4')}><div className="flex items-center gap-4"><div className="rounded-full bg-muted p-2"><PlusCircle className="h-5 w-5 text-muted-foreground" /></div><div><p className="font-semibold">Add Product</p><p className="text-sm text-muted-foreground">Add a new good or service to this project.</p></div></div><Button variant="ghost" size="icon"><PlusCircle className="h-5 w-5" /></Button></div></Link>
      {products.length ? products.map((product, index) => <div key={product.id} className={stackedCardClassName(index + 1, stackedTotal, 'flex items-center justify-between gap-4 p-4')}>
        <div className="flex min-w-0 items-center gap-4"><div className="rounded-full bg-muted p-2"><Package className="h-5 w-5 text-muted-foreground" /></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{product.name}</p><Badge variant="secondary" className="capitalize">{product.type}</Badge></div><p className="text-sm text-muted-foreground">{product.code} · {product.category} · per {product.unit}</p></div></div>
        <div className="shrink-0 text-right"><p className="font-semibold">{product.currency} {Number(product.price).toLocaleString()}</p><p className="text-sm text-muted-foreground">Unit price</p></div>
      </div>) : <StackedEmptyStateRow icon={Inbox} title="No products found" description="Create your first product from the card above." className={stackedCardClassName(1, 2, 'bg-card')} />}
      </>}
    </div>
  </div>;
}
