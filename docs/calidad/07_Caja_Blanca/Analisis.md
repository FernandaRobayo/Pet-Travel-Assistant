# Tres bloques de caja blanca

Código: `backend/src/domain/seguimiento.ts`. Las pruebas citadas cuentan dentro de las 8 unitarias.

## Bloque 1 Evaluación de vigencia

Decisión: modalidad y comparación estricta de vencimiento con salida.

| Camino | Datos | Prueba |
| --- | --- | --- |
| Sin vencimiento | sin_vencimiento, fecha null | U04 |
| Desconocida | desconocida, fecha null | U04 |
| Fecha ausente | modalidad fecha, null | U02 |
| Fecha imposible | 2027-02-30 | U02 |
| Anterior | 2027-01-31 frente a salida 2027-02-01 | U02/U05 |
| Igual | ambas 2027-02-01 | U03/U08 |
| Posterior | 2027-02-02 frente a salida 2027-02-01 | U02 |

Frontera: igualdad exacta. Caminos sin prueba explícita: salida mal formada y vencimiento con formato abreviado. No se atribuye cobertura instrumental. Con solo el caso posterior podría ocultarse un `<=` que convierta igualdad en advertencia o confundir desconocida con sin vencimiento.

## Bloque 2 Estado general

Decisión: primera condición verdadera; nunca usar porcentaje redondeado.

| Camino | Datos | Prueba |
| --- | --- | --- |
| Sin elementos | [] | U06/U01 |
| Tarea en revisión | pendiente y requiere_revision | U06 |
| Advertencia | completa y advertencia documental | U06 |
| Revisión por igualdad | completa y revisión documental | U06/U08 |
| Con pendientes | pendiente sin revisión/advertencias | U06/U08 |
| Completo | todas completas sin advertencias | U06 |

Fronteras: 0 tareas, última pendiente y 199/200 redondeado a 100%. Todas las ramas funcionales enumeradas tienen expectativas. No se prueba estado arbitrario fuera del enum: DTO y PostgreSQL lo impiden. Sin casos negativos, un cambio de prioridad podría declarar completo un viaje con advertencias.

## Bloque 3 Vínculo

Decisión: primero cuenta, después mascota.

| Camino | Datos | Prueba |
| --- | --- | --- |
| Otra cuenta | u2 frente a u1 | U07 |
| Otra mascota | misma cuenta, p2 frente a p1 | U07 y P08 |
| Válido | misma cuenta y mascota | U07 y E03/E04/E05 |

Frontera: igualdad de IDs. Combinación sin prueba unitaria explícita: cuenta y mascota diferentes simultáneamente; debe prevalecer la primera rama. Inexistencia de registros se trata en el servicio, fuera de esta función. Solo probar el vínculo correcto ocultaría una omisión de la validación de mascota.
