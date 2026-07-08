
import { notFound } from 'next/navigation';
import { TransactionPrintPage } from './transaction-print-page';

/*
::neup.documentation::print-page
::function PrintPage(props)

Renders printable documents selected by the `type` query parameter.

::param external props
::datatype { searchParams?: { type?: string; id?: string } }

The query parameters used to select and identify the printable document.

::returns
::datatype JSX.Element

The printable page for `/print?type=transaction&id=[id]`.

::end
*/
const PrintPage = ({ searchParams }: { searchParams?: { type?: string; id?: string } }) => {
    if (searchParams?.type !== 'transaction' || !searchParams.id) {
        notFound();
    }

    return <TransactionPrintPage id={searchParams.id} />;
};

export default PrintPage;
