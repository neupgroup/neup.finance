import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { getPartyPageData } from '@/services/parties';
import { PartyPageHeader, PartySubpageLinks, PartyTransactionsSection } from './party-detail-sections';

/*
::neup.documentation::party-detail-page
::function PartyDetailPage(props)

Renders a single party by id for the current account and shows its contact,
tax, payment, and related transaction details.

::param external props
::datatype { params: Promise<{ id: string }> }

The route parameters passed from `/party/[id]`.

::end
*/

type PartyDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PartyDetailPage({ params }: PartyDetailPageProps) {
  const { id } = await params;
  const cookieStore = await cookies();
  const connectionId = cookieStore.get('connection_id')?.value?.trim() || cookieStore.get('accountId')?.value?.trim() || null;
  if (!connectionId) {
    redirect('/onboarding');
  }

  const pageData = await getPartyPageData(connectionId, id);
  if (!pageData) {
    notFound();
  }
  const { party, transactions } = pageData;

  return (
    <AppShell>
      <div className="space-y-6">
        <PartyPageHeader
          party={party}
          description="Review this party and jump into contact details, payment methods, or related transactions."
        />
        <PartySubpageLinks partyId={party.id} />
        <PartyTransactionsSection transactions={transactions} />
      </div>
    </AppShell>
  );
}
