
import { notFound } from 'next/navigation';
import { redirect } from 'next/navigation';

/*
::neup.documentation::print-page
::function PrintPage(props)

Renders printable documents selected by the `type` query parameter.

::param external props
::datatype { searchParams?: { type?: string; id?: string; accountId?: string; transactionId?: string; project?: string } }

The query parameters used to select and identify the printable document.

::returns
::datatype JSX.Element

The printable page for transaction documents selected through `/print` query parameters.

::end
*/
const PrintPage = async ({ searchParams }: { searchParams: Promise<{ type?: string; id?: string; accountId?: string; transactionId?: string; project?: string }> }) => {
    const query = await searchParams;
    if (query.type === 'bank-transaction' && query.transactionId) {
        redirect(`/print/${encodeURIComponent(query.transactionId)}?type=bank-transaction&accountId=${encodeURIComponent(query.accountId ?? '')}${query.project ? `&project=${encodeURIComponent(query.project)}` : ''}`);
    }
    if (query.type === 'transaction' && query.id) redirect(`/print/${encodeURIComponent(query.id)}?type=invoice`);
    notFound();
};

export default PrintPage;
