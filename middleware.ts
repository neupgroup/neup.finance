
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow requests for static files, API routes, and images to pass through
  if (pathname.startsWith('/bridge/api.v1') || pathname.startsWith('/bridge/webhook.v1') || pathname.startsWith('/_next/static') || pathname.startsWith('/_next/image') || pathname.endsWith('favicon.ico')) {
    return NextResponse.next();
  }

  if (pathname === '/switch' || pathname === '/switch/new') {
    return NextResponse.next();
  }

  if (!request.nextUrl.searchParams.get('project')?.trim()) {
    const switchUrl = new URL('/switch', request.url);
    switchUrl.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(switchUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!bridge/api.v1|bridge/webhook.v1|_next/static|_next/image|favicon.ico).*)'],
};
