
'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, MoreVertical, User, Mail, Link as LinkIcon, Building, Phone } from 'lucide-react';
import { recipients as initialRecipients, type Recipient, type RecipientType, type RecipientTaxType } from '@/lib/mock-data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function RecipientsPage() {
  const [recipients, setRecipients] = useState<Recipient[]>(initialRecipients);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<RecipientType | ''>('');
  const [taxType, setTaxType] = useState<RecipientTaxType | ''>('');
  const [taxNumber, setTaxNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [bankInfo, setBankInfo] = useState('');


  const resetForm = () => {
    setName('');
    setType('');
    setTaxType('');
    setTaxNumber('');
    setEmail('');
    setPhone('');
    setWebsite('');
    setBankInfo('');
  };

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
      setRecipients([...recipients, newRecipient]);
      resetForm();
      setIsDialogOpen(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Your Recipients</h1>
          <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
            if (!isOpen) resetForm();
            setIsDialogOpen(isOpen);
          }}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Recipient
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Create New Recipient</DialogTitle>
                    <DialogDescription>
                    Add a new person or company you transact with.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh] pr-6">
                    <form id="add-recipient-form" onSubmit={handleAddRecipient} className="space-y-4 py-4">
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

                    </form>
                </ScrollArea>
                 <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" form="add-recipient-form">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Recipient
                    </Button>
                </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <div className="mx-auto max-w-4xl space-y-4">
          {recipients.map((recipient) => (
            <div key={recipient.id} className="flex items-start justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-full bg-muted mt-1">
                    {recipient.type === 'person' ? <User className="h-5 w-5 text-muted-foreground" /> : <Building className="h-5 w-5 text-muted-foreground" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{recipient.name}</p>
                    <Badge variant="secondary" className="capitalize">{recipient.type}</Badge>
                  </div>
                  <div className="flex flex-col gap-1 text-sm text-muted-foreground mt-2">
                    {recipient.contact_info?.email && (
                        <div className="flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5" />
                            <a href={`mailto:${recipient.contact_info.email}`} className="hover:underline">{recipient.contact_info.email}</a>
                        </div>
                    )}
                    {recipient.contact_info?.phone && (
                        <div className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5" />
                            <span>{recipient.contact_info.phone}</span>
                        </div>
                    )}
                    {recipient.contact_info?.website && (
                         <div className="flex items-center gap-1.5">
                            <LinkIcon className="h-3.5 w-3.5" />
                            <a href={`https://${recipient.contact_info.website}`} target="_blank" rel="noopener noreferrer" className="hover:underline">{recipient.contact_info.website}</a>
                        </div>
                    )}
                  </div>
                   {recipient.tax_number && recipient.tax_type && recipient.tax_type !== 'none' && (
                    <div className="mt-2">
                        <Badge variant="outline" className={cn(
                            'border-dashed',
                            recipient.tax_type === 'pan' && 'border-sky-500/50 text-sky-500',
                            recipient.tax_type === 'vat' && 'border-amber-500/50 text-amber-500'
                        )}>
                            {recipient.tax_type.toUpperCase()}: {recipient.tax_number}
                        </Badge>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
