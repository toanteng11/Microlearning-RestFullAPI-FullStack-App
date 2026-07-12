const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

if (!rawApiBaseUrl) {
  throw new Error('VITE_API_BASE_URL is required');
}

let apiBaseUrl: string;

try {
  apiBaseUrl = new URL(rawApiBaseUrl).toString().replace(/\/$/, '');
} catch {
  throw new Error('VITE_API_BASE_URL must be a valid absolute URL');
}

export const publicConfig = Object.freeze({ apiBaseUrl });
