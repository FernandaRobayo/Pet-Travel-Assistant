# Pet Travel Assistant

Monorepo con Next.js/React/TypeScript, NestJS, Prisma y PostgreSQL en Supabase. El frontend solo consume la API NestJS. Plantilla gratuita TailAdmin con licencia conservada en `frontend/LICENSE-TailAdmin`.

Estado: base, autenticación, mascotas, viajes y checklist implementados. Documentos y seguimiento esperan la resolución del límite de 15 SWR frente al flujo completo; consultar [estado de desarrollo](docs/ESTADO_DESARROLLO.md). Las suites de Fase 4 y documentos finales todavía están pendientes.

## Preparación

Requiere Node.js 22.12 o superior y npm. Desde la raíz:

```powershell
npm ci
Copy-Item backend/.env.example backend/.env
```

Completa `backend/.env` localmente con `DATABASE_URL` del pooler de tu proyecto Supabase, `DIRECT_URL` para migraciones y un `JWT_SECRET` aleatorio de al menos 32 bytes. No compartas ni subas esos valores. Las URLs se obtienen de la configuración del propio proyecto Supabase, con su contraseña codificada como URL cuando corresponda. No hay credenciales predeterminadas. No sobrescribas el archivo si ya lo configuraste.

Los valores predeterminados son web `http://127.0.0.1:3000` y API `http://127.0.0.1:3001`. Si los cambias, configura `FRONTEND_ORIGIN` y `PORT` en el entorno del backend y `NEXT_PUBLIC_API_URL` en `frontend/.env.local`; este último se aplica al compilar Next.js. NestJS carga `backend/.env`. El frontend no recibe las variables de conexión ni el secreto JWT.

```powershell
npm run db:generate
npm run db:check
npm run db:migrate
npm run dev
```

Abre http://127.0.0.1:3000. `db:migrate` aplica las migraciones versionadas al destino de `DIRECT_URL`; revisa que corresponda al entorno de desarrollo antes de ejecutarlo.

Para crear/aplicar migraciones durante desarrollo, el comando solicitado es `npm run db:migrate:dev` (`prisma migrate dev`). Puede necesitar permisos o una base shadow adicional en Supabase. Los scripts no envían confirmación de reset ni de pérdida de datos y no muestran salida con detalles de conexión. `db:check` comprueba pooler y conexión de migraciones con `SELECT 1`, sin mostrar URLs ni secretos.

## Recorrido disponible

1. En «Crear cuenta», registra tu propio correo y contraseña; inicia sesión.
2. Registra una mascota con nombre o identificador visible.
3. Abre «Viajes», indica origen, destino, fecha de salida y mascota; guarda.
4. Abre el checklist, agrega una tarea y comprueba que nace pendiente.
5. Cambia el estado a completa o requiere revisión. Recarga para comprobar persistencia.
6. Cierra sesión y abre `/viajes`: la navegación vuelve a login. La API rechaza rutas protegidas sin Bearer.

Este recorrido no sustituye el flujo completo solicitado con documentos y estado general: esos módulos siguen pendientes de decisión de alcance.

## Comprobación técnica

```powershell
npm run typecheck
npm run build
```

La compilación no necesita credenciales Supabase. La ejecución de la API sí necesita conexión PostgreSQL y JWT_SECRET válidos. Las verificaciones técnicas realizadas durante desarrollo no se presentan como las suites formales ni como los casos manuales que debe ejecutar el equipo.

La sesión usa JWT en `Authorization: Bearer`, sin cookies. Los supuestos, límites y procedencia de la plantilla se explican en [supuestos de implementación](docs/SUPUESTOS_IMPLEMENTACION.md).
