const DEFAULT_API_URL = 'http://localhost:5000/api/v1';

/**
 * A variable that exists but is blank is the same as not setting it — `??`
 * would happily hand back an empty string and every request would go nowhere.
 * Trailing slashes are stripped so `${API_URL}/jobs` never doubles up.
 */
function resolveApiUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  const url = configured && configured.length > 0 ? configured : DEFAULT_API_URL;
  return url.replace(/\/+$/, '');
}

export const API_URL = resolveApiUrl();

/** True when the URL came from configuration rather than the local fallback. */
export const API_URL_IS_CONFIGURED = Boolean(process.env.NEXT_PUBLIC_API_URL?.trim());

export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== 'false';

/**
 * The public marketing site. Used only to build "view the live page" links out
 * of the panel, so a wrong value costs a broken link, never a failed request.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://capabiliq.com').replace(/\/+$/, '');

/**
 * Cover images are usually absolute URLs from the media endpoint, but a path
 * like /images/... means "a file the public site serves", so it has to be
 * resolved against the site rather than against the panel's own origin —
 * otherwise the preview 404s and the thumbnail comes up blank.
 */
export function mediaUrl(url?: string, key?: string): string | undefined {
  if (key?.startsWith('public/')) return new URL(`/media/${key.split('/').map(encodeURIComponent).join('/')}`, API_URL).toString();
  if (!url) return undefined;
  if (url.startsWith('/media/public/')) return new URL(url, API_URL).toString();
  return url.startsWith('/') ? `${SITE_URL}${url}` : url;
}
