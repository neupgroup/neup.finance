
import { redirect } from 'next/navigation';

/*
::neup.documentation::legacy-transaction-invoice-page
::function InvoicePage(props)

Redirects to the invoice document list. Legacy transaction IDs are not invoice IDs.

::param external props
::datatype { params: Promise<{ id: string }> }

The route parameters provided by Next.js.

::returns
::datatype never

::end
*/
const InvoicePage = async ({ params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    redirect(`/documents/sales?type=invoice&legacyTransaction=${encodeURIComponent(id)}`);
};

export default InvoicePage;
