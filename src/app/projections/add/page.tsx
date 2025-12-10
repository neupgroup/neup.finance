
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { useToast } from '@/hooks/use-toast';
import { projections, type Projection, type ProjectionType, type ProjectionCertainty } from '@/lib/mock-data';

const projectionTypes: {value: ProjectionType, label: ProjectionType}[] = [
    {value: 'Income', label: 'Income'},
    {value: 'Expense', label: 'Expense'},
];
const projectionCertainties: {value: ProjectionCertainty, label: ProjectionCertainty}[] = [
    {value: 'Fixed', label: 'Fixed'},
    {value: 'Probable', label: 'Probable'},
    {value: 'Possible', label: 'Possible'},
];
const currencies = [
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'JPY', label: 'JPY - Japanese Yen' },
    { value: 'INR', label: 'INR - Indian Rupee' },
];


export default function AddProjectionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState<ProjectionType | ''>('');
  const [certainty, setCertainty] = useState<ProjectionCertainty | ''>('');
  const [currency, setCurrency] = useState('');
  const [amount, setAmount] = useState<number | ''>('');


  const handleAddProjection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !type || !certainty || !currency || amount === '') {
      toast({
        variant: "destructive",
        title: "Missing Fields",
        description: "Please fill out all required fields.",
      });
      return;
    }
    
    const newProjection: Projection = {
      id: (projections.length + 1).toString(),
      title,
      type: type as ProjectionType,
      certainty: certainty as ProjectionCertainty,
      amount: amount,
      date,
      currency,
    };
    
    // In a real app, you'd send this to a server.
    // For now we just log it and show a success toast.
    console.log('New Projection:', newProjection);
    
    toast({
      title: "Projection Added",
      description: `A new projection for ${currency} ${amount} has been successfully added.`,
    });

    router.push('/projections');
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Add New Projection</h1>
            <p className="text-muted-foreground">
                Enter the details of your future income or expense.
            </p>
        </div>
        <div>
            <form onSubmit={handleAddProjection} className="grid gap-6">
                <div className="grid gap-2">
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Yearly Bonus" required />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} required className={!date ? 'text-muted-foreground' : ''}/>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="type">Type</Label>
                    <Combobox
                        options={projectionTypes}
                        value={type}
                        onChange={(v) => setType(v as any)}
                        placeholder="Select projection type"
                        searchPlaceholder="Search types..."
                        notFoundMessage="No type found."
                    />
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="certainty">Certainty Level</Label>
                    <Combobox
                        options={projectionCertainties}
                        value={certainty}
                        onChange={(v) => setCertainty(v as any)}
                        placeholder="Select certainty level"
                        searchPlaceholder="Search levels..."
                        notFoundMessage="No level found."
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Combobox
                        options={currencies}
                        value={currency}
                        onChange={setCurrency}
                        placeholder="Select a currency"
                        searchPlaceholder="Search currencies..."
                        notFoundMessage="No currency found."
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))} placeholder="0.00" required />
                </div>
                
                <div className="flex justify-start gap-2 mt-4">
                    <Button type="submit">Save Projection</Button>
                    <Button type="button" variant="outline" onClick={() => router.push('/projections')}>Cancel</Button>
                </div>
            </form>
        </div>
    </div>
    </AppShell>
  );
}
