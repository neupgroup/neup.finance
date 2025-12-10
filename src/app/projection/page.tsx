import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function ProjectionPage() {
  return (
    <AppShell>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Projections</CardTitle>
            <CardDescription>Forecast your financial future.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Projection content goes here.</p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
