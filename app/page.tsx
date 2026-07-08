import { AppShell } from '@/components/layout/app-shell';
import { Dashboard } from '@/components/dashboard/dashboard';

export default function HomePage() {
  return (
    <AppShell>
      <div className="space-y-6 md:space-y-8">
        <Dashboard />
      </div>
    </AppShell>
  );
}
