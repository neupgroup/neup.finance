import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import logica from '@neup/logica';
import { ensureAccountRecord } from '@/server/account';
import { withAppBasePath } from '@/core/helpers/app-path';

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Infrastructure and bridge requests bypass authentication.
  if (pathname.startsWith('/bridge/') || pathname.startsWith('/_next/')) {
    return NextResponse.next();
  }

  const authToken = request.cookies.get('auth')?.value?.trim();
  const account = authToken
    ? await ensureAccountRecord(authToken)
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
    const switchUrl = new URL(withAppBasePath('/switch'), request.url);
    const destination = request.nextUrl.clone();
    destination.searchParams.delete('redirectsTo');

    // Keep embedding context on /switch itself so its shell stays embedded.
    for (const key of ['embedded', 'app']) {
      const value = searchParams.get(key);
      if (value) switchUrl.searchParams.set(key, value);
      destination.searchParams.delete(key);
    }

    switchUrl.searchParams.set(
      'redirectsTo',
      `${destination.pathname}${destination.search}`,
    );

    return NextResponse.redirect(switchUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!bridge/|_next/).*)'],
};
