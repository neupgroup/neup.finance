const configuredBasePath = process.env.NEXT_PUBLIC_APP_BASEPATH ?? '';
const appBasePath = configuredBasePath === '/'
  ? ''
  : configuredBasePath.replace(/\/+$/, '');

// Prefix an application path with the configured Next.js base path once.
export function withAppBasePath(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (!appBasePath || normalizedPath === appBasePath || normalizedPath.startsWith(`${appBasePath}/`)) {
    return normalizedPath;
  }
  return `${appBasePath}${normalizedPath}`;
}

// Remove the configured prefix before passing a route to Next navigation APIs.
export function withoutAppBasePath(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (!appBasePath || (normalizedPath !== appBasePath && !normalizedPath.startsWith(`${appBasePath}/`))) {
    return normalizedPath;
  }
  return normalizedPath.slice(appBasePath.length) || '/';
}

// Build an API request path with the application base path and existing query intact.
export function getApiPath(path: string): string {
  const queryIndex = path.indexOf('?');
  const pathname = queryIndex === -1 ? path : path.slice(0, queryIndex);
  const query = queryIndex === -1 ? '' : path.slice(queryIndex);
  return `${withAppBasePath(pathname)}${query}`;
}

// Add the app base path to a full URL destination without duplicating it.
export function withAppBasePathInUrl(url: URL): URL {
  url.pathname = withAppBasePath(url.pathname);
  return url;
}
