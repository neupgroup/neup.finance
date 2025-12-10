
'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreVertical, User, Mail, Link as LinkIcon, Building, Phone } from 'lucide-react';
import { recipients as initialRecipients, type Recipient } from '@/lib/mock-data';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function RecipientsPage() {
  const [recipients, setRecipients] = useState<Recipient[]>(initialRecipients);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Your Recipients</h1>
            <Link href="/recipients/add">
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Recipient
                </Button>
            </Link>
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
