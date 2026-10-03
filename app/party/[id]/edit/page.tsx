import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
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
};

export default async function PartyEditPage({ params }: PartyEditPageProps) {
  const { id } = await params;
  const cookieStore = await cookies();
  const authToken = cookieStore.get('auth_account')?.value?.trim() || null;

  if (!authToken) {
    redirect('/onboarding');
  }

  const projectId = cookieStore.get('project_id')?.value?.trim() || '';
  const pageData = await getPartyPageData(authToken, projectId, id);
  if (!pageData) {
    notFound();
  }

  const { party } = pageData;

  return (
    <AppShell>
      <div className="space-y-6">
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
    </AppShell>
  );
}
