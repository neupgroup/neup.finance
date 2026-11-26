'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@neup/components/ui/button';
import { Input } from '@neup/components/ui/input';
import { Label } from '@neup/components/ui/label';
import { useToast } from '@neup/core/hooks/useToast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@neup/components/ui/select';
import { Textarea } from '@neup/components/ui/textarea';
import { Loader, PlusCircle, Sparkles } from 'lucide-react';
import { createParty, extractPartyName } from '@/core/hooks/api';

/*
::neup.documentation::party-add-page
::function AddPartyPage()

Creates a new party, then forwards the user to the generated id detail page.

::end
*/

export default function AddPartyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const project = searchParams.get('project');
  const projectQuery = project ? `?project=${encodeURIComponent(project)}` : '';

  const [name, setName] = useState('');
  const [nameInformation, setNameInformation] = useState('');
  const [isInformationVisible, setIsInformationVisible] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState('');
  const [type, setType] = useState('');
  const [taxType, setTaxType] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [bankInfo, setBankInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use entered name and optional Shift+Enter notes to improve only the party name.
  const handleExtractName = async () => {
    if ((!name.trim() && !nameInformation.trim()) || isExtracting) return;
    setIsExtracting(true);
    setExtractError('');
    try {
      const { result } = await extractPartyName({
        ...(name.trim() ? { name: name.trim() } : {}),
        ...(nameInformation.trim() ? { information: nameInformation.trim() } : {}),
      });
      setName(result.name);
    } catch (error) {
      setExtractError(error instanceof Error ? error.message : 'Could not extract the party name.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleAddParty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !type) {
      return;
    }

    setIsSubmitting(true);

    try {
      const createdParty = await createParty({
        name,
        type,
        taxinfo: taxType && taxType !== 'none'
          ? { taxType, taxNumber: taxNumber || undefined }
          : undefined,
        contacts: [
          email ? { type: 'email', value: email } : null,
          phone ? { type: 'phone', value: phone } : null,
          address ? { type: 'address', value: address } : null,
        ].filter(Boolean) as Array<{ type: string; value: string }>,
        paymentMethods: bankInfo ? [{ type: 'bank', value: bankInfo }] : [],
      });

      toast({
        name: 'app',
        title: 'Party Added',
        description: `${name} has been successfully added.`,
      });

      router.push(`/party/${createdParty.id}${projectQuery}`);
    } catch (error) {
      console.error('Failed to create party', error);
      toast({
        name: 'app',
        state: 'error',
        title: 'Error',
        description: 'Could not save the party. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (

      <div className="mx-auto max-w-2xl space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Party</h1>
          <p className="text-muted-foreground">Add a person or company you transact with.</p>
        </div>

        <form onSubmit={handleAddParty} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="partyName">Name</Label>
            <div className="overflow-hidden rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
              <Input
                id="partyName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && event.shiftKey) {
                    event.preventDefault();
                    setIsInformationVisible(true);
                  }
                }}
                placeholder="e.g., John Doe"
                required
                className="h-11 rounded-none border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              {isInformationVisible ? (
                <div className="border-t border-dashed border-border px-3 pt-2">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Add more information</p>
                  <Textarea
                    id="partyNameInformation"
                    autoFocus
                    value={nameInformation}
                    onChange={(event) => setNameInformation(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Backspace' && !nameInformation) {
                        event.preventDefault();
                        setIsInformationVisible(false);
                        document.getElementById('partyName')?.focus();
                      }
                    }}
                    placeholder="Type extra details to help identify the name…"
                    rows={3}
                    className="min-h-20 resize-y rounded-none border-0 px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              ) : null}
            </div>
            <button type="button" onClick={handleExtractName} disabled={isExtracting || (!name.trim() && !nameInformation.trim())} className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-50">
              {isExtracting ? <Loader className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {isExtracting ? 'Extracting…' : 'Extract from it'}
            </button>
            {extractError ? <p className="text-sm font-medium text-destructive" role="alert">{extractError}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="partyType">Type</Label>
            <Select onValueChange={setType} value={type} required>
              <SelectTrigger id="partyType"><SelectValue placeholder="Select a type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="person">Person</SelectItem>
                <SelectItem value="organization">Organization</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="taxType">Tax Type</Label>
              <Select onValueChange={setTaxType} value={taxType}>
                <SelectTrigger id="taxType"><SelectValue placeholder="Select tax type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pan">PAN</SelectItem>
                  <SelectItem value="vat">VAT</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxNumber">Tax Number</Label>
              <Input id="taxNumber" value={taxNumber} onChange={(e) => setTaxNumber(e.target.value)} disabled={!taxType || taxType === 'none'} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g., Kathmandu, Nepal" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bankInfo">Payment Method / Bank Details</Label>
            <Textarea id="bankInfo" value={bankInfo} onChange={(e) => setBankInfo(e.target.value)} placeholder="e.g., Bank name, account number, wallet ID" />
          </div>

          <div className="flex justify-start gap-2 mt-4">
            <Button type="submit" disabled={isSubmitting}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Save Party
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push(`/party${projectQuery}`)}>
              Cancel
            </Button>
          </div>
        </form>
      </div>

  );
}
