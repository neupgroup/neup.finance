import Link from 'next/link';
import { Badge } from '@neup/components/ui/badge';
import { Button } from '@neup/components/ui/button';
import { LinkButton } from '@neup/components/ui/link-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@neup/components/ui/card';
import { Separator } from '@neup/components/ui/separator';
import type { SerializedParty, SerializedPartyActivity } from '@/services/parties';
import { ArrowDownLeft, ArrowUpRight, Building, ChevronLeft, Inbox, Mail, MapPin, Phone, Wallet } from 'lucide-react';

/*
::neup.documentation::party-detail-sections
::title Party Detail Sections

Shared presentational helpers for `/party/[id]` pages so the overview, edit,
contact, and payment routes render the same party summary and section layouts.

::end
*/

export function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function isIncomingTransaction(transactionType: string) {
  return ['sale', 'refund', 'income'].includes(transactionType);
}

export function PartyPageHeader({
  party,
  title,
  description,
  showMeta = true,
}: {
  party: SerializedParty;
  title?: string;
  description?: string;
  showMeta?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-2">
        <LinkButton href="/party" variant="text" className="px-0" preIcon={<ChevronLeft className="h-4 w-4" />}>Back to parties</LinkButton>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{party.name}</h1>
          {title ? <p className="text-sm font-medium text-foreground">{title}</p> : null}
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
      </div>

      {showMeta ? (
        <Badge variant="secondary" className="capitalize">
          {party.type}
        </Badge>
      ) : null}
    </div>
  );
}

export function PartySubpageLinks({ partyId }: { partyId: string }) {
  const links = [
    { href: `/party/${partyId}/edit`, label: 'Edit party', description: 'Open the full party overview.' },
    { href: `/party/${partyId}/contact`, label: 'Contact details', description: 'View email, phone, and address details.' },
    { href: `/party/${partyId}/payment`, label: 'Payment methods', description: 'View bank and payment rails.' },
  ];

  return (
    <section className="grid gap-3 md:grid-cols-3">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="rounded-lg border bg-card p-4 transition-colors hover:bg-muted/40"
        >
          <p className="font-medium">{link.label}</p>
          <p className="mt-1 text-sm text-muted-foreground">{link.description}</p>
        </Link>
      ))}
    </section>
  );
}

export function PartyOverviewSection({ party }: { party: SerializedParty }) {
  const taxInfo = party.taxinfo as { taxType?: string; taxNumber?: string } | null | undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Overview</CardTitle>
        <CardDescription>Identity and tax information for this party.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-muted p-2">
            <Building className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">Type</p>
            <p className="text-sm text-muted-foreground capitalize">{party.type}</p>
          </div>
        </div>

        {taxInfo ? (
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-muted p-2">
              <Inbox className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">Tax info</p>
              <p className="text-sm text-muted-foreground">
                {String(taxInfo.taxType ?? 'tax').toUpperCase()}: {taxInfo.taxNumber ?? 'N/A'}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No tax information saved yet.</p>
        )}
      </CardContent>
    </Card>
  );
}

export function PartyContactSection({ party }: { party: SerializedParty }) {
  const email = party.contacts.find((contact) => contact.type === 'email')?.value;
  const phone = party.contacts.find((contact) => contact.type === 'phone')?.value;
  const address = party.contacts.find((contact) => contact.type === 'address')?.value;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact details</CardTitle>
        <CardDescription>Primary email, phone, and address information for this party.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {email ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <a href={`mailto:${email}`} className="hover:underline">
                {email}
              </a>
            </div>
          ) : null}
          {phone ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{phone}</span>
            </div>
          ) : null}
          {address ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{address}</span>
            </div>
          ) : null}
          {!email && !phone && !address ? (
            <p className="text-sm text-muted-foreground">No contact details saved yet.</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export function PartyPaymentSection({ party }: { party: SerializedParty }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment methods</CardTitle>
        <CardDescription>Saved payment rails and account details for this party.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {party.paymentMethods.length > 0 ? (
          party.paymentMethods.map((method) => (
            <div key={method.id} className="flex items-start gap-3 rounded-lg border p-3">
              <div className="rounded-full bg-muted p-2">
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium capitalize">{method.type}</p>
                <p className="text-sm text-muted-foreground break-all">{method.value}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No payment methods saved yet.</p>
        )}
      </CardContent>
    </Card>
  );
}

export function PartyTransactionsSection({ activities }: { activities: SerializedPartyActivity[] }) {
  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">Transactions</h2>
        <p className="text-sm text-muted-foreground">Transactions already linked to this party.</p>
      </div>

      {activities.length > 0 ? (
        <div className="space-y-3">
          {activities.map((activity) => {
            const incoming = activity.incoming;

            return (
              <Link
                key={`${activity.type}:${activity.id}`}
                href={activity.href}
                className="flex flex-col gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-muted/40 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-muted p-2">
                    {incoming ? (
                      <ArrowUpRight className="h-4 w-4 text-chart-2" />
                    ) : (
                      <ArrowDownLeft className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{activity.title}</p>
                      <Badge variant="outline" className="capitalize">
                        {activity.status.replaceAll('_', ' ')}
                      </Badge>
                      <Badge variant="secondary">{activity.type.replaceAll('-', ' ')}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
                      <span>{formatDate(activity.date)}</span>
                    </div>
                    {activity.description ? (
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                    ) : null}
                  </div>
                </div>
                <div className="space-y-1 text-left md:text-right">
                  <p className={incoming ? 'font-semibold text-chart-2' : 'font-semibold text-foreground'}>
                    {incoming ? '+' : '-'}
                    {formatCurrency(activity.amount, activity.currency)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No transactions are linked to this party yet.</p>
      )}
    </section>
  );
}

export function PartyDetailStack({ party }: { party: SerializedParty }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <PartyContactSection party={party} />
      <PartyPaymentSection party={party} />
    </div>
  );
}

export function PartySectionDivider() {
  return <Separator />;
}
