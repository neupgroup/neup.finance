import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function ExpensePage() {
  return (
    <AppShell>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Expenses</CardTitle>
            <CardDescription>Track and manage your spending.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Expense content goes here.</p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
