/**
 * Thin REST client for the Node API. Every list endpoint returns the same
 * envelope: { success, data, meta }. When NEXT_PUBLIC_USE_MOCK is 'true' the
 * pages read from lib/data.ts instead and this module is never called.
 */

import { API_URL as BASE, USE_MOCK } from './config';

export { USE_MOCK };

export type ListMeta = { page: number; limit: number; total: number };
export type Envelope<T> = { success: boolean; data: T; meta?: ListMeta };

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<Envelope<T>> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: 'include', // refresh token cookie
    headers: {
      ...(init.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, body?.error?.code ?? 'UNKNOWN', body?.error?.message ?? res.statusText);
  }
  return body as Envelope<T>;
}

type Query = Record<string, string | number | undefined>;

const qs = (params: Query = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v !== undefined && v !== '' && search.set(k, String(v)));
  const s = search.toString();
  return s ? `?${s}` : '';
};

export const api = {
  get: <T>(path: string, params?: Query) => request<T>(`${path}${qs(params)}`),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body ?? {}) }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body ?? {}) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

/* Convenience wrappers used by the pages once mock mode is switched off. */
export const endpoints = {
  dashboard: () => api.get('/admin/dashboard/stats'),
  jobs: (p?: Query) => api.get('/admin/jobs', p),
  applications: (p?: Query) => api.get('/admin/applications', p),
  candidates: (p?: Query) => api.get('/admin/candidates', p),
  posts: (p?: Query) => api.get('/admin/posts', p),
  subscribers: (p?: Query) => api.get('/admin/subscribers', p),
};
