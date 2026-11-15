# Ocho casos Postman

Importar colección y environment de `postman/`. Ejecutar en orden con API disponible o `npm run test:api`. No exportar variables de ejecución: correo, contraseña y token se generan en memoria. El environment versionado solo contiene baseUrl.

| Caso | SWR | Resultado |
| --- | --- | --- |
| P01 | ACC-001 | Registro 201 |
| P02 | ACC-002 | Login 200, token tipo string |
| P03 | ACC-002 | Credencial incorrecta 401 |
| P04 | SEG-002 | Vacío, progreso null, Sin elementos |
| P05 | CHK-001 | Tarea nueva pendiente |
| P06 | SEG-005 | Vencido vinculado advierte con motivo |
| P07 | SEG-005 / SYS-03 | Igualdad revisa sin advertencia de fecha |
| P08 | DOC-005 | Otra mascota rechazada con 400 |

Resultado: 8 casos, 14 assertions, sin fallos. Cinco casos son de dominio. Newman informa 18 requests HTTP porque 10 preparan datos en Pre-request; no se cuentan como casos adicionales. Las assertions están en Post-response. Ejecución registrada: PostgreSQL 16 temporal, no Supabase.

P01 genera una contraseña aleatoria Unicode de exactamente 72 bytes; P02 verifica que se acepta. P03 agrega un carácter a esa contraseña para superar el límite de bcrypt conservando el mismo prefijo: debe rechazarse con 401, sin aceptar truncamiento. No hay valores de contraseña incrustados o exportados. La credencial incorrecta de longitud normal también se verifica en E02.
