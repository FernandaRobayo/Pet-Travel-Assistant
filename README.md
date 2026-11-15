# Pet Travel Assistant

MVP web para organizar un viaje con mascota: registro/login → mascota → viaje → checklist → documento con vigencia → vínculo a tarea → progreso, advertencias y estado general. Alcance: [15 SWR](docs/ALCANCE_MVP.md). Los demás SWR del SRS se marcan fuera de este MVP.

Next.js App Router, React y TypeScript en `frontend/`; NestJS en `backend/`; Prisma y migraciones en `backend/prisma/`; PostgreSQL en Supabase. El frontend solo llama a la API NestJS. No usa cliente Supabase ni PostgREST. Identidad visual y procedencia de TailAdmin: [marca](docs/marca.md).

## Instalar y configurar

Requiere Node.js 22.12 o superior, npm y conexión PostgreSQL. Para las pruebas aisladas se requieren Docker Desktop y Google Chrome.

```powershell
npm ci
if (-not (Test-Path backend/.env)) { Copy-Item backend/.env.example backend/.env }
npm run db:generate
```

La app usa Supabase real. Completa `backend/.env` en tu editor con `DATABASE_URL` del pooler Supabase, `DIRECT_URL` como referencia de conexión directa y `JWT_SECRET` aleatorio de al menos 32 bytes. No hay valores predeterminados de contraseña o token. No sobrescribas un archivo ya configurado ni compartas sus valores. `.env` está ignorado por Git.

```powershell
npm run db:check
npm run dev
```

`db:check` consulta SELECT 1 exclusivamente mediante `DATABASE_URL`, la misma fuente que usa la API. No contacta `DIRECT_URL`. Si falla, informa la excepción original con credenciales y URLs sensibles redactadas.

Las tablas existentes en Supabase fueron creadas por el equipo con SQL generado mediante `prisma migrate diff` y ejecutado en SQL Editor. **No ejecutar `migrate deploy` ni `migrate dev` contra esa base.** La inicialización SQL no registra automáticamente `_prisma_migrations`. Los comandos de migración se bloquean para destinos reales y se reservan al runner con PostgreSQL local efímero.

## Reproducir el esquema en una base nueva

Solo para una base **nueva y vacía**, nunca para volver a inicializar la Supabase existente:

1. Instalar con `npm ci` y generar Prisma Client con `npm run db:generate`.
2. Ejecutar `npm run db:sql`. Genera `backend/prisma/bootstrap.sql` sin conectarse a ninguna base. Internamente usa, desde `backend/`:

   ```powershell
   npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script --output prisma/bootstrap.sql
   ```

3. El generador añade el CHECK de vigencia documental que el datamodel de Prisma no representa. Revisar el archivo completo.
4. En SQL Editor del proyecto Supabase nuevo, pegar `backend/prisma/bootstrap.sql` y ejecutarlo una vez. Crea tablas, enums, índices y relaciones; no incluye datos, usuarios ni credenciales.
5. Configurar `backend/.env`, comprobar `npm run db:check` e iniciar `npm run dev`. No aplicar migrate deploy/dev sobre esa inicialización SQL.

El archivo local `backend/schema.sql` del equipo se conserva intacto. La reproducción versionada es `backend/prisma/bootstrap.sql` y su generador.

Web: http://127.0.0.1:3000. API: http://127.0.0.1:3001. No se crean usuarios predeterminados.

Para cambiar orígenes: `FRONTEND_ORIGIN` y `PORT` pertenecen al entorno backend; `NEXT_PUBLIC_API_URL` a `frontend/.env.local` y se aplica al compilar Next.js. NestJS carga `backend/.env`; el frontend no recibe las variables de conexión ni el secreto JWT.

Supuesto: `sslaccept=accept_invalid_certs` se permite únicamente para desarrollo local por autorización del equipo. Omite la validación del certificado del servidor; en producción debe usarse validación de certificado con la CA oficial y los parámetros correspondientes del cliente. Este ajuste no debe trasladarse a producción.

La comprobación del 15 de noviembre de 2026 no conectó ni con `sslaccept=accept_invalid_certs` ni con la alternativa `sslmode=require`: Prisma informó `Can't reach database server at aws-0-us-east-2.pooler.supabase.com:6543` en ambos casos. La configuración local final conserva `sslaccept=accept_invalid_certs` en ambas URLs y `pgbouncer=true` en DATABASE_URL. El usuario y los puertos son correctos; las contraseñas no contienen corchetes ni caracteres reservados sin codificar detectados. Esto no confirma que las contraseñas sean válidas en Supabase. La comparación con la terminal del equipo está pendiente. Véase [verificación Supabase](docs/VERIFICACION_SUPABASE.md).

Para repetir conexión y recorrido real después de corregir el acceso:

```powershell
npm run verify:supabase
```

No ejecuta DDL ni migraciones. Si conecta, levanta una API propia en un puerto libre, crea una cuenta única y ejecuta registro → login → mascota → viaje → tarea → documento → vínculo → seguimiento completo. Al terminar elimina solo esa cuenta y sus registros, por propietario y en una transacción. Si falla antes de crear datos, lo informa. No imprime contraseñas, tokens ni respuestas HTTP crudas. La ejecución actual no creó datos porque no conectó.

## Probar el flujo desde la interfaz

