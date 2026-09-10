import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { API_URL } from '@/lib/config';
import { TOKEN_COOKIE } from '@/lib/session';


/**
 * Client components call /api/proxy/<api-path>; this attaches the access token
 * from the httpOnly cookie and forwards to the admin API. Keeping the token on
 * the server means no admin credential is ever exposed to the browser.
 */
async function forward(request: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const token = (await cookies()).get(TOKEN_COOKIE)?.value;
  const url = `${API_URL}/${path.join('/')}${new URL(request.url).search}`;

  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  const init: RequestInit = { method: request.method, headers, cache: 'no-store' };

  if (!['GET', 'HEAD'].includes(request.method)) {
    const contentType = request.headers.get('content-type') ?? '';
    if (contentType.includes('multipart/form-data')) {
      init.body = await request.formData(); // browser sets the boundary
    } else {
      const body = await request.text();
      // A DELETE usually has none. Forwarding an empty string still declares a
      // JSON body, which the API then has to parse out of nothing.
      if (body) {
        init.body = body;
        headers['Content-Type'] = 'application/json';
      }
    }
  }

  try {
    const res = await fetch(url, init);
    const text = await res.text();

    // 204/205/304 must not carry a body — constructing a Response with one
    // throws, which would surface as API_UNREACHABLE for a request that in fact
    // succeeded. Every successful DELETE in the panel comes back this way.
    const bodiless = res.status === 204 || res.status === 205 || res.status === 304;

    return new NextResponse(bodiless ? null : text, {
      status: res.status,
      headers: bodiless ? undefined : { 'Content-Type': res.headers.get('content-type') ?? 'application/json' },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'API_UNREACHABLE', message: `Cannot reach the API at ${API_URL}` } },
      { status: 502 },
    );
  }
}

export {
  forward as GET,
  forward as POST,
  forward as PATCH,
  forward as PUT,
  forward as DELETE,
};
