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
