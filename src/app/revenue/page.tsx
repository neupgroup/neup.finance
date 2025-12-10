import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function RevenuePage() {
  return (
    <AppShell>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
            <CardDescription>Track and manage your income.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Revenue content goes here.</p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
