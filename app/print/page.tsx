
import { notFound } from 'next/navigation';
import { TransactionPrintPage } from './transaction-print-page';
import { FinAccountTransactionDocument } from './fin-account-transaction-document';

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
const PrintPage = ({ searchParams }: { searchParams?: { type?: string; id?: string; accountId?: string; transactionId?: string; project?: string } }) => {
    if (searchParams?.type === 'bank-transaction' && searchParams.accountId && searchParams.transactionId) {
        return <FinAccountTransactionDocument accountId={searchParams.accountId} transactionId={searchParams.transactionId} projectId={searchParams.project} mode="print" />;
    }
    if (searchParams?.type === 'transaction' && searchParams.id) {
        return <TransactionPrintPage id={searchParams.id} />;
    }
    notFound();
};

export default PrintPage;
