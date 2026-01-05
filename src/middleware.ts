import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware is no longer strictly necessary with Firebase Auth handling sessions,
// but can be adapted for server-side session checks if needed.
// For now, we'll simplify it to just run.

export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
