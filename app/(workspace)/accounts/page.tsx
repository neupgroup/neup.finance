/*
::neup.documentation::accounts-route-redirect
::title Accounts Route Redirect

Keeps the legacy `/accounts` path pointed at the canonical `/finaccounts`
surface.

::end
*/

import { redirect } from 'next/navigation';

export default function AccountsRedirectPage() {
  redirect('/finaccounts');
}
