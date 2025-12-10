

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
  id: string;
  title: string;
  description?: string; // Optional
  accountId: string;
  category: TransactionCategory;
  transaction_type: TransactionType;
  total_amount: number;
  total_paid: number;
  balance_due: number;
  status: TransactionStatus;
  date: string;
  currency: string;
  recipient?: string; // Optional
  due_on?: string; // Optional
  reference_document?: string | File; // Optional
  created_at: string;
};

export type TransactionLineCategory = 'vat_paid' | 'vat_return' | 'sales' | 'referral_paid' | 'payable' | 'receivable';

export type TransactionLine = {
    id: string;
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

export type Projection = {
    id: string;
    title: string;
    type: ProjectionType;
    certainty: ProjectionCertainty;
    amount: number;
    currency: string;
    date: string;
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


export const transactions: Transaction[] = [
  { id: '1', title: 'Salary', accountId: 'Checking Account', category: 'Payroll', transaction_type: 'income', total_amount: 5000, total_paid: 5000, balance_due: 0, status: 'paid', date: '2024-07-01', currency: 'USD', created_at: '2024-07-01T10:00:00Z', recipient: 'Company Inc.' },
  { id: '2', title: 'Freelance Project', accountId: 'Checking Account', category: 'Sales', transaction_type: 'sale', total_amount: 1200, total_paid: 1200, balance_due: 0, status: 'paid', date: '2024-07-05', currency: 'USD', created_at: '2024-07-05T11:00:00Z', recipient: 'Client A' },
  { id: '3', title: 'Grocery Store', description: 'Weekly groceries', accountId: 'Checking Account', category: 'Purchases', transaction_type: 'purchase', total_amount: 150, total_paid: 150, balance_due: 0, status: 'paid', date: '2024-07-02', currency: 'USD', created_at: '2024-07-02T15:30:00Z', recipient: 'SuperMart' },
  { id: '4', title: 'Electricity Bill', accountId: 'Checking Account', category: 'Utilities', transaction_type: 'expense', total_amount: 75, total_paid: 75, balance_due: 0, status: 'paid', date: '2024-07-03', currency: 'USD', created_at: '2024-07-03T09:00:00Z', recipient: 'City Power' },
  { id: '5', title: 'Netflix', accountId: 'Checking Account', category: 'Purchases', transaction_type: 'expense', total_amount: 15.99, total_paid: 15.99, balance_due: 0, status: 'paid', date: '2024-07-05', currency: 'USD', created_at: '2024-07-05T18:00:00Z', recipient: 'Netflix' },
  { id: '6', title: 'Movie Tickets', accountId: 'Wallet', category: 'Purchases', transaction_type: 'purchase', total_amount: 30, total_paid: 30, balance_due: 0, status: 'paid', date: '2024-07-08', currency: 'EUR', created_at: '2024-07-08T20:00:00Z', recipient: 'Cineplex' },
  { id: '7', title: 'Figma Subscription', accountId: 'Checking Account', category: 'Vendor payments', transaction_type: 'expense', total_amount: 25, total_paid: 0, balance_due: 25, status: 'unpaid', date: '2024-07-10', due_on: '2024-07-25', currency: 'USD', created_at: '2024-07-10T14:00:00Z', recipient: 'Figma' },
  { id: '8', title: 'Grocery Run', accountId: 'Wallet', category: 'Purchases', transaction_type: 'purchase', total_amount: 80, total_paid: 80, balance_due: 0, status: 'paid', date: '2024-07-12', currency: 'EUR', created_at: '2024-07-12T13:00:00Z', recipient: 'Local Market' },
  { id: '9', title: 'Gas Bill', accountId: 'Checking Account', category: 'Utilities', transaction_type: 'expense', total_amount: 50, total_paid: 20, balance_due: 30, status: 'partially_paid', date: '2024-07-15', due_on: '2024-08-01', currency: 'USD', created_at: '2024-07-15T08:00:00Z', recipient: 'Gas Co.' },
  { id: '10', title: 'Concert', accountId: 'Checking Account', category: 'Purchases', transaction_type: 'purchase', total_amount: 120, total_paid: 120, balance_due: 0, status: 'paid', date: '2024-07-18', currency: 'USD', created_at: '2024-07-18T19:00:00Z', recipient: 'TicketMaster' },
  { id: '11', title: 'Stock Dividend', accountId: 'Savings Account', category: 'Income', transaction_type: 'income', total_amount: 250, total_paid: 250, balance_due: 0, status: 'paid', date: '2024-07-20', currency: 'USD', created_at: '2024-07-20T12:00:00Z', recipient: 'Vanguard' },
  { id: '12', title: 'Weekend Trip', accountId: 'Checking Account', category: 'Purchases', transaction_type: 'purchase', total_amount: 450, total_paid: 450, balance_due: 0, status: 'paid', date: '2024-07-22', currency: 'USD', created_at: '2024-07-22T11:00:00Z', recipient: 'Airbnb' },
  { id: '13', title: 'Spotify', accountId: 'Wallet', category: 'Purchases', transaction_type: 'expense', total_amount: 10.99, total_paid: 10.99, balance_due: 0, status: 'paid', date: '2024-07-25', currency: 'EUR', created_at: '2024-07-25T17:00:00Z', recipient: 'Spotify' },
  { id: '14', title: 'Client Refund', accountId: 'Checking Account', category: 'Refunds', transaction_type: 'refund', total_amount: 150, total_paid: 150, balance_due: 0, status: 'paid', date: '2024-07-28', currency: 'USD', created_at: '2024-07-28T16:00:00Z', recipient: 'Client B' },
];

export const transactionLines: TransactionLine[] = [
    { id: 'line1', transaction_id: '2', line_title: 'Web Development Services', category: 'sales', account: 'Checking Account', debit: 0, credit: 1000, currency: 'USD' },
    { id: 'line2', transaction_id: '2', line_title: 'VAT (20%)', category: 'vat_paid', account: 'Checking Account', debit: 0, credit: 200, currency: 'USD' },
    { id: 'line3', transaction_id: '9', line_title: 'Partial Payment', category: 'payable', account: 'Checking Account', debit: 20, credit: 0, currency: 'USD' },
];

export const projections: Projection[] = [
    { id: '1', title: 'Yearly Bonus', type: 'Income', certainty: 'Probable', amount: 5000, currency: 'USD', date: '2024-12-15' },
    { id: '2', title: 'Car Insurance Renewal', type: 'Expense', certainty: 'Fixed', amount: 800, currency: 'USD', date: '2025-01-20' },
    { id: '3', title: 'Freelance Project (Client X)', type: 'Income', certainty: 'Possible', amount: 2000, currency: 'USD', date: '2024-11-30' },
    { id: '4', title: 'Vacation to Hawaii', type: 'Expense', certainty: 'Possible', amount: 3000, currency: 'USD', date: '2025-03-10' },
];

export const recipients: Recipient[] = [
    { id: '1', name: 'Company Inc.', type: 'organization', tax_type: 'vat', tax_number: 'VAT123456789', contact_info: { email: 'contact@companyinc.com', website: 'companyinc.com' }, created_on: '2024-01-15T09:00:00Z' },
    { id: '2', name: 'Client A', type: 'person', contact_info: { email: 'clienta@example.com' }, created_on: '2024-02-20T10:00:00Z' },
    { id: '3', name: 'SuperMart', type: 'organization', created_on: '2024-03-10T11:00:00Z' },
    { id: '4', name: 'City Power', type: 'organization', contact_info: { email: 'billing@citypower.com' }, created_on: '2024-04-05T12:00:00Z' },
    { id: '5', name: 'Netflix', type: 'organization', contact_info: { email: 'info@netflix.com', website: 'netflix.com' }, created_on: '2024-05-01T13:00:00Z' },
    { id: '6', name: 'Cineplex', type: 'organization', contact_info: { email: 'guestservices@cineplex.com' }, created_on: '2024-05-15T14:00:00Z' },
    { id: '7', name: 'Figma', type: 'organization', tax_type: 'vat', tax_number: 'VAT987654321', contact_info: { email: 'support@figma.com', website: 'figma.com' }, created_on: '2024-06-01T15:00:00Z' },
    { id: '8', name: 'Local Market', type: 'organization', created_on: '2024-06-20T16:00:00Z' },
    { id: '9', name: 'Gas Co.', type: 'organization', contact_info: { email: 'support@gasco.com' }, created_on: '2024-07-01T17:00:00Z' },
    { id: '10', name: 'TicketMaster', type: 'organization', contact_info: { email: 'help@ticketmaster.com' }, created_on: '2024-07-10T18:00:00Z' },
    { id: '11', name: 'Vanguard', type: 'organization', created_on: '2024-07-15T19:00:00Z' },
    { id: '12', name: 'Airbnb', type: 'organization', contact_info: { email: 'support@airbnb.com', website: 'airbnb.com' }, created_on: '2024-07-20T20:00:00Z' },
    { id: '13', name: 'Spotify', type: 'organization', contact_info: { email: 'office@spotify.com', website: 'spotify.com' }, created_on: '2024-07-25T21:00:00Z' },
    { id: '14', name: 'Client B', type: 'person', contact_info: { email: 'clientb@example.com' }, created_on: '2024-07-30T22:00:00Z' },
];

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
