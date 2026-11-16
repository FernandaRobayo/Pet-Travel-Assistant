import {describe,it,expect} from 'vitest';
import {calcularSeguimiento,semaforo,type DocumentoDominio,type TareaDominio} from './seguimiento';
import {PLANTILLAS,buscarPlantilla} from './plantillas';

// Incremento 2 (SWR-SEG-001, 017..021, SWR-CHK-006). No cuentan entre las 8 pruebas unitarias del MVP evaluado.
const salida='2027-02-01',hoy='2027-01-20';
const tarea=(id:string,estado:TareaDominio['estado'],descripcion=id):TareaDominio=>({id,estado,descripcion});
const doc=(id:string,fecha:string):DocumentoDominio=>({id,identificacion:`Doc ${id}`,vigencia:'fecha',fechaVencimiento:fecha});
const base={fechaSalida:salida,hoy,tareas:[tarea('t1','completa'),tarea('t2','pendiente','Comprar guacal'),tarea('t3','requiere_revision','Confirmar vuelo')],documentos:[] as DocumentoDominio[],vinculos:[] as {documentoId:string;tareaId:string}[]};

describe('Incremento 2: seguimiento ampliado',()=>{
 it('N01 SEG-019: el semáforo sigue al estado general',()=>{
  expect(semaforo('Requiere revisión')).toBe('rojo');expect(semaforo('Con pendientes')).toBe('amarillo');
  expect(semaforo('Checklist completo')).toBe('verde');expect(semaforo('Sin elementos')).toBe('gris');
  expect(calcularSeguimiento({...base,tareas:[]}).semaforo).toBe('gris');expect(calcularSeguimiento(base).semaforo).toBe('rojo');
 });
 it('N02 SEG-018: días restantes hasta la salida; negativo si ya pasó',()=>{
  expect(calcularSeguimiento(base).diasRestantes).toBe(12);
  expect(calcularSeguimiento({...base,hoy:salida}).diasRestantes).toBe(0);
  expect(calcularSeguimiento({...base,hoy:'2027-02-03'}).diasRestantes).toBe(-2);
  expect(calcularSeguimiento({...base,hoy:undefined}).diasRestantes).toBeNull();
 });
 it('N03 SEG-001/021: lista única con pendientes, en revisión y avisos',()=>{
  const result=calcularSeguimiento({...base,documentos:[doc('d1','2027-01-31')],vinculos:[{documentoId:'d1',tareaId:'t1'}]});
  expect(result.pendientes).toEqual([{id:'t2',descripcion:'Comprar guacal'}]);expect(result.enRevision).toEqual([{id:'t3',descripcion:'Confirmar vuelo'}]);
  expect(result.lista.map(item=>item.tipo)).toEqual(['pendiente','revision','advertencia']);
  expect(result.lista[2].texto).toContain('Doc d1');expect(result.lista[2].texto).toContain('antes de la fecha de salida');
 });
 it('N04 SEG-020: el resumen reúne progreso, avisos, por vencer y días; por vencer no cambia el estado (SEG-016)',()=>{
  const sinDoc=calcularSeguimiento({...base,tareas:[tarea('t1','completa')]});
  const conDoc=calcularSeguimiento({...base,tareas:[tarea('t1','completa')],documentos:[doc('d1','2027-02-10')],vinculos:[{documentoId:'d1',tareaId:'t1'}]});
  expect(conDoc.resumen).toEqual({progreso:100,advertencias:0,porVencer:1,diasRestantes:12});
  expect(conDoc.porVencer[0]).toMatchObject({documentoId:'d1',diasParaVencer:21});
  expect(conDoc.estadoGeneral).toBe(sinDoc.estadoGeneral);expect(conDoc.progreso).toBe(sinDoc.progreso);
 });
 it('N05 SEG-017: el progreso solo depende de las tareas principales',()=>{
  const conExtras={...base,tareas:[{...tarea('t1','completa'),subtareas:[{completa:false},{completa:false}]} as TareaDominio,tarea('t2','pendiente')]};
  expect(calcularSeguimiento(conExtras).progreso).toBe(50);expect(calcularSeguimiento(conExtras).totalTareas).toBe(2);
 });
 it('N06 CHK-006/CON-003: las plantillas son genéricas y todas se encuentran por id',()=>{
  expect(PLANTILLAS.length).toBeGreaterThanOrEqual(3);
  for(const p of PLANTILLAS){expect(buscarPlantilla(p.id)).toBe(p);expect(p.tareas.length).toBeGreaterThan(0);expect(new Set(p.tareas).size).toBe(p.tareas.length);}
  expect(buscarPlantilla('no-existe')).toBeUndefined();
  expect(JSON.stringify(PLANTILLAS)).not.toMatch(/Colombia|Estados Unidos|Avianca|LATAM|Unión Europea/i);
 });
});
