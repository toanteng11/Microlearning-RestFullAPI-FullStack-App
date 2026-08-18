const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() ?? '';

function normalizeApiBaseUrl(value: string): string {
  if (!value) return '';

  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('unsupported protocol');
    if (url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
      throw new Error('not an origin');
    }
    return url.origin;
  } catch {
    throw new Error('VITE_API_BASE_URL must be an empty value or a valid absolute origin');
  }
}

const apiBaseUrl = normalizeApiBaseUrl(rawApiBaseUrl);

export const publicConfig = Object.freeze({ apiBaseUrl });
