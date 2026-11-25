'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Badge } from '@neup/components/ui/badge';
import { Skeleton } from '@neup/components/ui/skeleton';
import { cn } from '@neup/core/utils';
import { useParties } from '@/core/hooks/api';
import { ArrowDownLeft, ArrowUpRight, Building, Inbox, Mail, MapPin, MoreVertical, Phone, PlusCircle, User, Wallet } from 'lucide-react';
import { stackedCardClassName } from '@/components/ui/stacked-card';
import { StackedEmptyStateRow } from '@/components/ui/stacked-empty-state';

/*
::neup.documentation::party-list-page
::function PartyPage()

Renders the account party list and links each party into its detail id route.

::end
*/

export default function PartyPage() {
  const searchParams = useSearchParams();
  const { data: parties, isLoading } = useParties();
  const project = searchParams.get('project');
  const addPartyHref = project
    ? `/party/add?project=${encodeURIComponent(project)}`
    : '/party/add';
  const recipients = parties ?? [];
  const stackedTotal = recipients.length > 0 ? recipients.length + 1 : 2;

  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount);

  return (

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Your Parties</h1>
            <p className="text-sm text-muted-foreground">Organize the people and organizations you transact with.</p>
          </div>
        </div>

        <div className="w-full">
          <div className="overflow-hidden rounded-lg border">
            {isLoading ? (
              <div className="divide-y">
                <Link href={addPartyHref} className="block">
                  <div className={stackedCardClassName(0, 4, 'flex items-start justify-between p-4')}>
                    <div className="flex items-start gap-4">
                      <div className="mt-1 rounded-full bg-muted p-2">
                        <PlusCircle className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold">Add Party</p>
                        <p className="text-sm text-muted-foreground">Create a person or organization record.</p>
                      </div>
                    </div>
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground">
                      <PlusCircle className="h-5 w-5" />
                    </div>
                  </div>
                </Link>
                <div className="flex items-start justify-between border-b border-border bg-card p-4">
                  <div className="flex items-start gap-4">
                    <Skeleton className="mt-1 h-9 w-9 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                  <Skeleton className="h-9 w-9 rounded-md" />
                </div>
                <div className="flex items-start justify-between border-b border-border bg-card p-4">
                  <div className="flex items-start gap-4">
                    <Skeleton className="mt-1 h-9 w-9 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-52" />
                      <Skeleton className="h-3 w-36" />
                    </div>
                  </div>
                  <Skeleton className="h-9 w-9 rounded-md" />
                </div>
                <div className="flex items-start justify-between rounded-b-lg border-b-0 bg-card p-4">
                  <div className="flex items-start gap-4">
                    <Skeleton className="mt-1 h-9 w-9 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-44" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-9 w-9 rounded-md" />
                </div>
              </div>
            ) : (
              <>
                <Link href={addPartyHref} className="block">
                  <div className={stackedCardClassName(0, stackedTotal, 'flex items-start justify-between p-4')}>
                    <div className="flex items-start gap-4">
                      <div className="mt-1 rounded-full bg-muted p-2">
                        <PlusCircle className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold">Add Party</p>
                        <p className="text-sm text-muted-foreground">Create a person or organization record.</p>
                      </div>
                    </div>
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground">
                      <PlusCircle className="h-5 w-5" />
                    </div>
                  </div>
                </Link>

                {recipients.length > 0 ? recipients.map((party, index) => (
                  <div key={party.id} className={stackedCardClassName(index + 1, stackedTotal, 'flex items-start justify-between p-4')}>
                    <div className="flex items-start gap-4">
                      <div className="mt-1 rounded-full bg-muted p-2">
                        {party.type === 'person' ? <User className="h-5 w-5 text-muted-foreground" /> : <Building className="h-5 w-5 text-muted-foreground" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Link href={`/party/${party.id}`} className="font-semibold hover:underline">
                            {party.name}
                          </Link>
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
                        {party.totals?.received?.length || party.totals?.sent?.length ? (
                          <div className="mt-3 flex flex-col gap-1.5 text-sm text-muted-foreground">
                            {party.totals?.received?.length ? (
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <ArrowUpRight className="h-3.5 w-3.5 text-chart-2" />
                                <span>Amount received</span>
                                <span className="font-medium text-foreground">
                                  {party.totals.received.map((item) => formatCurrency(item.amount, item.currency)).join(', ')}
                                </span>
                              </div>
                            ) : null}
                            {party.totals?.sent?.length ? (
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <ArrowDownLeft className="h-3.5 w-3.5 text-foreground" />
                                <span>Amount sent</span>
                                <span className="font-medium text-foreground">
                                  {party.totals.sent.map((item) => formatCurrency(item.amount, item.currency)).join(', ')}
                                </span>
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground">
                      <MoreVertical className="h-5 w-5" />
                    </div>
                  </div>
                )) : (
                  <StackedEmptyStateRow
                    icon={Inbox}
                    title="No parties found"
                    description="Create your first party from the card above."
                    className={stackedCardClassName(1, 2, 'bg-card')}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>

  );
}