1. Crea una cuenta y luego inicia sesión.
2. En Mascotas, registra un nombre, por ejemplo Luna.
3. En Viajes, crea Neiva → Bogotá, salida `2027-02-01`, seleccionando Luna.
4. Abre su checklist: inicialmente muestra «Sin elementos», sin porcentaje.
5. Agrega «Verificar documentación»: nace pendiente.
6. Registra «Certificado», con vigencia por fecha y vencimiento `2027-03-01`.
7. Selecciona el documento y la tarea; pulsa «Vincular documento».
8. Cambia la tarea a completa. Debe mostrar 100%, «Checklist completo» y «Checklist completo no significa autorización para viajar».

Para probar las fronteras, usa viajes nuevos con documentos diferentes: anterior a salida genera advertencia; igual genera revisión sin advertencia de fecha; posterior no genera advertencia de fecha. Desconocida genera advertencia de revisión y sin vencimiento no genera advertencia de fecha. Un documento no vinculado no se evalúa. La API rechaza documentos de otra mascota con 400 y fuera de la cuenta con 403.

Las opciones de vigencia son fecha, sin vencimiento y desconocida. La identificación es un solo texto. No se agregan archivos ni funciones de edición/desvinculación no seleccionadas. Los cambios de tareas y vínculos actualizan el seguimiento.

## Arquitectura y sesión

JWT por `Authorization: Bearer`, sin cookies ni CSRF. Supuesto: token en sessionStorage por pestaña y duración de una hora. El frontend verifica sesión al entrar y limpia la sesión al recibir 401; NestJS verifica firma, expiración, emisor, audiencia y propiedad de los recursos. Las contraseñas se guardan con hash bcrypt. Los [supuestos](docs/SUPUESTOS_IMPLEMENTACION.md) distinguen decisiones de diseño de requisitos fuente.

Las funciones de progreso, vigencia, estado y validación del vínculo están en `backend/src/domain/seguimiento.ts`, sin dependencia de NestJS o Prisma. El progreso usa entero redondeado; el estado general usa condiciones, no el porcentaje redondeado.

## Ejecutar las pruebas

```powershell
npm run typecheck
npm run build
npm run test:unit
npm run test:front
```

Para ejecutar todas las suites con datos aislados, sin modificar Supabase:

```powershell
npm run test:local
```

Este script compila, comprueba que los puertos 3000, 3001 y 55439 estén libres, crea PostgreSQL 16 temporal, genera credenciales en memoria, aplica migraciones, inicia web/API y ejecuta las cuatro suites. Al terminar detiene los procesos y elimina su contenedor. No reutiliza servicios ajenos ni cambia `.env`. Requiere Docker y Chrome; el primer uso puede descargar `postgres:16-alpine`.

Para probar contra tus servicios ya iniciados:

```powershell
npm run test:api
npm run test:e2e
```

Postman usa `postman/local.postman_environment.json`, cuyo único valor es la URL local de la API. Ejecútalo en orden. Los casos generan cuentas y datos independientes; no exportes sus variables de ejecución. Las pruebas sobre un destino propio agregan datos de prueba en ese destino.

| Suite | Resultado final ejecutado |
| --- | --- |
| Unitarias | 8/8 |
| RTL | 12/12 |
| Postman | 8 casos, 14 assertions, 0 fallos |
| Playwright | 5/5; tres flujos completos; 1440 y 390 px |

Postman efectúa 10 llamadas auxiliares de preparación además de los 8 requests principales; no se cuentan como casos adicionales. Los resultados sin secretos están en [resultados automatizados](docs/calidad/resultados-automatizados.json).

El reporte HTML de Playwright queda en `playwright-report/index.html` y se abre con `npx playwright show-report`. Las trazas y capturas se conservan solo en fallos, en `test-results/`. No se versionan por tamaño y posible contenido de sesión. La ejecución final no deja trazas de fallo. La configuración permite conservarlas en fallos futuros; no las compartas sin depurar.

Explicaciones: [8 unitarias](docs/calidad/06_Pruebas_Unitarias/Guia.md), [3 bloques de caja blanca](docs/calidad/07_Caja_Blanca/Analisis.md), [3 RTL línea por línea](docs/calidad/08_RTL/Explicacion.md), [8 Postman](docs/calidad/09_Postman/Guia.md) y [2 E2E a nivel de código](docs/calidad/10_Playwright/Explicacion.md).

Lista de acciones manuales, capturas y temas para estudiar: [pendientes del equipo](docs/PENDIENTES_EQUIPO.md).

## Documentación y trabajo manual pendiente

- [01 Alcance y trazabilidad](docs/calidad/01_Alcance_y_Trazabilidad.xlsx): 15 seleccionados y 85 fuera del MVP.
- [02 Verificación](docs/calidad/02_Verificacion_Requisitos.xlsx) y [03 Validación](docs/calidad/03_Validacion_Requisitos.xlsx): análisis documental de los 15.
- [10 casos manuales solo navegador](docs/calidad/05_Caja_Negra_Navegador/Casos_Manuales.xlsx): el equipo completa obtenido, PASS/FAIL y evidencia; no se ejecutaron por el asistente.
- [ISO 25010, actividad 15.1](docs/calidad/12_ISO25010.xlsx): plan, formato exploratorio en blanco y mecanismos implementados para las nueve características con rutas de código y límites de evidencia.

El equipo debe ejecutar caja negra y exploratoria y tomar capturas de la plantilla original, marca aplicada, flujo completo, advertencias y tamaños de pantalla. No se inventaron resultados manuales ni hallazgos. No se elaboraron punto 14, matriz 15.2 ni puntos 17–26.
