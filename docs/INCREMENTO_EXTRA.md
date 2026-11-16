# Incremento extra (fuera de los 15 SWR evaluados)

Los 15 SWR del MVP (`ALCANCE_MVP.md`) no cambian. Este incremento agrega requisitos del SRS v3.6 que ya estaban aprobados por el equipo y que la guía no exige. Se trata como **incremento adicional**: no entra a las matrices 01–03 ni a los mínimos de pruebas obligatorias, y no sustituye ningún SWR evaluado.

| SWR | Qué hace | Dónde |
| --- | --- | --- |
| SWR-MAS-004 | Editar el nombre de una mascota propia | `PATCH /mascotas/:id`, botón «Editar» en Mascotas |
| SWR-VIA-006 | Editar origen, destino y fecha de salida de un viaje propio | `PATCH /viajes/:id`, botón «Editar viaje» |
| SWR-CHK-003 | Editar la descripción de una tarea | `PATCH /tareas/:id`, botón «Editar» en la tarea |
| SWR-DOC-004 | Editar identificación y vigencia de un documento | `PATCH /documentos/:id`, botón «Editar» en el documento |
| SWR-DOC-007 | Desvincular un documento de una tarea | `DELETE /tareas/:tareaId/documentos/:documentoId`, botón «Desvincular» |
| SWR-SEG-015 / 016 | Señal «Por vencer» junto al documento vinculado; no altera progreso ni estado general | `GET /viajes/:id/tareas` devuelve `porVencer`; regla pura `porVencer` en `backend/src/domain/seguimiento.ts` |

También se muestran los documentos vinculados bajo cada tarea y el seguimiento (estado general, progreso y aviso) quedó al inicio de la página del viaje. Al editar la fecha de salida o desvincular, el seguimiento se recalcula (SWR-SEG-014).

## Supuestos

- Supuesto: el período de anticipación de «por vencer» es de 30 días. No está definido en el alcance actual (DP-16).
- Supuesto: «hoy» es la fecha de calendario de Colombia (`America/Bogota`).
- Supuesto: un documento que vence hoy cuenta como «por vencer» (aún no vencido). Vencido ayer, no.
- Supuesto: al editar un viaje no se cambia su mascota, para no romper los vínculos documento–tarea de la misma mascota.
- Todos los endpoints nuevos exigen sesión y aplican el aislamiento por usuario (404 si el registro es de otra cuenta).

## Sigue fuera de alcance

Lo que antes quedaba pendiente (adjuntos, PDF de reglas, recuperar contraseña, subtareas, plantillas, exportar PDF) se implementó en `INCREMENTO_2.md`.

## Pruebas del incremento

- `backend/src/domain/por-vencer.spec.ts`: 4 pruebas unitarias (`npm run test:unit`).
- `frontend/src/test/incremento.test.tsx`: 6 pruebas RTL (`npm run test:front`).
- Pendiente de ejecutar por el equipo en su máquina; no se ejecutaron en el entorno de desarrollo. Las reglas puras se comprobaron con un script de Node sobre el código compilado.
- No hay casos nuevos de Postman ni Playwright.
