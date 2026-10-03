import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { getPartyPageData } from '@/services/parties';
import { PartyContactSection, PartyPageHeader } from '../party-detail-sections';

/*
::neup.documentation::party-contact-page
::function PartyContactPage(props)

Shows the dedicated contact details page for a party at `/party/[id]/contact`.

::param external props
::datatype { params: Promise<{ id: string }> }

The route parameters passed from `/party/[id]/contact`.

::end
*/

type PartyContactPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{ project?: string }>;
};

export default async function PartyContactPage({ params, searchParams }: PartyContactPageProps) {
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
    <AppShell>
      <div className="space-y-6">
        <PartyPageHeader
          party={pageData.party}
          title="Contact details"
          description="Email, phone, and address information for this party."
          showMeta={false}
        />
        <PartyContactSection party={pageData.party} />
      </div>
    </AppShell>
  );
}
