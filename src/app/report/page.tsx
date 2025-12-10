import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function ReportPage() {
  return (
    <AppShell>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Reports</CardTitle>
            <CardDescription>Generate and view financial reports.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Report content goes here.</p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
