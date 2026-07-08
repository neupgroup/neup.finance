

export const TransactionStatus = {
    UNPAID: 'unpaid',
    PARTIALLY_PAID: 'partially_paid',
    PAID: 'paid',
    CANCELED: 'canceled'
} as const;
export type TransactionStatus = typeof TransactionStatus[keyof typeof TransactionStatus];

export const TransactionType = {
    SALE: 'sale',
    PURCHASE: 'purchase',
    REFUND: 'refund',
    EXPENSE: 'expense',
    PAYROLL: 'payroll',
    INCOME: 'income',
    OTHER: 'other'
} as const;
export type TransactionType = typeof TransactionType[keyof typeof TransactionType];

export const TransactionCategory = {
    SALES: 'Sales',
    PURCHASES: 'Purchases',
    DISCOUNTS: 'Discounts',
    PAYROLL: 'Payroll',
    UTILITIES: 'Utilities',
    VENDOR_PAYMENTS: 'Vendor payments',
    EMIS: 'EMIs',
    BANK_CHARGES: 'Bank charges',
    VAT_TAX: 'VAT / Tax',
    TRANSFERS: 'Transfers',
    REFUNDS: 'Refunds',
    INCOME: 'Income',
    OTHER: 'Other'
} as const;
export type TransactionCategory = typeof TransactionCategory[keyof typeof TransactionCategory];

export type Transaction = {
  id?: string;
  title: string;
  description?: string;
  accountId: string;
  partyId?: string;
  category: TransactionCategory;
  transaction_type: TransactionType;
  total_amount: number;
  total_paid: number;
  balance_due: number;
  status: TransactionStatus;
  date: string;
  currency: string;
  recipient?: string;
  due_on?: string;
  reference_document?: string | File;
  created_at: string;
  userId: string;
  party?: {
    id: string;
    name: string;
    type: string;
  } | null;
};

export type TransactionLineCategory = 'vat_paid' | 'vat_return' | 'sales' | 'referral_paid' | 'payable' | 'receivable';

export type TransactionLine = {
    id?: string;
    transaction_id: string;
    line_title: string;
    description?: string;
    attachment?: string | File;
    category: TransactionLineCategory;
    account: string;
    debit: number;
    credit: number;
    currency: string;
}

export type ProjectionType = 'Income' | 'Expense';
export type ProjectionCertainty = 'Fixed' | 'Probable' | 'Possible';
export type ProjectionStatus = 'Active' | 'Canceled';
export type ProjectionRecurrence = 'Once' | 'Daily' | 'Weekly' | 'Monthly' | 'Yearly' | 'Custom';


export type Projection = {
    id?: string;
    title: string;
    type: ProjectionType;
    certainty: ProjectionCertainty;
    amount: number;
    currency: string;
    date: string; // Start date
    userId: string;
    status: ProjectionStatus;
    recipient?: string;
    isRecurring: boolean;
    recurrence: ProjectionRecurrence;
    endsOn?: string; // Optional end date
};

export type RecipientType = 'person' | 'organization';
export type RecipientTaxType = 'pan' | 'vat' | 'none';

export type Recipient = {
    id: string;
    name: string;
    type: RecipientType;
    tax_type?: RecipientTaxType;
    tax_number?: string;
    contact_info?: {
        email?: string;
        phone?: string;
        website?: string;
    };
    bank_information?: string;
    created_on: string;
    modified_on?: string;
};

export type PartyContactType = 'email' | 'address' | 'phone';

export type Party = {
    id: string;
    account_id: string;
    name: string;
    type: string;
    taxinfo?: unknown;
    contacts?: Array<{
        id: string;
        party_id: string;
        type: PartyContactType;
        value: string;
        added_on: string;
        details?: unknown;
    }>;
    paymentMethods?: Array<{
        id: string;
        party_id: string;
        type: string;
        value: string;
        added_on: string;
        details?: unknown;
    }>;
};


export const transactions: Transaction[] = [];

export const transactionLines: TransactionLine[] = [];

export const projections: Projection[] = [];

export const recipients: Recipient[] = [];

export const currencies = [
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'JPY', label: 'JPY - Japanese Yen' },
    { value: 'INR', label: 'INR - Indian Rupee' },
    { value: 'NPR', label: 'NPR - Nepali Rupee' },
];

export const transactionTypes: {value: TransactionType, label: TransactionType}[] = [
    {value: 'sale', label: 'sale'}, 
    {value: 'purchase', label: 'purchase'}, 
    {value: 'refund', label: 'refund'}, 
    {value: 'expense', label: 'expense'}, 
    {value: 'payroll', label: 'payroll'}, 
    {value: 'income', label: 'income'},
    {value: 'other', label: 'other'}
];
