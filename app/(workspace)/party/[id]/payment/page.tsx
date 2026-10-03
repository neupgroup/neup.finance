import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
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
  searchParams: Promise<{ project?: string }>;
};

export default async function PartyPaymentPage({ params, searchParams }: PartyPaymentPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const cookieStore = await cookies();
  const authToken = cookieStore.get('auth_account')?.value?.trim() || null;

  if (!authToken) {
    redirect('/switch');
  }

  const projectId = query.project?.trim() || '';
  const pageData = await getPartyPageData(authToken, projectId, id);
  if (!pageData) {
    notFound();
  }

  return (

      <div className="space-y-4">
        <PartyPageHeader
          party={pageData.party}
          title="Payment methods"
          description="Saved bank accounts, wallets, and payment rails for this party."
          showMeta={false}
        />
        <PartyPaymentSection party={pageData.party} />
      </div>

  );
}
