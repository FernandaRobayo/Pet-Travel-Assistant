import {describe,it,expect} from 'vitest';
import {calcularProgreso,calcularSeguimiento,estadoGeneral,evaluarVigencia,validarVinculo,type DocumentoDominio,type TareaDominio} from './seguimiento';

const salida='2027-02-01';
const doc=(vigencia:DocumentoDominio['vigencia']='fecha',fechaVencimiento:string|null='2027-02-01'):DocumentoDominio=>({id:'d1',identificacion:'Certificado',vigencia,fechaVencimiento});
const tarea=(estado:TareaDominio['estado']='pendiente'):TareaDominio=>({id:'t1',estado});

describe('Reglas del MVP (8 pruebas)',()=>{
 it('U01 SWR-SEG-002: vacío sin porcentaje y entero redondeado',()=>{
  // Arrange
  const tasks=[tarea('completa'),{id:'t2',estado:'pendiente' as const},{id:'t3',estado:'requiere_revision' as const}];
  // Act
  const result=calcularProgreso(tasks);
  // Assert
  expect(result).toBe(33);expect(calcularProgreso([])).toBeNull();expect(calcularProgreso([tarea('completa')])).toBe(100);
 });
 it('U02 SWR-SEG-005: antes advierte, después no; fecha inválida se rechaza',()=>{
  const before=doc('fecha','2027-01-31'),after=doc('fecha','2027-02-02');
  const warning=evaluarVigencia(before,salida);
  expect(warning.advertencia).toContain('antes');expect(evaluarVigencia(after,salida).advertencia).toBeNull();
  expect(()=>evaluarVigencia(doc('fecha','2027-02-30'),salida)).toThrow(RangeError);
  expect(()=>evaluarVigencia(doc('fecha',null),salida)).toThrow(RangeError);
 });
 it('U03 SWR-SEG-005/SYS-03: igualdad es revisión sin advertencia de fecha',()=>{
  const document=doc();const result=evaluarVigencia(document,salida);
  expect(result.advertencia).toBeNull();expect(result.revision).toContain('coincide');
 });
 it('U04 SWR-DOC-002/SWR-SEG-005: desconocida y sin vencimiento son distintos',()=>{
  const unknown=evaluarVigencia(doc('desconocida',null),salida);
  const unlimited=evaluarVigencia(doc('sin_vencimiento',null),salida);
  expect(unknown.advertencia).toContain('desconocida');expect(unlimited).toEqual({advertencia:null,revision:null});
 });
 it('U05 SWR-DOC-005/SWR-SEG-005: solo se evalúan vínculos del viaje y no se duplica advertencia',()=>{
  const input={fechaSalida:salida,tareas:[tarea()],documentos:[doc('fecha','2027-01-31')],vinculos:[] as {documentoId:string;tareaId:string}[]};
  expect(calcularSeguimiento(input).advertencias).toHaveLength(0);
  expect(calcularSeguimiento({...input,vinculos:[{documentoId:'d1',tareaId:'ajena'}]}).advertencias).toHaveLength(0);
  const result=calcularSeguimiento({...input,vinculos:[{documentoId:'d1',tareaId:'t1'},{documentoId:'d1',tareaId:'t1'}]});
  expect(result.advertencias).toHaveLength(1);expect(result.advertencias[0].motivo).toBeTruthy();
 });
 it('U06 SWR-SEG-013/SYS-03: respeta todas las prioridades de estado general',()=>{
  const aviso={documentoId:'d1',identificacion:'Certificado',motivo:'Revisar'};
  expect(estadoGeneral([],[],[])).toBe('Sin elementos');
  expect(estadoGeneral([tarea(),{id:'t2',estado:'requiere_revision'}],[],[])).toBe('Requiere revisión');
  expect(estadoGeneral([tarea('completa')],[aviso],[])).toBe('Requiere revisión');
  expect(estadoGeneral([tarea('completa')],[],[aviso])).toBe('Requiere revisión');
  expect(estadoGeneral([tarea()],[],[])).toBe('Con pendientes');
  expect(estadoGeneral([tarea('completa')],[],[])).toBe('Checklist completo');
 });
 it('U07 SWR-DOC-005/ACC-003: valida cuenta y mascota del vínculo',()=>{
  const base={usuarioDocumentoId:'u1',usuarioViajeId:'u1',mascotaDocumentoId:'p1',mascotaViajeId:'p1'};
  expect(validarVinculo(base)).toBe('valido');
  expect(validarVinculo({...base,usuarioDocumentoId:'u2'})).toBe('otra_cuenta');
  expect(validarVinculo({...base,mascotaDocumentoId:'p2'})).toBe('otra_mascota');
 });
 it('U08 SWR-SEG-002/013: redondear a 100 no convierte pendientes en completo; igualdad exige revisión',()=>{
  const tasks:Array<TareaDominio>=Array.from({length:200},(_,i)=>({id:String(i),estado:i===199?'pendiente':'completa'}));
  const result=calcularSeguimiento({fechaSalida:salida,tareas:tasks,documentos:[],vinculos:[]});
  expect(result.progreso).toBe(100);expect(result.estadoGeneral).toBe('Con pendientes');
  const equal=calcularSeguimiento({fechaSalida:salida,tareas:[tarea('completa')],documentos:[doc()],vinculos:[{documentoId:'d1',tareaId:'t1'}]});
  expect(equal.estadoGeneral).toBe('Requiere revisión');expect(equal.advertencias).toHaveLength(0);expect(equal.revisiones).toHaveLength(1);
 });
});
