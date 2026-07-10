import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { getPartyPageData } from '@/services/parties';
import { PartyPageHeader, PartyPaymentSection } from '../party-detail-sections';

/*
::neup.documentation::party-payment-page
::function PartyPaymentPage(props)

Shows the dedicated payment methods page for a party at `/party/[id]/payment`.

::param external props
::datatype { params: Promise<{ id: string }> }

The route parameters passed from `/party/[id]/payment`.

::end
*/

type PartyPaymentPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PartyPaymentPage({ params }: PartyPaymentPageProps) {
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

  return (
    <AppShell>
      <div className="space-y-6">
        <PartyPageHeader
          party={pageData.party}
          title="Payment methods"
          description="Saved bank accounts, wallets, and payment rails for this party."
          showMeta={false}
        />
        <PartyPaymentSection party={pageData.party} />
      </div>
    </AppShell>
  );
}
