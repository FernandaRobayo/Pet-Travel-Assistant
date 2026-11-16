// Subida y apertura de archivos (multipart y binario) con el mismo Bearer del resto de la API.
const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';
export const LIMITE_MB = {documento: 5, foto: 2};

function mensaje(body: unknown): string {
  const raw = (body as {message?: unknown})?.message;
  return typeof raw === 'string' ? raw : Array.isArray(raw) ? raw.join(' ') : 'No se pudo completar la operación.';
}

export async function subirArchivo<T>(path: string, token: string|null, archivo: File, campos: Record<string,string> = {}): Promise<T> {
  const form = new FormData();
  for (const [clave, valor] of Object.entries(campos)) form.append(clave, valor);
  form.append('archivo', archivo);
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {method: 'POST', body: form, credentials: 'omit', cache: 'no-store', headers: token ? {Authorization: `Bearer ${token}`} : {}});
  } catch { throw new Error('No se pudo conectar con la API. Intenta de nuevo.'); }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(response.status === 413 ? 'El archivo supera el tamaño máximo permitido.' : mensaje(body));
  return body as T;
}

export async function obtenerArchivo(path: string, token: string|null): Promise<Blob> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {credentials: 'omit', cache: 'no-store', headers: token ? {Authorization: `Bearer ${token}`} : {}});
  } catch { throw new Error('No se pudo conectar con la API. Intenta de nuevo.'); }
  if (!response.ok) throw new Error(mensaje(await response.json().catch(() => ({}))));
  return response.blob();
}

function enlace(url: string, nombre?: string, nuevaPestana = false) {
  const a = document.createElement('a');
  a.href = url; if (nombre) a.download = nombre; if (nuevaPestana) { a.target = '_blank'; a.rel = 'noopener'; }
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
export async function abrirEnPestana(path: string, token: string|null) { enlace(URL.createObjectURL(await obtenerArchivo(path, token)), undefined, true); }
export async function descargar(path: string, token: string|null, nombre: string) { enlace(URL.createObjectURL(await obtenerArchivo(path, token)), nombre); }

// Validación previa en el cliente; el servidor vuelve a validar por contenido.
export function validarCliente(archivo: File, extensiones: string[], limiteMb: number): string {
  const nombre = archivo.name.toLowerCase();
  if (!extensiones.some(ext => nombre.endsWith(ext))) return `Formato no permitido. Usa ${extensiones.join(', ')}.`;
  if (archivo.size > limiteMb * 1048576) return `El archivo supera el máximo de ${limiteMb} MB.`;
  if (archivo.size === 0) return 'El archivo está vacío.';
  return '';
}
