import {BadRequestException, PayloadTooLargeException} from '@nestjs/common';

export interface ArchivoSubido {originalname: string; mimetype: string; size: number; buffer: Buffer}

// Supuestos (DP-14 y DP-15 siguen abiertos en el SRS): formatos PDF/JPG/PNG para documentos,
// PDF para reglas, JPG/PNG para fotos; máximo 5 MB (documentos y reglas) y 2 MB (fotos).
// El contenido se guarda en la base PostgreSQL; el software nunca lo interpreta (SWR-CON-001).
export const LIMITE_ARCHIVO = 5 * 1024 * 1024;
export const LIMITE_FOTO = 2 * 1024 * 1024;

export type TipoArchivo = 'pdf' | 'jpg' | 'png';
const MIME: Record<TipoArchivo, string> = {pdf: 'application/pdf', jpg: 'image/jpeg', png: 'image/png'};
export const TIPOS_DOCUMENTO: readonly TipoArchivo[] = ['pdf', 'jpg', 'png'];
export const TIPOS_FOTO: readonly TipoArchivo[] = ['jpg', 'png'];
export const TIPOS_REGLAS: readonly TipoArchivo[] = ['pdf'];

// Se detecta por los primeros bytes, no por la extensión ni por el tipo que declara el cliente.
export function detectarTipo(bytes: Uint8Array): TipoArchivo | null {
  const b = Buffer.from(bytes.subarray(0, 8));
  if (b.length >= 5 && b.subarray(0, 5).toString('latin1') === '%PDF-') return 'pdf';
  if (b.length >= 8 && b.equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg';
  return null;
}

export function nombreSeguro(original: string | undefined): string {
  // multer entrega el nombre como latin1; se recupera el UTF-8 original.
  const utf8 = Buffer.from(original ?? '', 'latin1').toString('utf8');
  const limpio = utf8.replace(/[\\/]/g, '_').replace(/[\u0000-\u001f"]/g, '').trim().slice(0, 120);
  return limpio || 'archivo';
}

export function validarArchivo(file: ArchivoSubido | undefined, permitidos: readonly TipoArchivo[], limite: number, mensajeTipo: string) {
  if (!file || !file.buffer?.length) throw new BadRequestException('Selecciona un archivo.');
  if (file.size > limite) throw new PayloadTooLargeException(`El archivo supera el máximo de ${limite / 1048576} MB.`);
  const tipo = detectarTipo(file.buffer);
  if (!tipo || !permitidos.includes(tipo)) throw new BadRequestException(mensajeTipo);
  return {tipo: MIME[tipo], nombre: nombreSeguro(file.originalname), tamano: file.size, datos: new Uint8Array(file.buffer)};
}

// Cabecera Content-Disposition con nombre UTF-8 seguro.
export function disposicion(nombre: string, adjunto: boolean): string {
  return `${adjunto ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(nombre)}`;
}
