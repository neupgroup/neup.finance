
import { redirect } from 'next/navigation';

/*
::neup.documentation::legacy-transaction-invoice-page
::function InvoicePage(props)

Redirects the legacy transaction invoice route to the generic print route.

::param external props
::datatype { params: { id: string } }

The route parameters provided by Next.js.

::returns
::datatype never

::end
*/
const InvoicePage = ({ params }: { params: { id: string } }) => {
    redirect(`/print?type=transaction&id=${encodeURIComponent(params.id)}`);
};

export default InvoicePage;
