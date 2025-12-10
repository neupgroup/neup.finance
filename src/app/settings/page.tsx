import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>Manage your account and application settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Settings content will go here.</p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
