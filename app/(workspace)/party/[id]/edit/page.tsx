import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { getPartyPageData } from '@/services/parties';
import { PartyContactSection, PartyOverviewSection, PartyPageHeader, PartyPaymentSection } from '../party-detail-sections';

/*
::neup.documentation::party-edit-page
::function PartyEditPage(props)

Shows the expanded party overview page at `/party/[id]/edit` with separate
overview, contact, and payment sections for the current account.

::param external props
::datatype { params: Promise<{ id: string }> }

The route parameters passed from `/party/[id]/edit`.

::end
*/

type PartyEditPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{ project?: string }>;
};

export default async function PartyEditPage({ params, searchParams }: PartyEditPageProps) {
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

  const { party } = pageData;

  return (

      <div className="space-y-4">
        <PartyPageHeader
          party={party}
          title="Edit party"
          description="Review the party profile with dedicated sections for contact details and payment methods."
          showMeta={false}
        />

        <div className="grid gap-6">
          <PartyOverviewSection party={party} />
          <PartyContactSection party={party} />
          <PartyPaymentSection party={party} />
        </div>
      </div>

  );
}
