import { type Transaction, type TransactionLine, type TransactionType } from '@/core/lib/mock-data';

/*
::neup.documentation::invoice-service
::function getInvoiceLineAmount(transactionType, line)

Returns the amount a transaction line should display on an invoice.

::param external transactionType
::datatype TransactionType

The transaction type that determines whether credit or debit is the invoice amount.

::param external line
::datatype TransactionLine

The line item being displayed on the invoice.

::returns
::datatype number

The positive invoice-facing line amount.

::end
*/
export function getInvoiceLineAmount(transactionType: TransactionType, line: TransactionLine) {
  return isCreditTransaction(transactionType) ? line.credit : line.debit;
}

/*
::neup.documentation::credit-transaction-check
::function isCreditTransaction(transactionType)

Checks whether a transaction type should be treated as incoming value.

::param external transactionType
::datatype TransactionType

The transaction type to classify.

::returns
::datatype boolean

Returns true when the transaction type is sale, refund, or income.

::end
*/
export function isCreditTransaction(transactionType: TransactionType) {
  return ['sale', 'refund', 'income'].includes(transactionType);
}

/*
::neup.documentation::invoice-recipient-name
::function getInvoiceRecipientName(transaction)

Returns the best available recipient name for an invoice.

::param external transaction
::datatype Transaction

The source transaction used to generate the invoice.

::returns
::datatype string

The party name, recipient text, or a fallback label.

::end
*/
export function getInvoiceRecipientName(transaction: Transaction) {
  return transaction.party?.name || transaction.recipient || 'N/A';
}

/*
::neup.documentation::invoice-subtotal
::function getInvoiceSubtotal(transaction, lines)

Calculates the subtotal displayed before tax on the invoice.

::param external transaction
::datatype Transaction

The transaction that owns the invoice.

::param external lines
::datatype TransactionLine[] | null | undefined

The optional invoice line items.

::returns
::datatype number

The line total when lines exist, otherwise the transaction total amount.

::end
*/
export function getInvoiceSubtotal(transaction: Transaction, lines?: TransactionLine[] | null) {
  if (!lines || lines.length === 0) {
    return transaction.total_amount;
  }

  return lines.reduce((total, line) => total + getInvoiceLineAmount(transaction.transaction_type, line), 0);
}

/*
::neup.documentation::invoice-tax-amount
::function getInvoiceTaxAmount(transaction, subtotal)

Calculates the tax difference between the transaction total and subtotal.

::param external transaction
::datatype Transaction

The transaction containing the final total.

::param external subtotal
::datatype number

The invoice subtotal before tax.

::returns
::datatype number

The tax amount when the final total is greater than the subtotal.

::end
*/
export function getInvoiceTaxAmount(transaction: Transaction, subtotal: number) {
  return Math.max(transaction.total_amount - subtotal, 0);
}

/*
::neup.documentation::invoice-currency-format
::function formatInvoiceCurrency(amount, currency)

Formats invoice money values using the transaction currency.

::param external amount
::datatype number

The amount to format.

::param external currency
::datatype string

The ISO currency code used by Intl.NumberFormat.

::returns
::datatype string

The localized currency string.

::end
*/
export function formatInvoiceCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

/*
::neup.documentation::invoice-date-format
::function formatInvoiceDate(date)

Formats invoice dates for display.

::param external date
::datatype string | undefined

The optional date string to format.

::returns
::datatype string

The formatted date or N/A when no date exists.

::end
*/
export function formatInvoiceDate(date?: string) {
  if (!date) {
    return 'N/A';
  }

  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
