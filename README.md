# Pet Travel Assistant

MVP web para organizar la preparación de un viaje con mascota. Proyecto final de **Calidad de Software** (CORHUILA, docente César Augusto Pérez Tafur).

Flujo cubierto: registro/login → mascota → viaje → checklist → documento con vigencia → vínculo a tarea → progreso, advertencias y estado general.

Alcance: [15 SWR del SRS v3.6](docs/ALCANCE_MVP.md). Los demás SWR se marcan fuera del MVP.

## Aplicación desplegada

| Componente | Plataforma (plan gratuito) | URL |
| --- | --- | --- |
| Frontend (Next.js) | Vercel | https://pet-travel-assistant-chi.vercel.app |
| API (NestJS) | Render | https://pet-travel-assistant-yzsj.onrender.com |
| Base de datos | Supabase PostgreSQL | conexión privada |

**Cuenta de prueba** (con datos de ejemplo):

- Correo: `docente@pettravel.test`
- Contraseña: `PetTravel2026!`

Notas:

- La aplicación **no define roles**: todas las cuentas tienen el mismo perfil y cada una solo accede a sus propios datos.
- Render gratuito se suspende tras ~15 minutos sin tráfico. La primera petición puede tardar hasta 50 segundos.
- Los secretos (`DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`) existen solo como variables de entorno de cada plataforma; no están en el repositorio.

## Funcionalidades

- **Autenticación:** registro, inicio de sesión y recuperación de cuenta.
- **Mascotas:** alta, edición y ficha de solo lectura.
- **Viajes:** origen, destino, fecha de salida y mascota; etapa del viaje.
- **Checklist:** tareas con estado (pendiente, completa, requiere revisión), progreso y estado general.
- **Documentos:** identificación y vigencia (fecha, sin vencimiento o desconocida), adjuntos PDF/JPG/PNG de hasta 5 MB y vínculo con tareas.
- **Seguimiento:** advertencias por vencimiento y aviso «Checklist completo no significa autorización para viajar».

## Arquitectura

```text
Navegador ──HTTPS──▶ Next.js (frontend)
                       │ fetch JSON + Bearer
                       ▼
                 NestJS (backend) ──Prisma──▶ PostgreSQL (Supabase)
```

- `frontend/`: Next.js 16 (App Router), React y TypeScript sobre la plantilla TailAdmin. Solo llama a la API; no usa cliente Supabase ni PostgREST. Marca y procedencia: [marca](docs/marca.md).
- `backend/`: NestJS con DTO validados, guard JWT y servicios. Las reglas de progreso, vigencia y estado están en `backend/src/domain/seguimiento.ts`, sin dependencia de NestJS ni Prisma.
- `backend/prisma/`: esquema y migraciones (Prisma 6).
- `e2e/` y `postman/`: pruebas de extremo a extremo y de API.
- `docs/`: alcance, supuestos, verificación y evidencias de calidad.

**Sesión:** JWT HS256 por `Authorization: Bearer`, sin cookies ni CSRF. El token vive en `sessionStorage` por pestaña y dura una hora. NestJS valida firma, expiración, emisor, audiencia y propiedad de cada recurso. Las contraseñas se guardan con hash bcrypt. Ver [supuestos](docs/SUPUESTOS_IMPLEMENTACION.md).

## Inicio rápido (local)

Requiere Node.js 22.12 o superior y npm. Para `test:local` también Docker Desktop y Google Chrome.

```powershell
npm ci
if (-not (Test-Path backend/.env)) { Copy-Item backend/.env.example backend/.env }
npm run db:generate
```

Completa `backend/.env` en tu editor (no compartas sus valores; está ignorado por Git) y verifica la conexión:

```powershell
npm run db:check
npm run dev
```

- Web: http://127.0.0.1:3000
- API: http://127.0.0.1:3001
- No se crean usuarios predeterminados: crea una cuenta desde la interfaz.

## Variables de entorno

