import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import logica from '@neup/logica';

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Infrastructure and bridge requests bypass authentication.
  if (pathname.startsWith('/bridge/') || pathname.startsWith('/_next/')) {
    return NextResponse.next();
  }

  const authToken = request.cookies.get('auth_account')?.value?.trim();
  const account = authToken
    ? await logica.account.self.ensureRecord(authToken)
    : null;

  // User is not authenticated.
  if (!account) {
    const authUrl = new URL(
      '/account/auth/start',
      request.url,
    );

    authUrl.searchParams.set(
      'redirectsTo',
      request.nextUrl.href,
    );

    return NextResponse.redirect(authUrl);
  }

  // Switch pages are accessible without a project.
  if (pathname === '/switch' || pathname === '/switch/new') {
    return NextResponse.next();
  }

  // Every other page requires a project.
  const project = searchParams.get('project')?.trim();

  if (!project) {
    const switchUrl = new URL('/switch', request.url);

    switchUrl.searchParams.set(
      'redirectsTo',
      request.nextUrl.href,
    );

    return NextResponse.redirect(switchUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!bridge/|_next/).*)'],
};