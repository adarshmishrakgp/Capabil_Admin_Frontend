import { cookies } from 'next/headers';

/**
 * The panel keeps its session in httpOnly cookies set by /api/session, so the
 * access token is never readable from client JavaScript. Middleware gates every
 * route on the presence of TOKEN_COOKIE; server components read USER_COOKIE to
 * render who is signed in.
 */
export const TOKEN_COOKIE = 'cq_token';
export const USER_COOKIE = 'cq_user';
/** The API's rotating refresh token, kept server-side so the 15-minute access
 *  token can be renewed without asking anyone to sign in again. */
export const REFRESH_COOKIE = 'cq_refresh';

export type SessionUser = {
  name: string;
  email: string;
  role: string;
};

export const ROLE_LABEL: Record<string, string> = {
  super_admin: 'Super Admin',
  content_editor: 'Content Editor',
  recruiter: 'Recruiter',
  viewer: 'Viewer',
};

/** Current user, or null when the cookie is missing or unreadable. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const raw = (await cookies()).get(USER_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SessionUser;
    return parsed?.email ? parsed : null;
  } catch {
    return null;
  }
}

/** Access token for server-side calls to the API on behalf of the signed-in user. */
export async function getAccessToken(): Promise<string | null> {
  return (await cookies()).get(TOKEN_COOKIE)?.value ?? null;
}
