
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { useToast } from '@/hooks/use-toast';
import { type Projection, type ProjectionType, type ProjectionCertainty, ProjectionStatus } from '@/lib/mock-data';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { addDoc, collection } from 'firebase/firestore';
import { Loader } from 'lucide-react';
import { Switch } from '@/components/ui/switch';


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

const recurrenceTypes = [
    { value: 'Once', label: 'Once' },
    { value: 'Daily', label: 'Daily' },
    { value: 'Weekly', label: 'Weekly' },
    { value: 'Monthly', label: 'Monthly' },
    { value: 'Yearly', label: 'Yearly' },
    { value: 'Custom', label: 'Custom' },
]


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
  const [recipient, setRecipient] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrence, setRecurrence] = useState('Once');
  const [endsOn, setEndsOn] = useState('');

  const projectionsCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'projections');
  }, [firestore]);


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
            status: 'Active',
            recipient,
            isRecurring,
            recurrence,
            endsOn: isRecurring ? endsOn : '',
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
                    <Label htmlFor="recipient">Recipient (Optional)</Label>
                    <Input id="recipient" value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="e.g., Client Name, Utility Company" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="date">Start Date</Label>
                        <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} required className={!date ? 'text-muted-foreground' : ''}/>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="type">Type</Label>
                        <Combobox
                            options={projectionTypes}
                            value={type}
                            onChange={(v) => setType(v as any)}
                            placeholder="Select type"
                        />
                    </div>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="certainty">Certainty Level</Label>
                        <Combobox
                            options={projectionCertainties}
                            value={certainty}
                            onChange={(v) => setCertainty(v as any)}
                            placeholder="Select certainty"
                        />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="recurrence">Recurrence</Label>
                        <Combobox
                            options={recurrenceTypes}
                            value={recurrence}
                            onChange={v => setRecurrence(v)}
                            placeholder="Select recurrence"
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="currency">Currency</Label>
                        <Combobox
                            options={currencies}
                            value={currency}
                            onChange={setCurrency}
                            placeholder="Select a currency"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="amount">Amount</Label>
                        <Input id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))} placeholder="0.00" required />
                    </div>
                </div>
                 <div className="flex items-center space-x-2">
                    <Switch id="is-recurring" checked={isRecurring} onCheckedChange={setIsRecurring} />
                    <Label htmlFor="is-recurring">Is this a recurring transaction?</Label>
                </div>

                {isRecurring && (
                     <div className="grid gap-2">
                        <Label htmlFor="endsOn">Ends On (Optional)</Label>
                        <Input id="endsOn" type="date" value={endsOn} onChange={e => setEndsOn(e.target.value)} className={!endsOn ? 'text-muted-foreground' : ''}/>
                        <p className="text-xs text-muted-foreground">Leave empty for a projection that repeats forever.</p>
                    </div>
                )}
                
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
