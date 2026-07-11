/*
::neup.documentation::books-detail-redirect
::title Books Detail Redirect

Redirects the legacy `/books/:bookId` route to `/finaccounts/:bookId`.

::end
*/

import { redirect } from 'next/navigation';

export default async function BooksDetailRedirect(
  { params }: { params: Promise<{ bookId: string }> }
) {
  const { bookId } = await params;
  redirect(`/finaccounts/${bookId}`);
}
