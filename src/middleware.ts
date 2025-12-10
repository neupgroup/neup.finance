import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const activeAccountCookie = request.cookies.get('active_account');
  const { pathname } = request.nextUrl;

  // Allow requests to /auth and /onboarding pages without the cookie
  if (pathname.startsWith('/auth') || pathname.startsWith('/onboarding')) {
    return NextResponse.next();
  }

  // Redirect to /auth if the cookie is not set and the user is trying to access other pages
  if (!activeAccountCookie) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Matcher to apply middleware to all paths except for Next.js internal paths and static files
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
