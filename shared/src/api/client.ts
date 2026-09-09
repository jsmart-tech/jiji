// Minimal isomorphic fetch wrapper. Each consuming app (web today, mobile
// later) calls `configureApi` once at startup with its own base URL; when no
// base URL is set, `apiFetch` fails fast so callers can fall back to mock
// data without ever attempting a network request.

export interface ApiConfig {
  baseUrl: string;
}

let config: ApiConfig = { baseUrl: '' };

export function configureApi(next: Partial<ApiConfig>): void {
  config = { ...config, ...next };
}

export class ApiUnavailableError extends Error {
  constructor(message = 'API base URL not configured') {
    super(message);
    this.name = 'ApiUnavailableError';
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!config.baseUrl) throw new ApiUnavailableError();

  const res = await fetch(`${config.baseUrl}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });

  if (!res.ok) {
    throw new Error(`Request to ${path} failed with status ${res.status}`);
  }
  return (await res.json()) as T;
}
