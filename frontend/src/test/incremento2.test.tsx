import React from 'react';
import {beforeEach,describe,it,expect,vi} from 'vitest';
import {render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthForm from '@/components/auth/auth-form';
import RecuperarForm from '@/components/auth/recuperar-form';
import TaskList from '@/components/checklist/task-list';
import SeguimientoCard from '@/components/seguimiento/seguimiento-card';
import ReglasViaje from '@/components/viajes/reglas-viaje';
import MascotaFicha from '@/components/mascotas/mascota-ficha';
import type {Seguimiento,Tarea} from '@/lib/types';

const mocks=vi.hoisted(()=>({api:vi.fn(),subir:vi.fn()}));
vi.mock('next/navigation',()=>({useRouter:()=>({replace:vi.fn()})}));
vi.mock('@/components/auth/auth-provider',()=>({useAuth:()=>({login:vi.fn(),usuario:null,token:'token-de-prueba'})}));
vi.mock('@/lib/api',()=>({api:mocks.api}));
vi.mock('@/lib/files',async()=>({...(await vi.importActual<typeof import('@/lib/files')>('@/lib/files')),subirArchivo:mocks.subir,obtenerArchivo:vi.fn()}));

// Incremento 2 (SWR-ACC-004, SWR-CHK-010/011, SWR-SEG-018..021, SWR-REG-002/003, SWR-MAS-005). No cuentan entre las 12 pruebas RTL del MVP.
const tarea=(id:string,descripcion:string,extra:Partial<Tarea>={}):Tarea=>({id,descripcion,estado:'pendiente',viajeId:'v1',...extra});
const seguimiento:Seguimiento={progreso:50,estadoGeneral:'Con pendientes',totalTareas:2,tareasCompletas:1,advertencias:[],revisiones:[],aviso:'Checklist completo no significa autorización para viajar',
  semaforo:'amarillo',diasRestantes:12,porVencer:[{documentoId:'d1',identificacion:'Certificado',fechaVencimiento:'2027-02-10',diasParaVencer:21}],
  lista:[{tipo:'pendiente',texto:'Comprar guacal',referenciaId:'t2'}],resumen:{progreso:50,advertencias:0,porVencer:1,diasRestantes:12}};

beforeEach(()=>{vi.clearAllMocks();mocks.api.mockResolvedValue({});mocks.subir.mockResolvedValue({});});
describe('Incremento 2 (8 pruebas)',()=>{
 it('N12 ACC-001/004: el registro muestra el código de recuperación una vez',async()=>{
  mocks.api.mockResolvedValue({codigoRecuperacion:'ABCD-EFGH-JKLM-NPQR'});render(<AuthForm register/>);
  await userEvent.type(screen.getByLabelText('Correo'),'persona@example.test');await userEvent.type(screen.getByLabelText('Contraseña'),crypto.randomUUID());
  await userEvent.click(screen.getByRole('button',{name:'Registrar cuenta'}));
  expect(await screen.findByLabelText('Código de recuperación')).toHaveTextContent('ABCD-EFGH-JKLM-NPQR');expect(screen.getByRole('status')).toHaveTextContent('Cuenta creada.');
 });
 it('N13 ACC-004: recuperar valida los campos y muestra el código nuevo',async()=>{
  render(<RecuperarForm/>);await userEvent.click(screen.getByRole('button',{name:'Restablecer contraseña'}));
  expect(screen.getByText('Ingresa un correo válido.')).toBeInTheDocument();expect(screen.getByText('Ingresa tu código de recuperación.')).toBeInTheDocument();expect(mocks.api).not.toHaveBeenCalled();
  mocks.api.mockResolvedValue({codigoRecuperacion:'NUEV-OCOD-IGOX-YZ23'});
  await userEvent.type(screen.getByLabelText('Correo'),'persona@example.test');await userEvent.type(screen.getByLabelText('Código de recuperación'),'ABCD-EFGH-JKLM-NPQR');await userEvent.type(screen.getByLabelText('Nueva contraseña'),crypto.randomUUID());
  await userEvent.click(screen.getByRole('button',{name:'Restablecer contraseña'}));
  expect(await screen.findByLabelText('Nuevo código de recuperación')).toHaveTextContent('NUEV-OCOD-IGOX-YZ23');expect(mocks.api.mock.calls[0][0]).toBe('/auth/recuperar');
 });
 it('N14 SEG-018..021: muestra semáforo, días, resumen y lista única sin duplicar el estado',()=>{
  render(<SeguimientoCard data={seguimiento}/>);
  expect(screen.getByText(/Semáforo: Amarillo/)).toBeInTheDocument();expect(screen.getByText('Faltan 12 días')).toBeInTheDocument();
  expect(screen.getByRole('region',{name:'Pendientes y avisos del viaje'})).toHaveTextContent('Comprar guacal');expect(screen.getByRole('region',{name:'Documentos por vencer'})).toHaveTextContent('no cambia el estado');
  expect(screen.getAllByRole('status')).toHaveLength(1);
 });
 it('N15 CHK-011: los botones Subir y Bajar envían el orden completo',async()=>{
  render(<TaskList tareas={[tarea('t1','Comprar guacal'),tarea('t2','Reservar cupo')]} onChange={vi.fn()}/>);
  expect(screen.getByRole('button',{name:'Subir tarea Comprar guacal'})).toBeDisabled();
  await userEvent.click(screen.getByRole('button',{name:'Subir tarea Reservar cupo'}));
  expect(mocks.api).toHaveBeenCalledWith('/viajes/v1/tareas/orden','token-de-prueba',{method:'PATCH',body:JSON.stringify({ids:['t2','t1']})});
 });
 it('N16 CHK-010: agregar una subtarea envía POST y exige texto',async()=>{
  render(<TaskList tareas={[tarea('t1','Comprar guacal')]} onChange={vi.fn()}/>);
  await userEvent.click(screen.getByRole('button',{name:'Detalles de Comprar guacal'}));
  await userEvent.click(screen.getByRole('button',{name:'Agregar subtarea'}));expect(await screen.findByRole('alert')).toHaveTextContent('Escribe la descripción');expect(mocks.api).not.toHaveBeenCalled();
  await userEvent.type(screen.getByRole('textbox',{name:'Nueva subtarea de Comprar guacal'}),'Medir al perro');await userEvent.click(screen.getByRole('button',{name:'Agregar subtarea'}));
  expect(mocks.api).toHaveBeenCalledWith('/tareas/t1/subtareas','token-de-prueba',{method:'POST',body:JSON.stringify({descripcion:'Medir al perro'})});
 });
 it('N17 CHK-008/012/013: guardar detalles envía fecha, responsable, comentario y recurrencia',async()=>{
  render(<TaskList tareas={[tarea('t1','Comprar guacal')]} onChange={vi.fn()}/>);
  await userEvent.click(screen.getByRole('button',{name:'Detalles de Comprar guacal'}));
  await userEvent.type(screen.getByLabelText('Responsable'),'Ana');await userEvent.click(screen.getByLabelText(/Recurrente/));await userEvent.click(screen.getByRole('button',{name:'Guardar detalles'}));
  await waitFor(()=>expect(mocks.api).toHaveBeenCalled());
  expect(JSON.parse(mocks.api.mock.calls[0][2].body)).toEqual({fechaLimite:'',responsable:'Ana',comentario:'',recurrente:true});
 });
 it('N18 REG-002/003: el PDF de reglas exige transportador y rechaza otros formatos sin llamar la API',async()=>{
  render(<ReglasViaje viajeId="v1" reglas={null} onChange={vi.fn()}/>);
  await userEvent.click(screen.getByRole('button',{name:'Adjuntar PDF'}));
  expect(screen.getByText('Indica el nombre del transportador.')).toBeInTheDocument();expect(screen.getByText('Selecciona un archivo PDF.')).toBeInTheDocument();
  await userEvent.type(screen.getByLabelText('Nombre del transportador'),'Aerolínea X');
  await userEvent.setup({applyAccept:false}).upload(screen.getByLabelText(/Archivo PDF de reglas/),new File(['x'],'reglas.png',{type:'image/png'}));
  await userEvent.click(screen.getByRole('button',{name:'Adjuntar PDF'}));
  expect(await screen.findByText(/Formato no permitido/)).toBeInTheDocument();expect(mocks.subir).not.toHaveBeenCalled();
 });
 it('N19 MAS-005/009/010: la ficha envía los datos opcionales y valida la edad',async()=>{
  render(<MascotaFicha mascota={{id:'p1',nombre:'Luna'}} onSaved={vi.fn()}/>);
  await userEvent.type(screen.getByLabelText('Edad (años)'),'abc');await userEvent.click(screen.getByRole('button',{name:'Guardar ficha'}));
  expect(await screen.findByText(/edad entera/)).toBeInTheDocument();expect(mocks.api).not.toHaveBeenCalled();
  await userEvent.clear(screen.getByLabelText('Edad (años)'));await userEvent.type(screen.getByLabelText('Edad (años)'),'4');await userEvent.type(screen.getByLabelText('Especie'),'Perro');
  await userEvent.type(screen.getByLabelText('Contacto de emergencia (nombre y teléfono)'),'Ana 3000000000');await userEvent.click(screen.getByRole('button',{name:'Guardar ficha'}));
  await waitFor(()=>expect(mocks.api).toHaveBeenCalled());
  expect(mocks.api.mock.calls[0][0]).toBe('/mascotas/p1');
  expect(JSON.parse(mocks.api.mock.calls[0][2].body)).toMatchObject({especie:'Perro',edad:4,peso:null,contactoEmergencia:'Ana 3000000000'});
 });
});
