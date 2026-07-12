import { publicConfig } from '../config/public-config';

interface ApiEnvelope<T> {
  success: true;
  data: T;
}

export interface HealthData {
  status: 'UP';
  service: string;
  timestamp: string;
}

export interface VersionData {
  appName: string;
  version: string;
  environment: string;
  commitSha: string;
  buildTime: string;
}

async function getJson<T>(path: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(`${publicConfig.apiBaseUrl}${path}`, {
    headers: { Accept: 'application/json' },
    signal,
  });

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as ApiEnvelope<T>;
  return payload.data;
}

export async function getSystemStatus(signal: AbortSignal) {
  const [health, version] = await Promise.all([
    getJson<HealthData>('/health', signal),
    getJson<VersionData>('/api/v1/system/version', signal),
  ]);

  return { health, version };
}
