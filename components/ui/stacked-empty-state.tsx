import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

type StackedEmptyStateRowProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
};

export function StackedEmptyStateRow({ icon: Icon, title, description, className }: StackedEmptyStateRowProps) {
  return (
    <div className={cn('flex items-center justify-between p-4', className)}>
      <div className="flex items-center gap-4">
        <div className="rounded-full bg-muted p-2">
          <Icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        </div>
        <div className="space-y-1 text-left">
          <p className="font-semibold text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}
