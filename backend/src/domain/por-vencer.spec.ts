import {describe,it,expect} from 'vitest';
import {DIAS_ANTICIPACION_POR_VENCER,calcularSeguimiento,diasEntre,fechaHoy,porVencer} from './seguimiento';

// Incremento extra (SWR-SEG-015 / SEG-016): señal «por vencer». No cuenta entre las 8 unitarias del MVP.
describe('Incremento extra: señal «por vencer»',()=>{
 const hoy='2027-01-10';
 it('X01: marca dentro del período y en sus límites (hoy y último día)',()=>{
  expect(porVencer('2027-01-10',hoy)).toBe(true);
  expect(porVencer('2027-02-09',hoy)).toBe(true);
  expect(diasEntre(hoy,'2027-02-09')).toBe(DIAS_ANTICIPACION_POR_VENCER);
 });
 it('X02: no marca fuera del período, vencido, sin fecha o fecha inválida se rechaza',()=>{
  expect(porVencer('2027-02-10',hoy)).toBe(false);
  expect(porVencer('2027-01-09',hoy)).toBe(false);
  expect(porVencer(null,hoy)).toBe(false);
  expect(()=>porVencer('2027-02-30',hoy)).toThrow(RangeError);
 });
 it('X03: respeta un período distinto y fechaHoy devuelve fecha de calendario',()=>{
  expect(porVencer('2027-01-20',hoy,5)).toBe(false);
  expect(porVencer('2027-01-15',hoy,5)).toBe(true);
  expect(fechaHoy(new Date('2027-01-10T12:00:00Z'))).toBe('2027-01-10');
  expect(fechaHoy(new Date('2027-01-10T03:00:00Z'))).toBe('2027-01-09');
 });
 it('X04 SEG-016: la señal no cambia progreso ni estado general',()=>{
  const entrada={fechaSalida:'2027-01-01',tareas:[{id:'t1',estado:'completa' as const}],
   documentos:[{id:'d1',identificacion:'Certificado',vigencia:'fecha' as const,fechaVencimiento:'2027-01-20'}],
   vinculos:[{documentoId:'d1',tareaId:'t1'}]};
  const resultado=calcularSeguimiento(entrada);
  expect(porVencer('2027-01-20','2027-01-10')).toBe(true);
  expect(resultado.progreso).toBe(100);expect(resultado.estadoGeneral).toBe('Checklist completo');
 });
});
