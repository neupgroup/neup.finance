import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { integrations } from '@/lib/mock-data';
import * as Lucide from 'lucide-react';

export function Integrations() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Universal Plug System</CardTitle>
        <CardDescription>Connect your financial ecosystem.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {integrations.map((item) => {
            const Icon = Lucide[item.icon as keyof typeof Lucide] || Lucide.Zap;
            return (
              <div key={item.name} className="flex flex-col items-center justify-center gap-2 rounded-lg border bg-card p-4 text-center shadow-sm hover:shadow-accent/20 transition-shadow">
                <Icon className="h-8 w-8 text-accent" />
                <p className="font-semibold text-sm">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
                <Button variant="outline" size="sm" className="mt-2">
                  Connect
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
