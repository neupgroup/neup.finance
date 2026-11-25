export type TransactionType = 'sale' | 'refund' | 'income' | 'purchase' | 'expense' | 'payroll' | 'other';
export type TransactionCategory = string;
export type TransactionStatus = 'paid' | 'partially_paid' | 'unpaid' | 'canceled';
export type TransactionLineCategory = 'sales' | 'receivable' | 'payable' | 'vat_paid' | 'vat_return' | string;
export const TransactionLineCategory = {
  SALES: 'sales',
  RECEIVABLE: 'receivable',
  PAYABLE: 'payable',
  VAT_PAID: 'vat_paid',
  VAT_RETURN: 'vat_return',
} as const;

export type TransactionLine = {
  id?: string;
  transaction_id?: string;
  transactionId?: string;
  line_type_id?: string;
  title?: string;
  line_title?: string;
  description?: string;
  reference_type?: string;
  reference_id?: string;
  currency: string;
  base_amount?: number;
  sort_order?: number;
  metadata?: unknown;
  fin_book?: string;
  fin_account?: string;
  category?: TransactionLineCategory;
  account?: string;
  debit: number;
  credit: number;
};

export type Transaction = {
  id: string;
  title: string;
  description?: string;
  transaction_type: TransactionType | string;
  transaction_type_id?: string;
  final_amount?: number;
  category: TransactionCategory;
  status: TransactionStatus | string;
  currency: string;
  total_amount: number;
  total_paid: number;
  balance_due: number;
  date: string;
  transaction_date?: string;
  recipient?: string;
  partyId?: string;
  party?: Party;
  accountId?: string;
  assetGroupId?: string;
  details?: unknown;
  due_on?: string;
  lines?: TransactionLine[];
};

export type Party = {
  id: string;
  name: string;
  type: string;
};

export type ProjectionType = 'Income' | 'Expense';
export type ProjectionCertainty = 'Fixed' | 'Probable' | 'Possible';
export type ProjectionRecurrence = 'Once' | 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';
export type Projection = {
  id?: string;
  title: string;
  type: ProjectionType;
  certainty: ProjectionCertainty;
  amount: number;
  currency: string;
  date: string;
  userId: string;
  projectId?: string;
  status: 'Active' | 'Canceled';
  recipient?: string;
  isRecurring: boolean;
  recurrence: ProjectionRecurrence;
  endsOn?: string;
};

export const currencyOptions = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'NPR', label: 'NPR - Nepalese Rupee' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
];

export const transactionTypeOptions = [
  { value: 'sale', label: 'Sale' },
  { value: 'income', label: 'Income' },
  { value: 'purchase', label: 'Purchase' },
  { value: 'expense', label: 'Expense' },
  { value: 'payroll', label: 'Payroll' },
  { value: 'refund', label: 'Refund' },
];

export const transactionCategoryOptions = [
  { value: 'sales', label: 'Sales' },
  { value: 'receivable', label: 'Receivable' },
  { value: 'payable', label: 'Payable' },
  { value: 'vat_paid', label: 'VAT Paid' },
  { value: 'vat_return', label: 'VAT Return' },
  { value: 'general', label: 'General' },
];
export const transactionLineCategoryOptions = transactionCategoryOptions;

export const transactionStatusOptions = [
  { value: 'paid', label: 'Paid' },
  { value: 'partially_paid', label: 'Partially Paid' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'canceled', label: 'Canceled' },
];

export const projectionTypeOptions = [
  { value: 'Income', label: 'Income' },
  { value: 'Expense', label: 'Expense' },
];
export const projectionCertaintyOptions = ['Fixed', 'Probable', 'Possible'].map((value) => ({ value, label: value }));
export const projectionRecurrenceOptions = ['Once', 'Daily', 'Weekly', 'Monthly', 'Yearly'].map((value) => ({ value, label: value }));

export function isCreditTransactionType(transactionType: string) {
  return ['sale', 'refund', 'income'].includes(transactionType);
}
