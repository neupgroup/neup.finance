import { Users } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle } from '@neup/components/ui/card';

// Present the project teams area.
export default function ProjectTeamsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
        <p className="text-sm text-muted-foreground">Organize the people who work in your project.</p>
      </div>
      <Card>
        <CardHeader>
          <Users className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Project teams</CardTitle>
          <CardDescription>Team management will be available here.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
