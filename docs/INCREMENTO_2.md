# Incremento 2 — SWR pendientes del SRS

Implementa los 47 SWR que estaban «No implementado» o «Parcial». No toca los 15 SWR evaluados ni las matrices 01–03. USE-001 no es medible sin usuarios reales.

## SWR cubiertos

| Módulo | SWR |
|---|---|
| Cuenta | ACC-004 |
| Mascota | MAS-005..010 |
| Viaje | VIA-007..013 |
| Documentos | DOC-008, 010, 011, 013..017 |
| Checklist | CHK-006..015 |
| Seguimiento | SEG-001, 018..021 |
| Reglas del transportador | REG-001..005 |
| Datos | DATA-004..007 |
| Seguridad | SEC-001 (aislamiento ampliado) |

## Supuestos (decisiones DP-14..DP-19)

- Archivos: PDF, JPG y PNG (detectados por contenido); máx. 5 MB (documentos y reglas) y 2 MB (foto). Se guardan en Postgres (`Bytes`).
- Reemplazar un archivo crea una versión nueva y conserva las anteriores. Un PDF de reglas por viaje; una foto por mascota.
- Recuperación: código de 16 símbolos mostrado una sola vez al registrarse, guardado con bcrypt y renovado en cada uso.
- Plantillas: avión, carro y bus (genéricas, sin reglas por país).
- Por vencer = 30 días. «Hoy» = zona America/Bogota.
- Tareas recurrentes se copian al crear un viaje. Se archiva solo un viaje Finalizado.
- Las subtareas no cuentan en el progreso. PDF del checklist generado sin dependencias.

## Aplicar

1. Ejecutar `docs/SQL_INCREMENTO_2_SUPABASE.sql` en el SQL Editor de Supabase.
2. `npm run db:generate -w backend`
3. `npm run test:unit`, `npm run test:front`
4. `npm run verify:supabase`
5. (Docker) `npm run test:local`

## Verificación realizada en desarrollo

- Compilación de tipos del backend y front sin errores.
- Reglas puras y PDF: pruebas unitarias nuevas (N01–N11) pasaron.
- Prueba de humo HTTP con Prisma simulado: 41/41 (rutas, validaciones, multipart, sesión).
- Pendiente en tu equipo: RTL (N12–N19), `verify:supabase` contra la base real y revisión manual de la UI. No se extendieron Postman ni Playwright.
