'use client';

import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useParties } from '@/hooks/api';
import { Building, Mail, MapPin, MoreVertical, Phone, PlusCircle, User, Wallet } from 'lucide-react';

export default function RecipientsPage() {
  const { data: parties } = useParties();
  const recipients = parties ?? [];

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Your Parties</h1>
          <Link href="/recipients/add">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Party
            </Button>
          </Link>
        </div>

        <div className="mx-auto max-w-4xl space-y-4">
          {recipients.length > 0 ? recipients.map((party) => (
            <div key={party.id} className="flex items-start justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50">
              <div className="flex items-start gap-4">
                <div className="mt-1 rounded-full bg-muted p-2">
                  {party.type === 'person' ? <User className="h-5 w-5 text-muted-foreground" /> : <Building className="h-5 w-5 text-muted-foreground" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{party.name}</p>
                    <Badge variant="secondary" className="capitalize">{party.type}</Badge>
                  </div>
                  <div className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground">
                    {party.contacts?.find((contact) => contact.type === 'email')?.value ? (
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" />
                        <a
                          href={`mailto:${party.contacts?.find((contact) => contact.type === 'email')?.value}`}
                          className="hover:underline"
                        >
                          {party.contacts?.find((contact) => contact.type === 'email')?.value}
                        </a>
                      </div>
                    ) : null}
                    {party.contacts?.find((contact) => contact.type === 'phone')?.value ? (
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{party.contacts?.find((contact) => contact.type === 'phone')?.value}</span>
                      </div>
                    ) : null}
                    {party.contacts?.find((contact) => contact.type === 'address')?.value ? (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{party.contacts?.find((contact) => contact.type === 'address')?.value}</span>
                      </div>
                    ) : null}
                  </div>
                  {party.taxinfo ? (
                    <div className="mt-2">
                      <Badge variant="outline" className={cn('border-dashed')}>
                        {String((party.taxinfo as any)?.taxType ?? 'tax').toUpperCase()}: {(party.taxinfo as any)?.taxNumber ?? 'N/A'}
                      </Badge>
                    </div>
                  ) : null}
                  {party.paymentMethods?.length ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {party.paymentMethods.map((method) => (
                        <Badge key={method.id} variant="secondary" className="gap-1">
                          <Wallet className="h-3 w-3" />
                          {method.type}: {method.value}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>
          )) : (
            <div className="py-12 text-center text-muted-foreground">
              <p>No parties found. Add your first one!</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
