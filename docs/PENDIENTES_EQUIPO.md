# Acciones manuales y sustentación

## Conexión real

Resolver acceso TLS/pooler sin publicar credenciales. Revisar la CA de Database Settings, el endpoint Connect y restricciones de red. Repetir `npm run db:check` y `npm run verify:supabase`; este último ejecuta el recorrido y limpia sus propios datos. No ejecutar migrate deploy/dev sobre la Supabase ya creada por SQL.

## Diez casos de caja negra

Abrir `docs/calidad/05_Caja_Negra_Navegador/Casos_Manuales.xlsx`. Ejecutar CN01–CN10 solo en navegador, sin Postman ni lectura de código. Completar obtenido, PASS/FAIL y evidencia después de cada caso. Usar datos ficticios y cuentas propias; no publicar contraseñas o tokens en capturas. No marcar PASS antes de ejecutar.

## Sesión exploratoria

En `docs/calidad/12_ISO25010.xlsx`, hoja Exploratoria, registrar participante, fecha, entorno, objetivo/recorrido y cada hallazgo con pasos, datos, esperado, obtenido, característica ISO y evidencia. Recorrer todos los módulos. No inventar hallazgos ni confundir esta sesión con las suites automáticas.

## Capturas

Tomar capturas con datos ficticios, sin `.env` ni panel de red:

| Pantalla o evidencia | Tamaño |
| --- | --- |
| TailAdmin original, con su URL de referencia | 1440 × 1000 |
| Registro/login y error de credencial sin mostrar contraseña | 1440 × 1000 |
| Mascotas y creación/listado de viajes | 1440 × 1000 y 390 × 844 |
| Checklist vacío: Sin elementos sin porcentaje | 1440 × 1000 |
| Tareas pendiente, completa y requiere revisión; progreso | 1440 × 1000 y 390 × 844 |
| Documento con fecha, sin vencimiento y desconocida; vínculo | 1440 × 1000 y 390 × 844 |
| Vencido vinculado: advertencia y Requiere revisión | 1440 × 1000 y 390 × 844 |
| Igual a salida: revisión sin advertencia de fecha | 1440 × 1000 |
| Checklist completo, 100% y aviso de no autorización | 1440 × 1000 y 390 × 844 |
| Reporte Playwright y resultados de suites | Escritorio, texto legible |

Usar varias capturas si no cabe toda la pantalla; relacionarlas con el caso manual correspondiente. Las imágenes técnicas del asistente no sustituyen las capturas del equipo.

## Qué estudiar

1. Los 15 SWR y sus cadenas SYS → STK → BR; exclusión de los otros 85; diferencia entre verificación y validación de requisitos.
2. Next.js → NestJS → Prisma → Supabase; DTO, guard, servicios y reglas puras; por qué el frontend no accede a BD.
3. Registro/login, bcrypt y límite de 72 bytes, JWT Bearer, sessionStorage, expiración y aislamiento entre cuentas.
4. Progreso entero, checklist vacío, solo documentos vinculados, fronteras de vigencia, prioridad de estado y aviso. Un porcentaje redondeado a 100 no decide completitud.
5. Ejecutar y explicar las 8 unitarias y Arrange–Act–Assert. Explicar los 3 bloques de caja blanca, sus caminos, fronteras y defectos ocultos por probar solo el caso correcto.
6. Explicar R01, R07 y R10 de RTL: imports, mocks, render, screen, userEvent, expect y espera asíncrona.
7. Mostrar los 8 casos Postman y assertions Post-response; diferenciar requests principales de preparación y explicar rechazo 400 entre mascotas.
8. Explicar E03 y E04: goto, locators, acciones, expect, auto-waiting, datos independientes, HTML y trazas. Hay cinco casos y tres recorridos completos.
9. Las nueve características ISO 25010:2023: mecanismo real, ruta de evidencia y límites. No confundir mecanismos con certificación o resultados exploratorios inexistentes.
10. Diferenciar SQL de migrate diff/SQL Editor, historial Prisma y base temporal de pruebas. Explicar la limpieza acotada de la verificación real.

Las guías están en `docs/calidad/06_Pruebas_Unitarias` a `10_Playwright`. Esta lista de estudio responde a tu petición actual; no amplía los módulos ni añade los demás entregables excluidos.

## Git

El merge solicitado es local. Revisar main y confirmar explícitamente cuándo hacer push; no se publicó durante esta entrega.
