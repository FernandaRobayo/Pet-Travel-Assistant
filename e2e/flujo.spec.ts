import {test,expect,type Page,type APIRequestContext} from '@playwright/test';
import {randomBytes,randomUUID} from 'node:crypto';

const api=process.env.E2E_API_URL||'http://127.0.0.1:3001';
async function account(request:APIRequestContext){
 const correo=`e2e-${randomUUID()}@example.test`,contrasena=randomBytes(18).toString('hex');
 const result=await request.post(`${api}/auth/register`,{data:{correo,contrasena}});expect(result.status()).toBe(201);
 return {correo,contrasena};
}
async function login(page:Page,credentials:{correo:string;contrasena:string}){
 await page.goto('/login');await page.getByLabel('Correo',{exact:true}).fill(credentials.correo);await page.getByLabel('Contraseña',{exact:true}).fill(credentials.contrasena);
 await page.getByRole('button',{name:'Ingresar',exact:true}).click();await expect(page.getByRole('heading',{name:'Mascotas',exact:true})).toBeVisible();
}
async function trip(page:Page){
 await page.getByLabel('Nombre o identificador visible').fill('Luna');await page.getByRole('button',{name:'Guardar mascota'}).click();await expect(page.getByRole('status').filter({hasText:'Mascota registrada.'})).toBeVisible();
 await page.getByRole('navigation').getByRole('link',{name:'Viajes',exact:true}).click();
 await page.getByLabel('Origen',{exact:true}).fill('Neiva');await page.getByLabel('Destino',{exact:true}).fill('Bogotá');await page.getByLabel('Fecha de salida',{exact:true}).fill('2027-02-01');await page.getByLabel('Mascota',{exact:true}).selectOption({label:'Luna'});
 await page.getByRole('button',{name:'Guardar viaje'}).click();await expect(page.getByRole('status').filter({hasText:'Viaje creado.'})).toBeVisible();await page.getByRole('link',{name:'Abrir checklist'}).click();
 await expect(page.getByRole('status').filter({hasText:'Sin elementos'})).toBeVisible();
}
async function task(page:Page){
 await page.getByLabel('Descripción de la tarea').fill('Verificar documentos');await page.getByRole('button',{name:'Agregar tarea',exact:true}).click();await expect(page.getByLabel('Estado de tarea Verificar documentos')).toHaveValue('pendiente');
 await page.getByLabel('Estado de tarea Verificar documentos').selectOption('completa');await expect(page.getByRole('status').filter({hasText:'Checklist completo'})).toBeVisible();
}
async function document(page:Page,fecha:string){
 await page.getByRole('link',{name:'Gestionar documentos',exact:true}).click();await expect(page.getByRole('heading',{level:1,name:/^Documentos de /})).toBeVisible();
 await page.getByLabel('Identificación del documento').fill('Certificado');await page.getByLabel('Fecha de vencimiento').fill(fecha);await page.getByRole('button',{name:'Guardar documento'}).click();
 await expect(page.getByText('Documento registrado. Vincúlalo a una tarea para evaluarlo.',{exact:true})).toBeVisible();
 await page.getByLabel('Documento a vincular').selectOption({label:'Certificado'});await page.getByLabel('Tarea a vincular').selectOption({label:'Verificar documentos'});await page.getByRole('button',{name:'Vincular documento',exact:true}).click();
 await expect(page.getByText('Documento vinculado. El seguimiento se actualizó.',{exact:true})).toBeVisible();
 await page.getByRole('link',{name:'← Volver al checklist'}).click();
}

test('E01 ACC-003: ruta protegida sin sesión vuelve a login',async({page})=>{
 await page.goto('/viajes');await expect(page).toHaveURL(/\/login$/);await expect(page.getByRole('heading',{name:'Iniciar sesión'})).toBeVisible();
});
test('E02 ACC-002: credencial incorrecta mantiene login y muestra error',async({page,request})=>{
 const credentials=await account(request);await page.goto('/login');await page.getByLabel('Correo',{exact:true}).fill(credentials.correo);await page.getByLabel('Contraseña',{exact:true}).fill(randomBytes(18).toString('hex'));await page.getByRole('button',{name:'Ingresar',exact:true}).click();
 await expect(page.getByRole('alert').filter({hasText:'Correo o contraseña incorrectos.'})).toBeVisible();await expect(page).toHaveURL(/\/login$/);
});
test('E03 DOC-005/SEG-013: flujo completo hasta Checklist completo',async({page,request})=>{
 await login(page,await account(request));await trip(page);await task(page);await document(page,'2027-02-02');
 await expect(page.getByRole('status').filter({hasText:'Checklist completo'})).toBeVisible();await expect(page.getByText('100%',{exact:true})).toBeVisible();await expect(page.getByText('Checklist completo no significa autorización para viajar',{exact:true})).toBeVisible();
});
test('E04 DOC-005/SEG-005: flujo completo con vencimiento anterior exige revisión en móvil',async({page,request})=>{
 await page.setViewportSize({width:390,height:844});await login(page,await account(request));
 await page.getByLabel('Nombre o identificador visible').fill('Luna');await page.getByRole('button',{name:'Guardar mascota'}).click();await expect(page.getByText('Mascota registrada.',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Abrir o cerrar menú'}).click();await page.getByRole('navigation').getByRole('link',{name:'Viajes',exact:true}).click();
 await page.getByLabel('Origen',{exact:true}).fill('Neiva');await page.getByLabel('Destino',{exact:true}).fill('Bogotá');await page.getByLabel('Fecha de salida',{exact:true}).fill('2027-02-01');await page.getByLabel('Mascota',{exact:true}).selectOption({label:'Luna'});await page.getByRole('button',{name:'Guardar viaje'}).click();await expect(page.getByText('Viaje creado.',{exact:true})).toBeVisible();await page.getByRole('link',{name:'Abrir checklist'}).click();
 await task(page);await document(page,'2027-01-31');await expect(page.getByRole('status').filter({hasText:'Requiere revisión'})).toBeVisible();await expect(page.getByRole('region',{name:'Advertencias'})).toContainText('antes de la fecha de salida');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('E05 SEG-005/SYS-03: igualdad requiere revisión sin advertencia de fecha',async({page,request})=>{
 await login(page,await account(request));await trip(page);await task(page);await document(page,'2027-02-01');
 await expect(page.getByRole('status').filter({hasText:'Requiere revisión'})).toBeVisible();await expect(page.getByRole('region',{name:'Revisiones'})).toContainText('coincide');await expect(page.getByRole('region',{name:'Advertencias'})).toHaveCount(0);
});