| Variable | Dónde | Descripción |
| --- | --- | --- |
| `DATABASE_URL` | backend | Cadena del pooler de Supabase (puerto 6543, `pgbouncer=true`). La usa la API. |
| `DIRECT_URL` | backend | Conexión directa (referencia para Prisma). |
| `JWT_SECRET` | backend | Secreto aleatorio de al menos 32 bytes. No hay valor por defecto. |
| `FRONTEND_ORIGIN` | backend | Origen permitido por CORS. Local: `http://127.0.0.1:3000`. Producción: la URL de Vercel, sin `/` final. |
| `HOST` | backend | Interfaz de escucha. Por defecto `127.0.0.1`; en Render debe ser `0.0.0.0`. |
| `PORT` | backend | Puerto de la API (por defecto 3001; Render lo asigna). |
| `NEXT_PUBLIC_API_URL` | frontend | URL pública de la API. Se aplica **al compilar** Next.js (`frontend/.env.local` en local). |

El frontend nunca recibe las variables de conexión ni el secreto JWT.

> `sslaccept=accept_invalid_certs` se permitió solo en desarrollo local, por autorización del equipo, porque la red local interceptaba el certificado de Supabase. **No debe usarse en producción.** En producción (Render) la conexión usa la validación normal de certificado.

## Base de datos

Las tablas de Supabase se crearon con SQL generado por `prisma migrate diff` y ejecutado en el SQL Editor. **No ejecutes `migrate deploy` ni `migrate dev` contra esa base:** la inicialización no registra `_prisma_migrations`, y los comandos de migración están bloqueados para destinos reales. Se reservan al runner con PostgreSQL local efímero.

### Reproducir el esquema en una base nueva y vacía

1. `npm ci` y `npm run db:generate`.
2. `npm run db:sql` genera `backend/prisma/bootstrap.sql` sin conectarse a ninguna base. Internamente ejecuta, desde `backend/`:

   ```powershell
   npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script --output prisma/bootstrap.sql
   ```

3. El generador añade el CHECK de vigencia documental que el datamodel de Prisma no representa. Revisa el archivo completo.
4. Pega y ejecuta `backend/prisma/bootstrap.sql` una vez en el SQL Editor del proyecto nuevo. Crea tablas, enums, índices y relaciones; no incluye datos ni usuarios.
5. Configura `backend/.env`, comprueba `npm run db:check` e inicia `npm run dev`.

### Verificar contra Supabase real

```powershell
npm run verify:supabase
```

No ejecuta DDL. Levanta una API propia en un puerto libre, crea una cuenta única, recorre registro → login → mascota → viaje → tarea → documento → vínculo → seguimiento y elimina solo esos datos (por propietario, en una transacción). No imprime contraseñas ni tokens.

Estado: el 15 de noviembre de 2026 la conexión falló desde la red local del equipo (certificado interceptado). El 18 de noviembre la API desplegada en Render conectó con Supabase mediante el pooler y la validación normal de certificado, por lo que el fallo era de la red local y no de las credenciales ni de la base. Ver [verificación Supabase](docs/VERIFICACION_SUPABASE.md).

## Despliegue

Todo con planes gratuitos.

**Render (API)**

