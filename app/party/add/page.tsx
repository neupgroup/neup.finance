'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@neup/components/ui/button';
import { Input } from '@neup/components/ui/input';
import { Label } from '@neup/components/ui/label';
import { useToast } from '@neup/core/hooks/useToast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@neup/components/ui/select';
import { Textarea } from '@neup/components/ui/textarea';
import { PlusCircle } from 'lucide-react';
import { createParty } from '@/core/hooks/api';

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
  const [type, setType] = useState('');
  const [taxType, setTaxType] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [bankInfo, setBankInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
            <Input id="partyName" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., John Doe" required />
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
