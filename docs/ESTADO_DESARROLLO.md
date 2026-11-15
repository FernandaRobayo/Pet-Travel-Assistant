# Estado del desarrollo

La base y las funcionalidades comunes a las dos alternativas están implementadas: registro, login, rutas protegidas, mascotas, viajes y checklist con sus tres estados. La API y la interfaz usan NestJS, Prisma, PostgreSQL y Next.js con componentes originales de TailAdmin.

La selección de requisitos sigue pendiente: el usuario solicita a la vez flujo completo con documentos/seguimiento y no exceder los 15 SWR. La alternativa documentada de 15 IDs comprende ACC-001/002/003, MAS-001/002/003, VIA-001/002/003/004/005 y CHK-001/002/004/005. No incluye documentos ni seguimiento; la propuesta completa abarca 40 IDs. No se incorporan estos módulos hasta aclarar ese límite.

Las matrices de la Fase 1 son borradores. Las decisiones de sesión Bearer y redondeo entero de `SUPUESTOS_IMPLEMENTACION.md` sustituyen las propuestas anteriores. La Fase 4 y los entregables finales aún no se han ejecutado ni se consideran terminados.

La conexión real de Supabase no está configurada en este entorno. Las comprobaciones de integración se realizan contra PostgreSQL temporal, sin reutilizar credenciales ni datos reales.

## Verificaciones realizadas

- `npm run typecheck`: frontend y backend sin errores.
- Compilación de producción Next.js y compilación TypeScript de NestJS: correctas.
- Migraciones versionadas aplicadas a PostgreSQL 16 temporal; contenedor eliminado tras comprobarlas.
- Smoke de API: registro, duplicado, login correcto e incorrecto, ruta sin Bearer, mascota, viaje, tarea inicialmente pendiente, cambio de estado y aislamiento entre dos cuentas, incluidas lectura de viaje y modificación de tarea por ID ajeno.
- Smoke automatizado de navegador en Chrome: redirección sin sesión; login; registrar mascota; crear viaje; agregar tarea; pasar a completa. Sin cookies y sin desbordamiento horizontal a 1440 y 390 píxeles.

Los datos, contraseñas y secreto JWT de la comprobación se generaron en memoria. No se incorporan al repositorio ni se proporcionan como credenciales predeterminadas. Los servicios y el contenedor temporales se detuvieron al terminar. Esto no verifica todavía la conexión Supabase del equipo ni sustituye las suites y cantidades exigidas en Fase 4.
