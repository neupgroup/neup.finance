import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { getPartyPageData } from '@/services/parties';
import { PartyEditForm } from './party-edit-form';

/*
::neup.documentation::party-edit-page
::function PartyEditPage(props)

Loads the selected party and renders its complete editable profile form.

::end
*/

type PartyEditPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ project?: string }>;
};

// Load the party after verifying the current account can read it in this project.
export default async function PartyEditPage({ params, searchParams }: PartyEditPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const authToken = (await cookies()).get('auth')?.value?.trim();
  if (!authToken) redirect('/switch');

  const projectId = query.project?.trim() || '';
  const pageData = await getPartyPageData(authToken, projectId, id);
  if (!pageData) notFound();

  return <PartyEditForm party={pageData.party} projectId={projectId} />;
}
