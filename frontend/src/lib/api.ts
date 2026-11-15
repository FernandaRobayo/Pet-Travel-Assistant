export class ApiError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';

export async function api<T>(path: string, token: string | null, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...options, credentials: 'omit', cache: 'no-store',
      headers: {'Content-Type': 'application/json', ...(token ? {Authorization: `Bearer ${token}`} : {}), ...options.headers}
    });
  } catch { throw new ApiError('No se pudo conectar con la API. Intenta de nuevo.', 0); }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && token && typeof window !== 'undefined') window.dispatchEvent(new Event('pta:session-expired'));
    const message = typeof body.message === 'string' ? body.message : Array.isArray(body.message) ? body.message.join(' ') : 'No se pudo completar la operación.';
    throw new ApiError(message, response.status);
  }
  return body as T;
}
