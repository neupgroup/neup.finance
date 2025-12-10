
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { recipients as initialRecipients, type Recipient, type RecipientType, type RecipientTaxType } from '@/lib/mock-data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle } from 'lucide-react';

export default function AddRecipientPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<RecipientType | ''>('');
  const [taxType, setTaxType] = useState<RecipientTaxType | ''>('');
  const [taxNumber, setTaxNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [bankInfo, setBankInfo] = useState('');

  const handleAddRecipient = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && type) {
      const newRecipient: Recipient = {
        id: `rec-${Date.now()}`,
        name,
        type: type as RecipientType,
        tax_type: taxType as RecipientTaxType,
        tax_number: taxNumber,
        contact_info: {
          email: email || undefined,
          phone: phone || undefined,
          website: website || undefined,
        },
        bank_information: bankInfo,
        created_on: new Date().toISOString(),
      };
      
      // In a real app, this would be sent to a server
      initialRecipients.push(newRecipient);
      console.log('New Recipient:', newRecipient);
      
      toast({
        title: "Recipient Added",
        description: `${name} has been successfully added.`,
      });

      router.push('/recipients');
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Recipient</h1>
          <p className="text-muted-foreground">
            Add a new person or company you transact with.
          </p>
        </div>
        <div>
          <form onSubmit={handleAddRecipient} className="space-y-4 py-4">
              <div className="space-y-2">
                  <Label htmlFor="recipientName">Name</Label>
                  <Input id="recipientName" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., John Doe" required />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="recipientType">Type</Label>
                   <Select onValueChange={(v) => setType(v as RecipientType)} value={type} required>
                      <SelectTrigger id="recipientType"><SelectValue placeholder="Select a type" /></SelectTrigger>
                      <SelectContent>
                          <SelectItem value="person">Person</SelectItem>
                          <SelectItem value="organization">Organization</SelectItem>
                      </SelectContent>
                  </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <Label htmlFor="taxType">Tax Type</Label>
                      <Select onValueChange={(v) => setTaxType(v as RecipientTaxType)} value={taxType}>
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

              <h3 className="text-md font-semibold pt-4 border-b pb-2">Contact Information</h3>
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
                      <Label htmlFor="website">Website</Label>
                      <Input id="website" value={website} onChange={(e) => setWebsite(e.target.value)} />
                  </div>
              </div>
              
              <h3 className="text-md font-semibold pt-4 border-b pb-2">Bank Information</h3>
               <div className="space-y-2">
                  <Label htmlFor="bankInfo">Bank Details</Label>
                  <Textarea id="bankInfo" value={bankInfo} onChange={(e) => setBankInfo(e.target.value)} placeholder="e.g., Bank Name, Account Number, SWIFT/BIC" />
              </div>
              <div className="flex justify-start gap-2 mt-4">
                  <Button type="submit">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Save Recipient
                  </Button>
                  <Button type="button" variant="outline" onClick={() => router.push('/recipients')}>Cancel</Button>
              </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
