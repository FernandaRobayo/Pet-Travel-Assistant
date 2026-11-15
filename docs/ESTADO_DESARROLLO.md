# Estado del desarrollo

El flujo completo está implementado y verificado: registro/login, mascota, viaje, tareas, documentos con las tres modalidades de vigencia, vínculo y seguimiento con progreso, advertencias y estado general. Se aplica el alcance de 15 SWR de `ALCANCE_MVP.md`.

Backend NestJS con Prisma y PostgreSQL; frontend Next.js con TailAdmin; JWT Bearer sin cookies. Las reglas puras están en `backend/src/domain/seguimiento.ts`. La API aplica aislamiento por usuario y rechaza vínculos entre mascotas distintas con 400; un documento fuera de la cuenta no se puede vincular y devuelve 403.

La ejecución integrada final sobre PostgreSQL 16 temporal pasó 8 unitarias, 12 RTL, 8 casos Postman (14 assertions) y 5 Playwright. Hay tres flujos E2E desde login hasta estado general y verificación a 1440 y 390 px. El reporte HTML se genera en `playwright-report/`; las trazas se conservan en fallos. La primera ejecución detectó dos locators ambiguos; se corrigieron y la ejecución final pasó 5/5.

Postman realiza 8 requests principales y 10 auxiliares para preparar datos; estos últimos no se cuentan como casos adicionales. Las credenciales se generan en memoria, no tienen valores predeterminados y no se exportan. El JSON de resultados conserva solo los resultados y el entorno. Se ejecutaron typecheck y builds de producción. Los procesos y el contenedor temporales se detuvieron al terminar.

## Supabase

`backend/.env` ya está presente y excluido por Git. No se abrió ni imprimió su contenido. Se intentaron `migrate deploy` y la comprobación de conexión con salida protegida. La última clasificación fue `DB_CONNECTION`: no se confirmó conectividad. Las suites aprobadas corresponden a PostgreSQL temporal, no al destino Supabase del equipo.

No se modificó ni incorporó el archivo local `backend/schema.sql`, que apareció durante el trabajo. El esquema utilizado es `backend/prisma/schema.prisma` con sus migraciones.

## Trabajo manual

El equipo debe ejecutar los 10 casos de caja negra, completar la sesión exploratoria y tomar capturas de TailAdmin original y aplicación final. Las celdas manuales permanecen en blanco. ISO 25010 incluye mecanismos y rutas reales, con límites de evidencia; no constituye certificación ni la matriz 15.2 excluida.
