
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { Button } from '@neup/components/ui/button';
import { LinkButton } from '@neup/components/ui/link-button';
import { Input } from '@neup/components/ui/input';
import { Label } from '@neup/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { CurrencyAmountInput } from '@/components/ui/currency-amount-input';
import { useToast } from '@neup/core/hooks/useToast';
import {
  projectionCertaintyOptions,
  projectionRecurrenceOptions,
  projectionTypeOptions,
  type Projection,
  type ProjectionType,
  type ProjectionCertainty,
  type ProjectionRecurrence,
} from '@/core/lib/ledger';
import { useUser } from '@/core/providers/auth';
import { createProjection, useParties } from '@/core/hooks/api';
import { Loader } from 'lucide-react';
import { Switch } from '@neup/components/ui/switch';


export default function AddProjectionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project')?.trim();
  const projectionsHref = `/projections${projectId ? `?project=${encodeURIComponent(projectId)}` : ''}`;
  const { toast } = useToast();
  const { user } = useUser();
  const { data: parties } = useParties();

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState<ProjectionType | ''>('');
  const [certainty, setCertainty] = useState<ProjectionCertainty | ''>('');
  const [currency, setCurrency] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [partyId, setPartyId] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrence, setRecurrence] = useState<ProjectionRecurrence>('Once');
  const [endsOn, setEndsOn] = useState('');

  const handleAddProjection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !type || !certainty || !currency || amount === '' || !user) {
      toast({
        name: 'app',
        state: "error",
        title: "Missing Fields",
        description: "Please fill out all required fields.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
        const selectedParty = parties?.find((party) => party.id === partyId);
        const newProjection: Omit<Projection, 'id'> = {
            title,
            type: type as ProjectionType,
            certainty: certainty as ProjectionCertainty,
            amount: amount as number,
            date,
            currency,
            userId: user.uid,
            status: 'Active',
            recipient: selectedParty?.name,
            isRecurring,
            recurrence,
            endsOn: isRecurring ? endsOn : '',
        };

        await createProjection(newProjection);

        toast({
            name: 'app',
            title: "Projection Added",
            description: `A new projection for ${currency} ${amount} has been successfully added.`,
        });

        router.push(projectionsHref);
    } catch (error) {
        console.error("Error creating projection:", error);
        toast({
            name: 'app',
            state: "error",
            title: "Error",
            description: "Could not create projection. Please try again."
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (

      <div className="mx-auto max-w-2xl space-y-4">
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
                    <Label htmlFor="party">Party <span className="text-muted-foreground">(Optional)</span></Label>
                    <Combobox
                        options={(parties ?? []).map((party) => ({
                            value: party.id,
                            label: `${party.name} (${party.type})`,
                        }))}
                        value={partyId}
                        onChange={setPartyId}
                        placeholder="Select party"
                        searchPlaceholder="Search parties..."
                        notFoundMessage="No parties found. Add one in Party."
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="date">Start Date</Label>
                        <input
                          id="date"
                          type="date"
                          value={date}
                          onChange={e => setDate(e.target.value)}
                          required
                          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="type">Type</Label>
                        <Combobox
                            options={projectionTypeOptions}
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
                            options={projectionCertaintyOptions}
                            value={certainty}
                            onChange={(v) => setCertainty(v as any)}
                            placeholder="Select certainty"
                        />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="recurrence">Recurrence</Label>
                        <Combobox
                            options={projectionRecurrenceOptions}
                            value={recurrence}
                            onChange={v => setRecurrence(v as ProjectionRecurrence)}
                            placeholder="Select recurrence"
                        />
                    </div>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="amount">Total amount</Label>
                    <CurrencyAmountInput
                        id="amount"
                        currency={currency}
                        amount={amount}
                        onCurrencyChange={setCurrency}
                        onAmountChange={setAmount}
                        currencyPlaceholder="Type a country name, then press space"
                        amountPlaceholder="0.00"
                        placeholder="0.00"
                        required
                    />
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
                    <LinkButton href={projectionsHref} variant="outlined">Cancel</LinkButton>
                </div>
            </form>
        </div>
    </div>

  );
}
