import React from 'react';
import {beforeEach,describe,it,expect,vi} from 'vitest';
import {render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskList from '@/components/checklist/task-list';
import DocumentoForm from '@/components/documentos/documento-form';
import type {Tarea} from '@/lib/types';

const mocks=vi.hoisted(()=>({api:vi.fn()}));
vi.mock('@/components/auth/auth-provider',()=>({useAuth:()=>({token:'token-de-prueba'})}));
vi.mock('@/lib/api',()=>({api:mocks.api}));

// Incremento extra (SWR-CHK-003, SWR-DOC-004, SWR-DOC-007, SWR-SEG-015). No cuentan entre las 12 pruebas RTL del MVP.
const tarea=(porVencer:boolean):Tarea=>({id:'t1',descripcion:'Vacuna',estado:'pendiente',viajeId:'v1',
  documentos:[{id:'d1',identificacion:'Certificado',vigencia:'fecha',fechaVencimiento:'2027-01-20',porVencer}]});

beforeEach(()=>{vi.clearAllMocks();mocks.api.mockResolvedValue({});});
describe('Incremento extra (6 pruebas)',()=>{
 it('X05 SEG-015: muestra «Por vencer» junto al documento vinculado',()=>{
  render(<TaskList tareas={[tarea(true)]} onChange={vi.fn()}/>);
  expect(screen.getByRole('list',{name:'Documentos vinculados a Vacuna'})).toBeInTheDocument();
  expect(screen.getByText('Por vencer')).toBeInTheDocument();expect(screen.getByText('Vence: 2027-01-20')).toBeInTheDocument();
 });
 it('X06 SEG-015: no muestra la señal fuera del período',()=>{
  render(<TaskList tareas={[tarea(false)]} onChange={vi.fn()}/>);
  expect(screen.getByText('Certificado')).toBeInTheDocument();expect(screen.queryByText('Por vencer')).not.toBeInTheDocument();
 });
 it('X07 DOC-007: desvincular llama DELETE y refresca',async()=>{
  const onChange=vi.fn();render(<TaskList tareas={[tarea(false)]} onChange={onChange}/>);
  await userEvent.click(screen.getByRole('button',{name:'Desvincular Certificado de Vacuna'}));
  expect(mocks.api).toHaveBeenCalledWith('/tareas/t1/documentos/d1','token-de-prueba',{method:'DELETE'});
  expect(await screen.findByRole('status')).toHaveTextContent('Documento desvinculado');expect(onChange).toHaveBeenCalled();
 });
 it('X08 CHK-003: editar la descripción envía PATCH',async()=>{
  render(<TaskList tareas={[tarea(false)]} onChange={vi.fn()}/>);
  await userEvent.click(screen.getByRole('button',{name:'Editar tarea Vacuna'}));
  const campo=screen.getByRole('textbox',{name:'Descripción de la tarea Vacuna'});
  await userEvent.clear(campo);await userEvent.type(campo,'Vacuna antirrábica');
  await userEvent.click(screen.getByRole('button',{name:'Guardar cambios'}));
  expect(mocks.api).toHaveBeenCalledWith('/tareas/t1','token-de-prueba',{method:'PATCH',body:JSON.stringify({descripcion:'Vacuna antirrábica'})});
 });
 it('X09 CHK-003: descripción vacía muestra error y no llama la API',async()=>{
  render(<TaskList tareas={[tarea(false)]} onChange={vi.fn()}/>);
  await userEvent.click(screen.getByRole('button',{name:'Editar tarea Vacuna'}));
  await userEvent.clear(screen.getByRole('textbox',{name:'Descripción de la tarea Vacuna'}));
  await userEvent.click(screen.getByRole('button',{name:'Guardar cambios'}));
  expect(await screen.findByRole('alert')).toHaveTextContent('Este campo es obligatorio.');expect(mocks.api).not.toHaveBeenCalled();
 });
 it('X10 DOC-004: editar un documento envía PATCH y confirma',async()=>{
  const onSuccess=vi.fn();
  render(<DocumentoForm mascotaId="p1" onSuccess={onSuccess} onCancel={vi.fn()} documento={{id:'d1',identificacion:'Certificado',vigencia:'sin_vencimiento',fechaVencimiento:null,mascotaId:'p1'}}/>);
  await userEvent.click(screen.getByRole('button',{name:'Guardar cambios'}));
  expect(mocks.api).toHaveBeenCalledWith('/documentos/d1','token-de-prueba',expect.objectContaining({method:'PATCH'}));
  expect(await screen.findByRole('status')).toHaveTextContent('Documento actualizado.');expect(onSuccess).toHaveBeenCalled();
 });
});
