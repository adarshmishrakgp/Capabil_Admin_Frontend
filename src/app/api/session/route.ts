import { NextResponse } from 'next/server';
import { API_URL, USE_MOCK } from '@/lib/config';
import { REFRESH_COOKIE, TOKEN_COOKIE, USER_COOKIE } from '@/lib/session';


const DEMO = { email: 'admin@capabiliq.com', password: 'Admin@12345' };

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 8, // one working day
};

/** Pull the API's refreshToken out of its Set-Cookie header. */
function readRefreshToken(setCookie: string | null): string | null {
  if (!setCookie) return null;
  const match = /refreshToken=([^;]+)/.exec(setCookie);
  return match ? match[1] : null;
}

/** Sign in: exchange credentials at the API, then store the session server-side. */
export async function POST(request: Request) {
  const { email, password } = (await request.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    return NextResponse.json({ error: 'Enter your email and password' }, { status: 400 });
  }

  let token: string | null = null;
  let refresh: string | null = null;
  let user: { name: string; email: string; role: string } | null = null;

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
    });
    const body = await res.json().catch(() => ({}));

    if (res.ok) {
      token = body.data.accessToken;
      refresh = readRefreshToken(res.headers.get('set-cookie'));
      user = { name: body.data.user.name, email: body.data.user.email, role: body.data.user.role };
    } else if (!USE_MOCK) {
      return NextResponse.json(
        { error: body?.error?.message ?? 'Invalid email or password' },
        { status: res.status },
      );
    }
  } catch {
    // API unreachable — handled by the demo fallback below.
    if (!USE_MOCK) {
      return NextResponse.json({ error: 'Cannot reach the API. Is it running?' }, { status: 502 });
    }
  }

  // Demo mode only: lets the panel be explored on mock data with no API running.
  if (!token && USE_MOCK) {
    if (email.toLowerCase() !== DEMO.email || password !== DEMO.password) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }
    token = 'demo-session';
    user = { name: 'Admin User', email: DEMO.email, role: 'super_admin' };
  }

  const response = NextResponse.json({ user });
  response.cookies.set(TOKEN_COOKIE, token!, cookieOptions);
  response.cookies.set(USER_COOKIE, JSON.stringify(user), { ...cookieOptions, httpOnly: false });
  if (refresh) response.cookies.set(REFRESH_COOKIE, refresh, cookieOptions);
  return response;
}

/** Sign out: revoke the refresh token at the API, then clear the cookies. */
export async function DELETE(request: Request) {
  const refresh = request.headers.get('cookie')?.match(/cq_refresh=([^;]+)/)?.[1];

  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: refresh ? { Cookie: `refreshToken=${refresh}` } : {},
      cache: 'no-store',
    });
  } catch {
    // Clearing our own cookies matters more than the API round-trip succeeding.
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.delete(TOKEN_COOKIE);
  response.cookies.delete(USER_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);
  return response;
}
