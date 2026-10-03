/*
::neup.documentation::books-add-redirect
::title Books Add Redirect

Redirects the legacy `/books/add` route to the canonical `/finaccounts/add`
route.

::end
*/

import { redirect } from 'next/navigation';

export default function BooksAddRedirect() {
  redirect('/finaccounts/add');
}
