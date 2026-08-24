import { NextResponse, type NextRequest } from 'next/server';
import { REFRESH_COOKIE, TOKEN_COOKIE, USER_COOKIE } from '@/lib/session';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 8,
};

/** Seconds until this JWT expires. Reads the payload without verifying — the
 *  API is still the only thing that trusts the signature. */
function secondsUntilExpiry(token: string): number | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return typeof json.exp === 'number' ? json.exp - Math.floor(Date.now() / 1000) : null;
  } catch {
    return null;
  }
}

/**
 * Nothing in the panel renders without a session. Unauthenticated requests are
 * sent to /login with the path they wanted, so they land there after signing in.
 *
 * The API's access token lives 15 minutes; this renews it in the background
 * (once per request, so two refreshes never race) and writes the rotated pair
 * back onto the response.
 */
export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  const signedIn = Boolean(token);

  if (pathname === '/login') {
    if (signedIn) return NextResponse.redirect(new URL('/', request.url));
    return NextResponse.next();
  }

  if (!signedIn) {
    const url = new URL('/login', request.url);
    if (pathname !== '/') url.searchParams.set('next', `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  const remaining = secondsUntilExpiry(token!);
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;

  // Renew a couple of minutes before expiry so in-flight requests never 401.
  if (refresh && remaining !== null && remaining < 120) {
    try {
      const res = await fetch(`${API}/auth/refresh`, {
        method: 'POST',
        headers: { Cookie: `refreshToken=${refresh}` },
        cache: 'no-store',
      });

      if (res.ok) {
        const body = await res.json();
        const rotated = /refreshToken=([^;]+)/.exec(res.headers.get('set-cookie') ?? '')?.[1];

        const response = NextResponse.next();
        response.cookies.set(TOKEN_COOKIE, body.data.accessToken, cookieOptions);
        if (rotated) response.cookies.set(REFRESH_COOKIE, rotated, cookieOptions);
        return response;
      }

      // Refresh rejected — the session is genuinely over.
      const url = new URL('/login', request.url);
      url.searchParams.set('next', `${pathname}${search}`);
      const response = NextResponse.redirect(url);
      response.cookies.delete(TOKEN_COOKIE);
      response.cookies.delete(USER_COOKIE);
      response.cookies.delete(REFRESH_COOKIE);
      return response;
    } catch {
      // API unreachable: let the page render its own error state.
    }
  }

  return NextResponse.next();
}

export const config = {
  // Everything except the session endpoint, Next internals, and static assets in
  // public/ — the login page needs its logo before anyone is signed in.
  matcher: [
    '/((?!api/session|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|avif|woff2?)$).*)',
  ],
};
