'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import { Button } from '@neup/components/ui/button';
import { Input } from '@neup/components/ui/input';
import { Label } from '@neup/components/ui/label';
import { LinkButton } from '@neup/components/ui/link-button';
import { useToast } from '@neup/core/hooks/useToast';

export default function AddProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const project = searchParams.get('project');
  const [form, setForm] = useState({ type: 'goods', name: '', code: '', category: '', tax: '', unit: '', currency: 'NPR', price: '', moreDetails: '' });
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const query = project ? `?project=${encodeURIComponent(project)}` : '';
      const response = await fetch(`/bridge/api.v1/products${query}`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not create product');
      toast({ name: 'app', title: 'Product Created', description: `${form.name} has been added.` });
      router.push(`/products${project ? `?project=${encodeURIComponent(project)}` : ''}`);
    } catch (error) {
      toast({ name: 'app', state: 'error', title: 'Error', description: error instanceof Error ? error.message : 'Could not create product.' });
    } finally { setSubmitting(false); }
  }

  return <div className="-ml-2 space-y-4">
    <LinkButton href={`/products${project ? `?project=${encodeURIComponent(project)}` : ''}`} variant="ghost" className="w-fit px-0" preIcon={<ArrowLeft className="mr-2 h-4 w-4" />}>Back to products</LinkButton>
    <div className="w-full space-y-4">
      <div className="space-y-1"><h1 className="text-2xl font-semibold tracking-tight">Add Product</h1><p className="text-sm text-muted-foreground">Add a good or service to this project.</p></div>
      <form onSubmit={submit} className="space-y-4">
        <section className="space-y-5">
          <div className="border-b pb-3"><h2 className="text-lg font-semibold">Product Basics</h2><p className="mt-1 text-sm text-muted-foreground">Identify and describe the product.</p></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="product-name">Name</Label><Input id="product-name" value={form.name} onChange={(e) => update('name', e.target.value)} required /></div>
            <div className="space-y-2"><Label htmlFor="product-code">Code</Label><Input id="product-code" value={form.code} onChange={(e) => update('code', e.target.value)} required /></div>
            <div className="space-y-2"><Label htmlFor="product-type">Type</Label><select id="product-type" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.type} onChange={(e) => update('type', e.target.value)}><option value="goods">Goods</option><option value="services">Services</option></select></div>
            <div className="space-y-2"><Label htmlFor="product-category">Category</Label><Input id="product-category" value={form.category} onChange={(e) => update('category', e.target.value)} required /></div>
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="product-details">More details (JSON, optional)</Label><textarea id="product-details" className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.moreDetails} onChange={(e) => update('moreDetails', e.target.value)} placeholder='{"description":"..."}' /></div>
          </div>
        </section>
        <section className="space-y-5">
          <div className="border-b pb-3"><h2 className="text-lg font-semibold">Pricing Info</h2><p className="mt-1 text-sm text-muted-foreground">Set the product price, currency, and tax.</p></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="product-tax">Tax</Label><Input id="product-tax" value={form.tax} onChange={(e) => update('tax', e.target.value)} placeholder="e.g. VAT 13%" required /></div>
            <div className="space-y-2"><Label htmlFor="product-currency">Currency</Label><Input id="product-currency" value={form.currency} onChange={(e) => update('currency', e.target.value)} maxLength={3} required /></div>
            <div className="space-y-2"><Label htmlFor="product-price">Price</Label><Input id="product-price" type="number" min="0" step="any" value={form.price} onChange={(e) => update('price', e.target.value)} required /></div>
          </div>
        </section>
        <section className="space-y-5">
          <div className="border-b pb-3"><h2 className="text-lg font-semibold">Inventory Info</h2><p className="mt-1 text-sm text-muted-foreground">Set the unit used to track this product.</p></div>
          <div className="space-y-2"><Label htmlFor="product-unit">Unit</Label><Input id="product-unit" value={form.unit} onChange={(e) => update('unit', e.target.value)} placeholder="e.g. piece, hour" required /></div>
        </section>
        <div className="flex justify-end"><Button type="submit" disabled={submitting}><PlusCircle className="mr-2 h-4 w-4" />{submitting ? 'Adding…' : 'Add Product'}</Button></div>
      </form>
    </div>
  </div>;
}
