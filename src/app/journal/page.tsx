import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function JournalPage() {
  return (
    <AppShell>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Journal</CardTitle>
            <CardDescription>Your personal financial journal.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Journal entries will go here.</p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
