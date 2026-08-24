import { cookies } from 'next/headers';
import { API_URL } from './config';
import { TOKEN_COOKIE } from './session';


export type ApiOk<T> = { ok: true; data: T; meta?: { page: number; limit: number; total: number } };
export type ApiFail = { ok: false; error: string };
export type ApiResult<T> = ApiOk<T> | ApiFail;

/**
 * Server-side call to the admin API, authenticated with the session cookie.
 * Never throws — pages render an error state instead of a crash screen.
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<ApiResult<T>> {
  const token = (await cookies()).get(TOKEN_COOKIE)?.value;

  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers ?? {}),
      },
      cache: 'no-store',
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (res.status === 401) return { ok: false, error: 'Your session has expired — sign in again.' };
      return { ok: false, error: body?.error?.message ?? `Request failed (${res.status})` };
    }
    return { ok: true, data: body.data as T, meta: body.meta };
  } catch {
    return { ok: false, error: `Cannot reach the API at ${API_URL}. Start it with "npm run dev" in admin-api.` };
  }
}
