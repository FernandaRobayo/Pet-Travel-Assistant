import React from 'react';
import {beforeEach,describe,it,expect,vi} from 'vitest';
import {render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthForm from '@/components/auth/auth-form';
import MascotasScreen from '@/components/mascotas/mascotas-screen';
import RecordForm from '@/components/forms/record-form';
import DocumentoForm from '@/components/documentos/documento-form';
import SeguimientoCard from '@/components/seguimiento/seguimiento-card';

const mocks=vi.hoisted(()=>({login:vi.fn(),replace:vi.fn(),api:vi.fn(),resource:{loading:false,error:'',data:[] as unknown[],reload:vi.fn()}}));
vi.mock('next/navigation',()=>({useRouter:()=>({replace:mocks.replace})}));
vi.mock('@/components/auth/auth-provider',()=>({useAuth:()=>({login:mocks.login,usuario:null,token:null})}));
vi.mock('@/lib/api',()=>({api:mocks.api}));
vi.mock('@/hooks/use-resource',()=>({default:()=>mocks.resource}));

beforeEach(()=>{vi.clearAllMocks();mocks.resource.loading=false;mocks.resource.error='';mocks.resource.data=[];});
describe('Comportamiento visible (12 pruebas)',()=>{
 it('R01 ACC-002: valida login sin llamar la API',async()=>{
  render(<AuthForm/>);await userEvent.click(screen.getByRole('button',{name:'Ingresar'}));
  expect(screen.getByText('Ingresa un correo válido.')).toBeInTheDocument();expect(mocks.login).not.toHaveBeenCalled();
 });
 it('R02 ACC-002: credenciales incorrectas muestran error',async()=>{
  mocks.login.mockRejectedValue(new Error('Correo o contraseña incorrectos.'));
  render(<AuthForm/>);await userEvent.type(screen.getByLabelText('Correo'), 'persona@example.test');
  const password=crypto.randomUUID();await userEvent.type(screen.getByLabelText('Contraseña'),password);
  await userEvent.click(screen.getByRole('button',{name:'Ingresar'}));
  expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos.');
 });
 it('R03 ACC-001: registro exitoso muestra confirmación',async()=>{
  mocks.api.mockResolvedValue({});render(<AuthForm register/>);
  await userEvent.type(screen.getByLabelText('Correo'),'persona@example.test');await userEvent.type(screen.getByLabelText('Contraseña'),crypto.randomUUID());
  await userEvent.click(screen.getByRole('button',{name:'Registrar cuenta'}));
  expect(await screen.findByRole('status')).toHaveTextContent('Cuenta creada.');
 });
 it('R04 MAS-001: muestra carga',()=>{
  mocks.resource.loading=true;render(<MascotasScreen/>);expect(screen.getByRole('status')).toHaveTextContent('Cargando');
 });
 it('R05 MAS-001: muestra lista vacía',()=>{
  render(<MascotasScreen/>);expect(screen.getByText(/Aún no tienes mascotas/)).toBeInTheDocument();
 });
 it('R06 MAS-001: muestra datos y navegación',()=>{
  mocks.resource.data=[{id:'p1',nombre:'Luna'}];render(<MascotasScreen/>);
  expect(screen.getByRole('cell',{name:'Luna'})).toBeInTheDocument();expect(screen.getByRole('link',{name:'Crear viaje'})).toHaveAttribute('href','/viajes');
 });
 it('R07 MAS-001: muestra error y permite reintentar',async()=>{
  mocks.resource.error='Sin conexión';render(<MascotasScreen/>);expect(screen.getByRole('alert')).toHaveTextContent('Sin conexión');
  await userEvent.click(screen.getByRole('button',{name:'Reintentar'}));expect(mocks.resource.reload).toHaveBeenCalledOnce();
 });
 it('R08 CHK-001: rechaza descripción vacía',async()=>{
  render(<RecordForm name="Tarea" path="/viajes/v1/tareas" fields={[{name:'descripcion',label:'Descripción'}]} button="Agregar" success="Guardada" onSuccess={vi.fn()}/>);
  await userEvent.click(screen.getByRole('button',{name:'Agregar'}));expect(screen.getByText('Este campo es obligatorio.')).toBeInTheDocument();expect(mocks.api).not.toHaveBeenCalled();
 });
 it('R09 CHK-001: guardar deshabilita el botón y muestra éxito',async()=>{
  let finish!:(value:unknown)=>void;mocks.api.mockImplementation(()=>new Promise(resolve=>{finish=resolve;}));
  const reload=vi.fn();render(<RecordForm name="Tarea" path="/viajes/v1/tareas" fields={[{name:'descripcion',label:'Descripción'}]} button="Agregar" success="Guardada" onSuccess={reload}/>);
  await userEvent.type(screen.getByLabelText('Descripción'),'Preparar transportadora');await userEvent.click(screen.getByRole('button',{name:'Agregar'}));
  expect(screen.getByRole('button',{name:'Guardando…'})).toBeDisabled();finish({});
  expect(await screen.findByRole('status')).toHaveTextContent('Guardada');expect(reload).toHaveBeenCalledOnce();
 });
 it('R10 DOC-002: sin vencimiento oculta fecha y no la envía',async()=>{
  mocks.api.mockResolvedValue({});render(<DocumentoForm mascotaId="p1" onSuccess={vi.fn()}/>);
  await userEvent.type(screen.getByLabelText('Identificación del documento'),'Carné');await userEvent.selectOptions(screen.getByLabelText('Vigencia'),'sin_vencimiento');
  expect(screen.queryByLabelText('Fecha de vencimiento')).not.toBeInTheDocument();await userEvent.click(screen.getByRole('button',{name:'Guardar documento'}));
  await waitFor(()=>expect(mocks.api).toHaveBeenCalled());expect(JSON.parse(mocks.api.mock.calls[0][2].body)).toEqual({identificacion:'Carné',vigencia:'sin_vencimiento'});
 });
 it('R11 DOC-001/002: exige identificación y fecha cuando corresponde',async()=>{
  render(<DocumentoForm mascotaId="p1" onSuccess={vi.fn()}/>);await userEvent.click(screen.getByRole('button',{name:'Guardar documento'}));
  expect(screen.getByText('Este campo es obligatorio.')).toBeInTheDocument();expect(screen.getByText('Indica la fecha de vencimiento.')).toBeInTheDocument();
 });
 it('R12 SEG-002/013: vacío sin porcentaje y aviso de no autorización',()=>{
  render(<SeguimientoCard data={{progreso:null,estadoGeneral:'Sin elementos',totalTareas:0,tareasCompletas:0,advertencias:[],revisiones:[],aviso:'Checklist completo no significa autorización para viajar'}}/>);
  expect(screen.getByRole('status')).toHaveTextContent('Sin elementos');expect(screen.queryByText('0%')).not.toBeInTheDocument();expect(screen.getByText('Checklist completo no significa autorización para viajar')).toBeInTheDocument();
 });
});
