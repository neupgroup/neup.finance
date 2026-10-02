import { cn } from '@neup/core/utils';

export function stackedCardClassName(index: number, total: number, base = '') {
  const isFirst = index === 0;
  const isLast = index === total - 1;

  return cn(
    base,
    'border-b border-border bg-card transition-colors hover:bg-muted/50',
    isFirst && 'rounded-t-lg',
    isLast && 'rounded-b-lg border-b-0'
  );
}
