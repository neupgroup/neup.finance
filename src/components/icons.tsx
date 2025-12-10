import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <title>NeupLedger Diary Logo</title>
      <path d="M4 2v20h16V2H4z" fill="hsl(var(--primary))" stroke="none" />
      <path d="M4 2v20" stroke="hsl(var(--primary-foreground))" strokeOpacity="0.5" />
      <path d="M9 2v20" stroke="hsl(var(--primary-foreground))" strokeOpacity="0.2" />
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" fill="none" stroke="hsl(var(--border))" />
      <line x1="12" y1="6" x2="18" y2="6" stroke="hsl(var(--primary-foreground))" strokeOpacity="0.5" />
      <line x1="12" y1="10" x2="18" y2="10" stroke="hsl(var(--primary-foreground))" strokeOpacity="0.5" />
      <line x1="12" y1="14" x2="18" y2="14" stroke="hsl(var(--primary-foreground))" strokeOpacity="0.5" />
      <line x1="12" y1="18" x2="18" y2="18" stroke="hsl(var(--primary-foreground))" strokeOpacity="0.5" />
    </svg>
  );
}