- Build: `npm install --include=dev && npm run db:generate && npm run build -w backend`
- Start: `npm run start -w backend`
- Variables: `NODE_VERSION=22.12.0`, `HOST=0.0.0.0`, `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `FRONTEND_ORIGIN`.
- Se usa `npm install --include=dev` (no `npm ci`) porque el CLI de Prisma y TypeScript son devDependencies y el lock se generó en Windows.

**Vercel (frontend)**

- Root Directory: `frontend`.
- Install Command: `cd .. && npm install --include=dev` (instala desde la raíz del monorepo, donde están las dependencias de desarrollo).
- Variable: `NEXT_PUBLIC_API_URL` con la URL de Render, sin `/` final.

**Registro de peticiones:** la API imprime cada petición como `fecha-ISO MÉTODO ruta estado duración`, sin query string, cuerpo ni cabeceras, de modo que no registra contraseñas ni tokens. Sirve para observar el sistema en producción en los logs de Render. Los planes gratuitos conservan pocos logs, así que conviene capturarlos el mismo día.

## Probar el flujo desde la interfaz

1. Crea una cuenta e inicia sesión.
2. En Mascotas, registra un nombre, por ejemplo Luna.
3. En Viajes, crea Neiva → Bogotá, salida `2027-02-01`, seleccionando Luna.
4. Abre su checklist: inicialmente muestra «Sin elementos», sin porcentaje.
5. Agrega «Verificar documentación»: nace pendiente.
6. En Documentos, registra «Certificado» con vencimiento `2027-03-01` (puedes adjuntar un PDF, JPG o PNG de hasta 5 MB).
7. Selecciona el documento y la tarea y pulsa «Vincular documento».
8. Cambia la tarea a completa. Debe mostrar 100 %, «Checklist completo» y «Checklist completo no significa autorización para viajar».

Fronteras de vigencia (usa viajes nuevos con documentos distintos):

| Vencimiento del documento | Resultado |
| --- | --- |
| Anterior a la salida | Advertencia «vence antes de la fecha de salida» |
| Igual a la salida | Requiere revisión, sin advertencia de fecha |
| Posterior a la salida | Sin advertencia de fecha |
| Desconocida | Advertencia de revisión |
| Sin vencimiento | Sin advertencia de fecha |

Un documento no vinculado a una tarea no se evalúa. La API rechaza con 400 los documentos de otra mascota y con 403 los de otra cuenta.

## Pruebas

```powershell
npm run typecheck
npm run build
npm run test:unit     # backend (reglas de dominio)
npm run test:front    # React Testing Library
```

Para ejecutar **todas** las suites con datos aislados, sin tocar Supabase:

```powershell
npm run test:local
```

Compila, comprueba que los puertos 3000, 3001 y 55439 estén libres, crea PostgreSQL 16 temporal en Docker, genera credenciales en memoria, aplica migraciones, inicia web y API, ejecuta las cuatro suites y limpia al terminar. Requiere Docker y Chrome; el primer uso puede descargar `postgres:16-alpine`.

Contra servicios ya iniciados:

```powershell
npm run test:api
npm run test:e2e
```

| Suite | Casos documentados | Suite completa |
| --- | --- | --- |
| Unitarias (backend) | 8 (U01–U08) | 23/23 |
| React Testing Library | 12 (R01–R12) | 26/26 |
| Postman / Newman | 8 casos, 14 assertions | 0 fallos |
| Playwright | 5 (E01–E05), 1440 y 390 px | 5/5 |

Postman usa `postman/local.postman_environment.json` (solo la URL local de la API); sus casos crean cuentas y datos independientes, y hace 10 llamadas auxiliares de preparación que no cuentan como casos. El reporte de Playwright queda en `playwright-report/index.html` (`npx playwright show-report`); trazas y capturas solo se conservan en fallos y no se versionan.

Explicaciones: [unitarias](docs/calidad/06_Pruebas_Unitarias/Guia.md), [caja blanca](docs/calidad/07_Caja_Blanca/Analisis.md), [RTL](docs/calidad/08_RTL/Explicacion.md), [Postman](docs/calidad/09_Postman/Guia.md) y [E2E](docs/calidad/10_Playwright/Explicacion.md). Resultados sin secretos: [resultados automatizados](docs/calidad/resultados-automatizados.json).

## Documentación de calidad

- [01 Alcance y trazabilidad](docs/calidad/01_Alcance_y_Trazabilidad.xlsx): 15 SWR seleccionados y 85 fuera del MVP.
- [02 Verificación](docs/calidad/02_Verificacion_Requisitos.xlsx) y [03 Validación](docs/calidad/03_Validacion_Requisitos.xlsx): análisis documental de los 15.
- [Casos manuales de caja negra](docs/calidad/05_Caja_Negra_Navegador/Casos_Manuales.xlsx): 10 casos solo desde el navegador.
- [ISO/IEC 25010 (actividad 15.1)](docs/calidad/12_ISO25010.xlsx): mecanismos implementados por característica, con rutas de código y límites de evidencia.
- [Pendientes del equipo](docs/PENDIENTES_EQUIPO.md).

No se elaboraron el punto 14, la matriz 15.2 ni los puntos 17–26.

## Equipo

María Fernanda Robayo Laguna · Laura Sofía Cangrejo Perafán · Jhon Sebastián Caviedes.
Corporación Universitaria del Huila (CORHUILA), Calidad de Software.