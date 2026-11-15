# Pruebas unitarias

Fuente: `backend/src/domain/seguimiento.spec.ts`. Ejecutar `npm run test:unit`. Son 8 casos sin navegador ni base real, con Arrange (datos), Act (función pura) y Assert (expectativas); un caso puede verificar varias fronteras de la misma regla.

| Prueba | SWR | Datos y resultado |
| --- | --- | --- |
| U01 | SEG-002 | Vacío → null; 1/3 → 33; 1/1 → 100 |
| U02 | SEG-005 | Anterior advierte; posterior no; fecha inválida/ausente rechaza |
| U03 | SEG-005 / SYS-03 | Igualdad: revisión sin advertencia de fecha |
| U04 | DOC-002, SEG-005 | Desconocida advierte; sin vencimiento no |
| U05 | DOC-005, SEG-005 | No vinculado no se evalúa; no duplica avisos |
| U06 | SEG-013 / SYS-03 | Prioridad de los cuatro estados generales |
| U07 | DOC-005, ACC-003 | Misma cuenta/mascota; otra cuenta; otra mascota |
| U08 | SEG-002/013 | 199/200 puede mostrar 100%, pero sigue Con pendientes; igualdad exige revisión |

Resultado final ejecutado: 8/8. El redondeo no decide si el checklist está completo.
