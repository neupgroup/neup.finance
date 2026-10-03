import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
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
  searchParams: Promise<{ project?: string }>;
};

export default async function PartyDetailPage({ params, searchParams }: PartyDetailPageProps) {
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
  const { party, transactions } = pageData;

  return (

      <div className="space-y-4">
        <PartyPageHeader
          party={party}
          description="Review this party and jump into contact details, payment methods, or related transactions."
        />
        <PartySubpageLinks partyId={party.id} />
        <PartyTransactionsSection transactions={transactions} />
      </div>

  );
}
