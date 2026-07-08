
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const connectionId = request.cookies.get('connection_id') ?? request.cookies.get('accountId');
  const { pathname } = request.nextUrl;

  // Allow requests for static files, API routes, and images to pass through
  if (pathname.startsWith('/api') || pathname.startsWith('/_next/static') || pathname.startsWith('/_next/image') || pathname.endsWith('favicon.ico')) {
    return NextResponse.next();
  }

  // If user is on the onboarding or auth page, let them proceed.
  if (pathname === '/onboarding' || pathname === '/auth') {
    // If they are already set up, redirect them to the home page.
    if (connectionId) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // If there's no connection_id cookie and they're not on an auth page, redirect to onboarding.
  if (!connectionId) {
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
