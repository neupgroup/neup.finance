import { ArrowDownToLine, ArrowUpFromLine, ChartNoAxesCombined, CircleDollarSign, Landmark, Scale, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@neup/components/ui/card';

const chartGroups = [
  {
    name: 'Assets',
    description: 'What the business owns or is owed.',
    icon: Wallet,
    accounts: ['Cash Account', 'Bank Account', 'Accounts Receivable', 'Inventory Account', 'Equipment Account'],
  },
  {
    name: 'Liabilities',
    description: 'What the business owes.',
    icon: Landmark,
    accounts: ['Accounts Payable', 'Salary Payable', 'Tax Payable', 'Loan Payable'],
  },
  {
    name: 'Equity',
    description: 'The owners’ interest in the business.',
    icon: Scale,
    accounts: ['Share Capital', 'Retained Earnings'],
  },
  {
    name: 'Income',
    description: 'Revenue earned by the business.',
    icon: ArrowUpFromLine,
    accounts: ['Sales Revenue', 'Service Revenue'],
  },
  {
    name: 'Expenses',
    description: 'Costs incurred to operate the business.',
    icon: ArrowDownToLine,
    accounts: ['Salary Expense', 'Rent Expense', 'Marketing Expense'],
  },
] as const;

// Show the default chart of accounts grouped by account class.
export default function ChartOfAccountsPage() {
  const totalAccounts = chartGroups.reduce((total, group) => total + group.accounts.length, 0);

  return (
    <main className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-primary/10 p-2 text-primary"><ChartNoAxesCombined className="h-5 w-5" /></span>
          <div>
            <p className="text-sm font-medium text-primary">Accounting</p>
            <h1 className="text-3xl font-bold tracking-tight">Chart of Accounts</h1>
          </div>
        </div>
        <p className="text-muted-foreground">The default accounts are grouped by their role in your financial statements.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-2" aria-label={`${totalAccounts} default accounts in five groups`}>
        {chartGroups.map((group) => {
          const GroupIcon = group.icon;
          return (
            <Card key={group.name}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="rounded-lg bg-muted p-2 text-muted-foreground"><GroupIcon className="h-5 w-5" /></span>
                    <div>
                      <CardTitle>{group.name}</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">{group.description}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">{group.accounts.length}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="divide-y rounded-md border">
                  {group.accounts.map((account) => (
                    <li key={account} className="flex items-center gap-3 px-3 py-2.5 text-sm">
                      <CircleDollarSign className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span>{account}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </section>
      <p className="text-sm text-muted-foreground">{totalAccounts} default accounts across {chartGroups.length} account groups.</p>
    </main>
  );
}
