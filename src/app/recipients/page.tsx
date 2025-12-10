
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
import { PlusCircle, MoreVertical, User, Mail, Link as LinkIcon } from 'lucide-react';
import { recipients as initialRecipients, type Recipient } from '@/lib/mock-data';

export default function RecipientsPage() {
  const [recipients, setRecipients] = useState<Recipient[]>(initialRecipients);
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientWebsite, setRecipientWebsite] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddRecipient = (e: React.FormEvent) => {
    e.preventDefault();
    if (recipientName) {
      const newRecipient: Recipient = {
        id: `rec-${Date.now()}`,
        name: recipientName,
        email: recipientEmail,
        website: recipientWebsite,
      };
      setRecipients([...recipients, newRecipient]);
      setRecipientName('');
      setRecipientEmail('');
      setRecipientWebsite('');
      setIsDialogOpen(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Your Recipients</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Recipient
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Recipient</DialogTitle>
                <DialogDescription>
                  Add a new person or company you transact with.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddRecipient} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="recipientName">Name</Label>
                  <Input
                    id="recipientName"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="e.g., John Doe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recipientEmail">Email (Optional)</Label>
                  <Input
                    id="recipientEmail"
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="e.g., john.doe@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recipientWebsite">Website (Optional)</Label>
                  <Input
                    id="recipientWebsite"
                    value={recipientWebsite}
                    onChange={(e) => setRecipientWebsite(e.target.value)}
                    placeholder="e.g., johndoe.com"
                  />
                </div>
                <DialogFooter>
                  <Button type="submit">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Recipient
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="mx-auto max-w-4xl space-y-4">
          {recipients.map((recipient) => (
            <div key={recipient.id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-full bg-muted">
                    <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-semibold">{recipient.name}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {recipient.email && (
                        <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span>{recipient.email}</span>
                        </div>
                    )}
                    {recipient.website && (
                         <div className="flex items-center gap-1">
                            <LinkIcon className="h-3 w-3" />
                            <span>{recipient.website}</span>
                        </div>
                    )}
                  </div>
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
