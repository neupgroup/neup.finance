'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@neup/components/ui/button';
import { Input } from '@neup/components/ui/input';
import { Label } from '@neup/components/ui/label';
import { LinkButton } from '@neup/components/ui/link-button';
import { Card, CardContent } from '@neup/components/ui/card';
import { useToast } from '@neup/core/hooks/useToast';
import { Loader, PlusCircle } from 'lucide-react';
import { updateParty } from '@/core/hooks/api';
import type { SerializedParty } from '@/services/parties';

type EditableRow = { type: string; value: string };
type TaxInfo = { taxType?: string; taxNumber?: string } | null;

// Infer common contact types from their values, using address for other text.
function inferContactType(value: string): string {
  const trimmedValue = value.trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedValue)) return 'email';
  if (/^[+\d(][\d\s().-]{5,}$/.test(trimmedValue)) return 'phone';
  return 'address';
}

// Convert the stored tax metadata to the fields used by the party form.
function getTaxInfo(value: unknown): TaxInfo {
  if (!value || typeof value !== 'object') return null;
  return value as TaxInfo;
}

// Render the complete editable party profile and submit updates to the project API.
export function PartyEditForm({ party, projectId }: { party: SerializedParty; projectId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const initialTaxInfo = getTaxInfo(party.taxinfo);
  const initialAddress = party.contacts.find(({ type: contactType }) => contactType === 'address')?.value ?? '';
  const [name, setName] = useState(party.name);
  const [address, setAddress] = useState(initialAddress);
  const [type, setType] = useState(party.type);
  const [taxType, setTaxType] = useState(initialTaxInfo?.taxType ?? '');
  const [taxNumber, setTaxNumber] = useState(initialTaxInfo?.taxNumber ?? '');
  const [contacts, setContacts] = useState<EditableRow[]>(() => {
    const existingContacts = party.contacts.filter(({ type: rowType }) => rowType !== 'address').map(({ type: rowType, value }) => ({ type: rowType, value }));
    return existingContacts;
  });
  const [paymentMethods, setPaymentMethods] = useState<EditableRow[]>(party.paymentMethods.map(({ type: rowType, value }) => ({ type: rowType, value })));
  const [isSaving, setIsSaving] = useState(false);
  const projectQuery = projectId ? `?project=${encodeURIComponent(projectId)}` : '';

  // Update a single repeatable contact or payment method row.
  const updateRow = (rows: EditableRow[], setRows: (value: EditableRow[]) => void, index: number, field: keyof EditableRow, value: string) => {
    setRows(rows.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row));
  };

  // Persist all editable profile and related detail fields, then return to the party page.
  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !type) return;
    setIsSaving(true);
    try {
      await updateParty(party.id, {
        name: name.trim(),
        type,
        taxinfo: taxType !== 'none' && taxNumber.trim() ? { taxType, taxNumber: taxNumber.trim() } : null,
        contacts: [
          ...contacts.filter((row) => row.value.trim()).map((row) => ({ type: inferContactType(row.value), value: row.value.trim() })),
          ...(address.trim() ? [{ type: 'address', value: address.trim() }] : []),
        ],
        paymentMethods: paymentMethods.filter((row) => row.type.trim() && row.value.trim()),
      });
      toast({ name: 'app', title: 'Party updated', description: `${name.trim()} has been updated.` });
      router.push(`/party/${party.id}${projectQuery}`);
      router.refresh();
    } catch (error) {
      toast({ name: 'app', state: 'error', title: 'Could not update party', description: error instanceof Error ? error.message : 'Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Edit Party</h1>
        <p className="text-muted-foreground">Update a person or company you transact with.</p>
      </div>

      <form onSubmit={handleSave} className="w-full max-w-2xl space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="partyName">Name</Label>
            <div className="overflow-hidden rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
              <Input id="partyName" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g., John Doe" required className="h-11 rounded-none border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="partyAddress">Address</Label>
            <Input id="partyAddress" value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Enter an address" />
          </div>

          <div className="space-y-4">
            <fieldset className="min-w-0 space-y-2">
              <legend className="text-sm font-medium">Entity Type</legend>
              <div role="radiogroup" aria-label="Entity Type" className="flex w-full gap-2">
                {[{ value: 'person', label: 'Person' }, { value: 'organization', label: 'Organization' }].map((option) => (
                  <Button key={option.value} type="button" variant="outlined" className={`min-w-0 flex-1 justify-start text-left ${type === option.value ? 'border-primary bg-primary/15 font-semibold text-primary ring-1 ring-primary/40 hover:bg-primary/20' : 'border-border bg-background'}`} role="radio" aria-checked={type === option.value} onClick={() => setType(option.value)}>
                    <span className={`mr-2 flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border transition-colors duration-150 ${type === option.value ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/50 bg-background'}`}>
                      <span aria-hidden="true" className={`text-[11px] leading-none transition-all duration-150 ${type === option.value ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>✓</span>
                    </span>{option.label}
                  </Button>
                ))}
              </div>
            </fieldset>
            <fieldset className="min-w-0 space-y-2">
              <legend className="text-sm font-medium">Tax Type</legend>
              <div role="radiogroup" aria-label="Tax Type" className="flex w-full gap-2">
                {[{ value: 'pan', label: 'PAN' }, { value: 'vat', label: 'VAT' }, { value: 'none', label: 'None' }].map((option) => (
                  <Button key={option.value} type="button" variant="outlined" className={`min-w-0 flex-1 justify-start text-left ${taxType === option.value ? 'border-primary bg-primary/15 font-semibold text-primary ring-1 ring-primary/40 hover:bg-primary/20' : 'border-border bg-background'}`} role="radio" aria-checked={taxType === option.value} onClick={() => setTaxType(option.value)}>
                    <span className={`mr-2 flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border transition-colors duration-150 ${taxType === option.value ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/50 bg-background'}`}>
                      <span aria-hidden="true" className={`text-[11px] leading-none transition-all duration-150 ${taxType === option.value ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>✓</span>
                    </span>{option.label}
                  </Button>
                ))}
              </div>
            </fieldset>
          </div>
          <div className="space-y-4">
            <div className="space-y-2"><Label htmlFor="taxNumber">Tax Number</Label><Input id="taxNumber" value={taxNumber} onChange={(event) => setTaxNumber(event.target.value)} disabled={!taxType || taxType === 'none'} /></div>
          </div>

          <section className="!mt-8 space-y-3">
            <div>
              <h2 className="font-semibold">Contact</h2>
              <p className="text-sm text-muted-foreground">Add email, phone, or address details.</p>
            </div>
            <button type="button" onClick={() => setContacts([...contacts, { type: '', value: '' }])} className="block w-full rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Card className="border-dashed transition-colors hover:bg-muted/40">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="rounded-full bg-primary/10 p-2 text-primary"><PlusCircle className="h-4 w-4" /></div>
                  <div><p className="font-semibold">Add contact</p><p className="text-sm text-muted-foreground">Add another email, phone, or address.</p></div>
                </CardContent>
              </Card>
            </button>
            {contacts.length ? contacts.map((contact, index) => (
              <Card key={`contact-${index}`}>
                <CardContent className="space-y-2 p-4">
                  <Input aria-label={`Contact ${index + 1}`} id={`contact-value-${index}`} value={contact.value} onChange={(event) => updateRow(contacts, setContacts, index, 'value', event.target.value)} placeholder="Enter a contact value" />
                  {contacts.length > 1 ? <Button type="button" variant="text" className="h-auto px-0" onClick={() => setContacts(contacts.filter((_, rowIndex) => rowIndex !== index))}>Remove</Button> : null}
                </CardContent>
              </Card>
            )) : (
              <Card className="border-dashed">
                <CardContent className="p-4 text-sm text-muted-foreground">No contact methods found.</CardContent>
              </Card>
            )}
          </section>

          <section className="!mt-8 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div><h2 className="font-semibold">Payment Methods</h2><p className="text-sm text-muted-foreground">Add bank account, wallet, or other payment details.</p></div>
            </div>
            <button type="button" onClick={() => setPaymentMethods([...paymentMethods, { type: '', value: '' }])} className="block w-full rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Card className="border-dashed transition-colors hover:bg-muted/40">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="rounded-full bg-primary/10 p-2 text-primary"><PlusCircle className="h-4 w-4" /></div>
                  <div><p className="font-semibold">Add payment method</p><p className="text-sm text-muted-foreground">Add a bank account, wallet, or other payment details.</p></div>
                </CardContent>
              </Card>
            </button>
            {paymentMethods.length ? paymentMethods.map((method, index) => (
              <Card key={`payment-${index}`}>
                <CardContent className="space-y-2 p-4">
                  <p className="text-sm font-medium">Payment method {index + 1}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label htmlFor={`payment-type-${index}`}>Method</Label><Input id={`payment-type-${index}`} value={method.type} onChange={(event) => updateRow(paymentMethods, setPaymentMethods, index, 'type', event.target.value)} placeholder="e.g., bank, wallet" /></div>
                    <div className="space-y-2"><Label htmlFor={`payment-value-${index}`}>Details</Label><Input id={`payment-value-${index}`} value={method.value} onChange={(event) => updateRow(paymentMethods, setPaymentMethods, index, 'value', event.target.value)} placeholder="Enter payment details" /></div>
                  </div>
                  {paymentMethods.length > 1 ? <Button type="button" variant="text" className="h-auto px-0" onClick={() => setPaymentMethods(paymentMethods.filter((_, rowIndex) => rowIndex !== index))}>Remove payment method</Button> : null}
                </CardContent>
              </Card>
            )) : (
              <Card className="border-dashed">
                <CardContent className="p-4 text-sm text-muted-foreground">No payment methods found.</CardContent>
              </Card>
            )}
          </section>

          <div className="flex justify-start gap-2 mt-4">
          <Button type="submit" disabled={isSaving}>{isSaving ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}{isSaving ? 'Saving…' : 'Save Party'}</Button>
          <LinkButton href={`/party/${party.id}${projectQuery}`} variant="outlined">Cancel</LinkButton>
        </div>
      </form>
    </div>
  );
}
