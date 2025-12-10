
export type TransactionStatus = 'unpaid' | 'partially_paid' | 'paid' | 'canceled';
export type TransactionType = 'sale' | 'purchase' | 'refund' | 'expense' | 'payroll' | 'income' | 'other';
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

export const integrations = [
    { name: 'Your Bank', icon: 'Landmark', description: 'Sync transactions securely.' },
    { name: 'Stripe', icon: 'CreditCard', description: 'eCommerce revenue.' },
    { name: 'PayPal', icon: 'Wallet', description: 'Online payments.' },
    { name: 'QuickBooks', icon: 'Book', description: 'Accounting data.' },
    { name: 'Salesforce', icon: 'Cloud', description: 'CRM and sales data.' },
    { name: 'Gusto', icon: 'Users', description: 'Payroll information.' },
];
