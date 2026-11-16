import {describe,it,expect} from 'vitest';
import {LIMITE_ARCHIVO,TIPOS_DOCUMENTO,TIPOS_REGLAS,detectarTipo,nombreSeguro,validarArchivo} from './archivos';
import {generarPdf} from './pdf';

// Incremento 2 (SWR-DOC-008, SWR-REG-002, SWR-MAS-007, SWR-CHK-015).
const pdf=Buffer.from('%PDF-1.4\ncontenido');
const png=Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a,0,0]);
const jpg=Buffer.from([0xff,0xd8,0xff,0xe0,0,0]);
const exe=Buffer.from('MZ\x90\x00 programa');
const subido=(buffer:Buffer,originalname='archivo.pdf')=>({originalname,mimetype:'application/pdf',size:buffer.length,buffer});

describe('Incremento 2: archivos y PDF',()=>{
 it('N07 DOC-008: el formato se detecta por los bytes, no por la extensión',()=>{
  expect(detectarTipo(pdf)).toBe('pdf');expect(detectarTipo(png)).toBe('png');expect(detectarTipo(jpg)).toBe('jpg');expect(detectarTipo(exe)).toBeNull();
  expect(()=>validarArchivo(subido(exe,'certificado.pdf'),TIPOS_DOCUMENTO,LIMITE_ARCHIVO,'Solo PDF, JPG o PNG.')).toThrow('Solo PDF, JPG o PNG.');
 });
 it('N08 REG-002: las reglas aceptan solo PDF',()=>{
  expect(validarArchivo(subido(pdf),TIPOS_REGLAS,LIMITE_ARCHIVO,'x').tipo).toBe('application/pdf');
  expect(()=>validarArchivo(subido(png,'reglas.png'),TIPOS_REGLAS,LIMITE_ARCHIVO,'Solo PDF.')).toThrow('Solo PDF.');
  expect(()=>validarArchivo(undefined,TIPOS_REGLAS,LIMITE_ARCHIVO,'x')).toThrow('Selecciona un archivo.');
 });
 it('N09 DOC-008: rechaza archivos que superan el límite',()=>{
  const grande={...subido(pdf),size:LIMITE_ARCHIVO+1};
  expect(()=>validarArchivo(grande,TIPOS_DOCUMENTO,LIMITE_ARCHIVO,'x')).toThrow('máximo de 5 MB');
 });
 it('N10 DOC-010: el nombre del archivo se limpia y conserva acentos',()=>{
  expect(nombreSeguro(Buffer.from('Certificación.pdf','utf8').toString('latin1'))).toBe('Certificación.pdf');
  expect(nombreSeguro('../../etc/pass"wd')).not.toMatch(/[\\/"]/);expect(nombreSeguro('')).toBe('archivo');
 });
 it('N11 CHK-015: genera un PDF válido con varias páginas y acentos',()=>{
  const lineas=Array.from({length:120},(_,i)=>({texto:`Tarea ${i+1}: Revisión (vacuna) \\ canción`}));
  const salida=generarPdf([{texto:'Checklist del viaje',tam:18,negrita:true},...lineas]).toString('latin1');
  expect(salida.startsWith('%PDF-1.4')).toBe(true);expect(salida.trimEnd().endsWith('%%EOF')).toBe(true);
  const paginas=Number(/\/Count (\d+)/.exec(salida)?.[1]);expect(paginas).toBeGreaterThan(1);
  expect(salida).toContain('Revisi\xf3n \\(vacuna\\)');
  const xref=Number(/startxref\n(\d+)/.exec(salida)?.[1]);expect(salida.slice(xref,xref+4)).toBe('xref');
 });
});
