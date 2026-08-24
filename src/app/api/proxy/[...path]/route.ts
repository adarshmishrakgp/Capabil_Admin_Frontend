import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { TOKEN_COOKIE } from '@/lib/session';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';

/**
 * Client components call /api/proxy/<api-path>; this attaches the access token
 * from the httpOnly cookie and forwards to the admin API. Keeping the token on
 * the server means no admin credential is ever exposed to the browser.
 */
async function forward(request: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const token = (await cookies()).get(TOKEN_COOKIE)?.value;
  const url = `${API}/${path.join('/')}${new URL(request.url).search}`;

  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  const init: RequestInit = { method: request.method, headers, cache: 'no-store' };

  if (!['GET', 'HEAD'].includes(request.method)) {
    const contentType = request.headers.get('content-type') ?? '';
    if (contentType.includes('multipart/form-data')) {
      init.body = await request.formData(); // browser sets the boundary
    } else {
      init.body = await request.text();
      headers['Content-Type'] = 'application/json';
    }
  }

  try {
    const res = await fetch(url, init);
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { 'Content-Type': res.headers.get('content-type') ?? 'application/json' },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'API_UNREACHABLE', message: `Cannot reach the API at ${API}` } },
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
