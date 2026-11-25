/*
::neup.documentation::accounts-route-redirect
::title Accounts Route Redirect

Keeps the legacy `/accounts` path pointed at the canonical `/finaccounts`
surface.

::end
*/

import { redirect } from 'next/navigation';

export default async function AccountsRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
    } else if (value !== undefined) {
      params.set(key, value);
    }
  }

  const query = params.toString();
  redirect(`/finaccounts${query ? `?${query}` : ''}`);
}
