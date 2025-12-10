
export type TransactionStatus = 'unpaid' | 'partially_paid' | 'paid' | 'canceled';
export type TransactionType = 'sale' | 'purchase' | 'refund' | 'expense' | 'payroll' | 'other';
export type TransactionCategory =
    | 'Sales'
    | 'Purchases'
    | 'Discounts'
    | 'Payroll'
    | 'Utilities'
    | 'Vendor payments'
    | 'EMIs'
    | 'Bank charges'
    | 'VAT / Tax'
    | 'Transfers'
    | 'Refunds'
    | 'Income'
    | 'Other';

export type Transaction = {
  id: string;
  description: string;
  accountId: string;
  category: TransactionCategory;
  transaction_type: TransactionType;
  total_amount: number;
  total_paid: number;
  balance_due: number;
  status: TransactionStatus;
  date: string;
  reference_document?: string;
  created_at: string;
};

export const transactions: Transaction[] = [
  { id: '1', description: 'Salary', accountId: 'Checking Account', category: 'Payroll', transaction_type: 'sale', total_amount: 5000, total_paid: 5000, balance_due: 0, status: 'paid', date: '2024-07-01', created_at: '2024-07-01T10:00:00Z' },
  { id: '2', description: 'Freelance Project', accountId: 'Checking Account', category: 'Sales', transaction_type: 'sale', total_amount: 1200, total_paid: 1200, balance_due: 0, status: 'paid', date: '2024-07-05', created_at: '2024-07-05T11:00:00Z' },
  { id: '3', description: 'Grocery Store', accountId: 'Checking Account', category: 'Purchases', transaction_type: 'purchase', total_amount: 150, total_paid: 150, balance_due: 0, status: 'paid', date: '2024-07-02', created_at: '2024-07-02T15:30:00Z' },
  { id: '4', description: 'Electricity Bill', accountId: 'Checking Account', category: 'Utilities', transaction_type: 'expense', total_amount: 75, total_paid: 75, balance_due: 0, status: 'paid', date: '2024-07-03', created_at: '2024-07-03T09:00:00Z' },
  { id: '5', description: 'Netflix', accountId: 'Checking Account', category: 'Purchases', transaction_type: 'expense', total_amount: 15.99, total_paid: 15.99, balance_due: 0, status: 'paid', date: '2024-07-05', created_at: '2024-07-05T18:00:00Z' },
  { id: '6', description: 'Movie Tickets', accountId: 'Wallet', category: 'Purchases', transaction_type: 'purchase', total_amount: 30, total_paid: 30, balance_due: 0, status: 'paid', date: '2024-07-08', created_at: '2024-07-08T20:00:00Z' },
  { id: '7', description: 'Figma Subscription', accountId: 'Checking Account', category: 'Vendor payments', transaction_type: 'expense', total_amount: 25, total_paid: 25, balance_due: 0, status: 'paid', date: '2024-07-10', created_at: '2024-07-10T14:00:00Z' },
  { id: '8', description: 'Grocery Run', accountId: 'Wallet', category: 'Purchases', transaction_type: 'purchase', total_amount: 80, total_paid: 80, balance_due: 0, status: 'paid', date: '2024-07-12', created_at: '2024-07-12T13:00:00Z' },
  { id: '9', description: 'Gas Bill', accountId: 'Checking Account', category: 'Utilities', transaction_type: 'expense', total_amount: 50, total_paid: 50, balance_due: 0, status: 'paid', date: '2024-07-15', created_at: '2024-07-15T08:00:00Z' },
  { id: '10', description: 'Concert', accountId: 'Checking Account', category: 'Purchases', transaction_type: 'purchase', total_amount: 120, total_paid: 120, balance_due: 0, status: 'paid', date: '2024-07-18', created_at: '2024-07-18T19:00:00Z' },
  { id: '11', description: 'Stock Dividend', accountId: 'Savings Account', category: 'Income', transaction_type: 'sale', total_amount: 250, total_paid: 250, balance_due: 0, status: 'paid', date: '2024-07-20', created_at: '2024-07-20T12:00:00Z' },
  { id: '12', description: 'Weekend Trip', accountId: 'Checking Account', category: 'Purchases', transaction_type: 'purchase', total_amount: 450, total_paid: 450, balance_due: 0, status: 'paid', date: '2024-07-22', created_at: '2024-07-22T11:00:00Z' },
  { id: '13', description: 'Spotify', accountId: 'Wallet', category: 'Purchases', transaction_type: 'expense', total_amount: 10.99, total_paid: 10.99, balance_due: 0, status: 'paid', date: '2024-07-25', created_at: '2024-07-25T17:00:00Z' },
  { id: '14', description: 'Client Refund', accountId: 'Checking Account', category: 'Refunds', transaction_type: 'refund', total_amount: 150, total_paid: 150, balance_due: 0, status: 'paid', date: '2024-07-28', created_at: '2024-07-28T16:00:00Z' },
];

export const integrations = [
    { name: 'Your Bank', icon: 'Landmark', description: 'Sync transactions securely.' },
    { name: 'Stripe', icon: 'CreditCard', description: 'eCommerce revenue.' },
    { name: 'PayPal', icon: 'Wallet', description: 'Online payments.' },
    { name: 'QuickBooks', icon: 'Book', description: 'Accounting data.' },
    { name: 'Salesforce', icon: 'Cloud', description: 'CRM and sales data.' },
    { name: 'Gusto', icon: 'Users', description: 'Payroll information.' },
];
