import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      {...props}
    >
      <defs>
        <radialGradient id="logo-gradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsl(var(--accent))" />
          <stop offset="100%" stopColor="hsl(var(--primary))" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="45" fill="none" stroke="url(#logo-gradient)" strokeWidth="5" />
      <circle cx="50" cy="50" r="25" fill="url(#logo-gradient)" />
      <path d="M50 5 L50 95 M5 50 L95 50" stroke="hsl(var(--foreground))" strokeWidth="1" strokeOpacity="0.2" />
    </svg>
  );
}
