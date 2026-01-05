
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { useToast } from '@/hooks/use-toast';
import { type Projection, type ProjectionType, type ProjectionCertainty } from '@/lib/mock-data';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { addDoc, collection } from 'firebase/firestore';
import { Loader } from 'lucide-react';


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
    { value: 'NPR', label: 'NPR - Nepali Rupee' },
];


export default function AddProjectionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState<ProjectionType | ''>('');
  const [certainty, setCertainty] = useState<ProjectionCertainty | ''>('');
  const [currency, setCurrency] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const projectionsCollection = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return collection(firestore, 'users', user.uid, 'projections');
  }, [firestore, user?.uid]);


  const handleAddProjection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !type || !certainty || !currency || amount === '' || !user || !projectionsCollection) {
      toast({
        variant: "destructive",
        title: "Missing Fields",
        description: "Please fill out all required fields.",
      });
      return;
    }
    
    setIsSubmitting(true);

    try {
        const newProjection: Projection = {
            title,
            type: type as ProjectionType,
            certainty: certainty as ProjectionCertainty,
            amount: amount as number,
            date,
            currency,
            userId: user.uid,
        };
        
        await addDoc(projectionsCollection, newProjection);
        
        toast({
            title: "Projection Added",
            description: `A new projection for ${currency} ${amount} has been successfully added.`,
        });

        router.push('/projections');
    } catch (error) {
        console.error("Error creating projection:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not create projection. Please try again."
        });
    } finally {
        setIsSubmitting(false);
    }
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
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Save Projection
                    </Button>
                    <Button type="button" variant="outline" onClick={() => router.push('/projections')}>Cancel</Button>
                </div>
            </form>
        </div>
    </div>
    </AppShell>
  );
}
