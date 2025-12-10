export type Transaction = {
  id: string;
  name: string;
  accountId: string;
  category: 'Income' | 'Groceries' | 'Utilities' | 'Entertainment' | 'Subscriptions' | 'Software' | 'Travel' | 'Other';
  amount: number;
  date: string;
  type: 'debit' | 'credit';
};

export const transactions: Transaction[] = [
  { id: '1', name: 'Salary', accountId: 'Checking Account', category: 'Income', amount: 5000, date: '2024-07-01', type: 'credit' },
  { id: '2', name: 'Freelance Project', accountId: 'Checking Account', category: 'Income', amount: 1200, date: '2024-07-05', type: 'credit' },
  { id: '3', name: 'Grocery Store', accountId: 'Checking Account', category: 'Groceries', amount: -150, date: '2024-07-02', type: 'debit' },
  { id: '4', name: 'Electricity Bill', accountId: 'Checking Account', category: 'Utilities', amount: -75, date: '2024-07-03', type: 'debit' },
  { id: '5', name: 'Netflix', accountId: 'Checking Account', category: 'Subscriptions', amount: -15.99, date: '2024-07-05', type: 'debit' },
  { id: '6', name: 'Movie Tickets', accountId: 'Wallet', category: 'Entertainment', amount: -30, date: '2024-07-08', type: 'debit' },
  { id: '7', name: 'Figma Subscription', accountId: 'Checking Account', category: 'Software', amount: -25, date: '2024-07-10', type: 'debit' },
  { id: '8', name: 'Grocery Run', accountId: 'Wallet', category: 'Groceries', amount: -80, date: '2024-07-12', type: 'debit' },
  { id: '9', name: 'Gas Bill', accountId: 'Checking Account', category: 'Utilities', amount: -50, date: '2024-07-15', type: 'debit' },
  { id: '10', name: 'Concert', accountId: 'Checking Account', category: 'Entertainment', amount: -120, date: '2024-07-18', type: 'debit' },
  { id: '11', name: 'Stock Dividend', accountId: 'Savings Account', category: 'Income', amount: 250, date: '2024-07-20', type: 'credit' },
  { id: '12', name: 'Weekend Trip', accountId: 'Checking Account', category: 'Travel', amount: -450, date: '2024-07-22', type: 'debit' },
  { id: '13', name: 'Spotify', accountId: 'Wallet', category: 'Subscriptions', amount: -10.99, date: '2024-07-25', type: 'debit' },
  { id: '14', name: 'Farmers Market', accountId: 'Wallet', category: 'Groceries', amount: -65, date: '2024-07-28', type: 'debit' },
];

export const integrations = [
    { name: 'Your Bank', icon: 'Landmark', description: 'Sync transactions securely.' },
    { name: 'Stripe', icon: 'CreditCard', description: 'eCommerce revenue.' },
    { name: 'PayPal', icon: 'Wallet', description: 'Online payments.' },
    { name: 'QuickBooks', icon: 'Book', description: 'Accounting data.' },
    { name: 'Salesforce', icon: 'Cloud', description: 'CRM and sales data.' },
    { name: 'Gusto', icon: 'Users', description: 'Payroll information.' },
];
