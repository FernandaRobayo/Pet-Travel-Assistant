# Alcance del MVP

Se seleccionan exactamente 15 SWR originales del SRS v3.6. Se descartan las propuestas anteriores de 40 y de retirar documentos/seguimiento.

| Módulo | SWR seleccionados |
| --- | --- |
| Autenticación | SWR-ACC-001, SWR-ACC-002, SWR-ACC-003 |
| Mascotas | SWR-MAS-001 |
| Viajes | SWR-VIA-001, SWR-VIA-002, SWR-VIA-003 |
| Checklist | SWR-CHK-001, SWR-CHK-004 |
| Documentos | SWR-DOC-001, SWR-DOC-002, SWR-DOC-005 |
| Seguimiento | SWR-SEG-002, SWR-SEG-005, SWR-SEG-013 |

Las consultas necesarias para seleccionar registros propios y presentar el flujo son soporte de estas operaciones. Las reglas de aceptación del prompt y SYS-03 se aplican dentro de los 15 seleccionados: estado inicial pendiente; vacío sin porcentaje; evaluación solo de documentos vinculados; fecha anterior/igual/posterior; vigencia desconocida/sin vencimiento; prioridad de estado; misma mascota y aviso de no autorización. No se crean nuevos IDs para esos criterios.

Los otros 85 SWR aparecen como «No - fuera del MVP» en la matriz 01. No se agregan adjuntos, reglas del transportador, por vencer, perfiles ampliados, plantillas, subtareas, PDF, semáforo, recuperación de contraseña, notificaciones, IA, integraciones externas ni roles.

Para autenticación, la trazabilidad usa su origen SYS-01 (§5.1), las relaciones de SYS-01 a STK-01/02/03 (§4.3) y su origen BR-01 (§4.2). El Anexo A identifica autenticación como habilitador; la relación transitiva no inventa un stakeholder nuevo. Los ajustes no modifican el SRS original y la validación documental no equivale a una sesión con participantes.

Incremento adicional posterior al alcance evaluado: ver `INCREMENTO_EXTRA.md`. No modifica los 15 SWR ni las matrices 01–03.

Incremento 2 (47 SWR restantes del SRS): ver `INCREMENTO_2.md`. Tampoco modifica los 15 SWR evaluados ni las matrices 01–03.
