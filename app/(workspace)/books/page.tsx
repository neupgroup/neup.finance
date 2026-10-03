/*
::neup.documentation::books-list-redirect
::title Books List Redirect

Redirects the legacy `/books` route to the canonical `/finaccounts` route.

::end
*/

import { redirect } from 'next/navigation';

export default function BooksPageRedirect() {
  redirect('/finaccounts');
}
