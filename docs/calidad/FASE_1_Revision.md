# Revisión de requisitos de Pet Travel Assistant

Estado: borrador documental. La selección queda pendiente de resolver el conflicto entre el máximo de 15 SWR y el flujo completo solicitado. No se inicia la Fase 2.

## Fuentes contrastadas

- SRS v3.6 en inglés, copia local `SRS_Pet_Travel_Assistant (4) (1).pdf`, 19 páginas. La portada y el control documental indican versión 3.6. SHA-256: `f2de01a6c32cf3706d49bf28d1f8bd9e68b61f55141168d71245dbe383276a0d`.
- `ProyectoFinalCalidad2026.docx`. SHA-256: `b81c327d02bc54777b59ec644c85bee717869080a899349f4bcb31c57d86afc2`.
- Prompt de alcance y ajustes aprobados por el usuario en esta conversación.

Los archivos se encontraron en Descargas; no se modificaron. Las copias del SRS `(4)` y `(4) (1)` son idénticas por hash. Las copias `(2)` y `(3)` también llevan portada v3.6 y los mismos 100 IDs, pero tienen otra paginación; las referencias de las matrices corresponden exclusivamente a la copia de 19 páginas identificada arriba.

El SRS describe un producto más amplio, con cambios CC-01 a CC-04. El alcance de esta entrega es un subconjunto, conforme al punto 2 de la actividad y a las exclusiones expresas del usuario. No se implementan los puntos 14, 15.2 ni 17–26. El trabajo en rama y los commits convencionales siguen siendo instrucciones independientes del proyecto.

## Hallazgo que impide cerrar la selección

La actividad exige seleccionar entre 8 y 15 requisitos de software conservando los IDs originales. El SRS contiene 100 SWR atómicos; las acciones del prompt no equivalen a 15 de esos IDs.

Por ejemplo, agregar una tarea, asignarle pendiente y permitir cambiar su estado corresponden respectivamente a `SWR-CHK-001`, `SWR-CHK-002` y `SWR-CHK-004`. Registro e inicio de sesión son `SWR-ACC-001` y `SWR-ACC-002`; su aislamiento es `SWR-ACC-003`. Las reglas de seguimiento se distribuyen en `SWR-SEG-001` a `SWR-SEG-014`.

La propuesta de flujo completo registra 40 SWR: 34 funcionales y 6 de datos o restricciones. Es una propuesta de selección, no una autorización para exceder el máximo de la actividad. No se agrupan IDs ni se etiquetan obligaciones explícitas del SRS como supuestas reglas derivadas para ocultar el número.

| Grupo | IDs de la propuesta completa | Cantidad |
| --- | --- | ---: |
| Autenticación | ACC-001 a ACC-003 | 3 |
| Mascotas | MAS-001 a MAS-003 | 3 |
| Viajes | VIA-001 a VIA-005 | 5 |
| Documentos | DOC-001, DOC-002, DOC-003, DOC-005, DOC-006 | 5 |
| Checklist | CHK-001, CHK-002, CHK-004, CHK-005 | 4 |
| Seguimiento | SEG-001 a SEG-014 | 14 |
| Datos | DATA-001 a DATA-003 | 3 |
| Restricciones | CON-002 a CON-004 | 3 |
| Total | Todos con prefijo original SWR- | 40 |

La hoja `Alternativas` propone una reducción concreta a 15 IDs: ACC-001/002/003, MAS-001/002/003, VIA-001/002/003/004/005 y CHK-001/002/004/005. Conserva autenticación y tres módulos funcionales, pero retira documentos y seguimiento. Por tanto, no satisface el flujo original y solo puede adoptarse con autorización expresa de reducción y revisión de sus dependencias de datos.

La decisión pendiente es conservar el flujo y ampliar la selección, con el acuerdo docente correspondiente al exceder 15, o autorizar una reducción explícita. En las matrices, `Pendiente - propuesto` no significa `Sí`, implementado ni aprobado por el docente.

## Contenido de las matrices

1. `01_Alcance_y_Trazabilidad.xlsx`: inventario íntegro de 100 SWR, texto original, módulo, SYS, STK, BR, propuesta de inclusión, alternativa de 15, justificación y criterio propuesto. Incluye decisiones, supuestos y fuentes con hash.
2. `02_Verificacion_Requisitos.xlsx`: análisis documental de los 40 candidatos sobre formulación, claridad, singularidad, factibilidad y verificabilidad, con observación, ajuste propuesto y criterio de comprobación. Se analiza el SRS original; los ajustes no lo modifican automáticamente.
3. `03_Validacion_Requisitos.xlsx`: justificación por candidato de su contribución a la necesidad del responsable de la mascota y a BR-01. Es validación documental de pertinencia; no sustituye validación empírica con usuarios ni pruebas de software.

Las exclusiones se distinguen del SRS completo: no incorporar las funciones de esta entrega no significa que hayan sido retiradas del documento fuente. No se afirma cumplimiento completo de SWR-SEC-001: su protocolo exige adjuntos y PDF de reglas, excluidos aquí. El aislamiento de los recursos incluidos se comprobará mediante SWR-ACC-003.

## Trazabilidad pendiente de precisar

El Anexo A muestra ACC como capacidad habilitadora de SYS-01 y BR-01, sin un STK explícito. La actividad exige la cadena SWR → SYS → STK → BR. Las matrices conservan esta ausencia; proponen documentar su relación habilitadora con STK-01, STK-02 y STK-03. No se inventa un requisito de stakeholder ni se presenta la relación propuesta como texto original.

Las restricciones CON se originan en el alcance y los supuestos del SRS; tampoco tienen una cadena SYS/STK explícita. Su relación protectora con BR-01 está marcada como propuesta. Estos puntos requieren aceptación documental antes de afirmar trazabilidad completa.

## Ajustes incorporados y decisiones de diseño

- Registro: incluir `POST /auth/register` por SWR-ACC-001. Correo y contraseña son los datos aprobados para DP-01/DP-02; bcrypt para hash y JWT emitido/verificado por NestJS.
- Estados de tarea: pendiente, completa y requiere revisión. Una nueva tarea nace pendiente.
- Comparación de documentos vinculados: vencimiento anterior a salida genera advertencia; igual genera revisión sin advertencia de fecha; posterior no genera advertencia de fecha. Vigencia desconocida genera advertencia de revisión y sin vencimiento no genera advertencia de fecha.
- Prioridad general: Sin elementos → Requiere revisión → Con pendientes → Checklist completo. La revisión documental por igualdad debe influir en el seguimiento, sin cambiar automáticamente el estado manual de la tarea.
- Solo se evalúan documentos vinculados a tareas del viaje y de su misma mascota. Registros de otros usuarios son inaccesibles. Documentos no vinculados no generan advertencias del viaje.
- Aviso visible previsto: «Checklist completo no significa autorización para viajar».
- No se añaden endpoints de edición ni desvinculación por defecto: VIA-006, DOC-004, DOC-007, MAS-004 y CHK-003 no están seleccionados en esta propuesta. SEG-014 se recalcula al consultar y tras las mutaciones incluidas; no autoriza por sí solo esas funciones de edición.

Supuesto: el SRS no define redondeo de progreso. No está definido en el alcance actual. Se propone un decimal, redondeo al más cercano, conservando el cociente sin redondear en el cálculo. Ejemplos: 1/3 = 33,3% y 2/3 = 66,7%. El estado general se decide por sus condiciones, nunca por un porcentaje redondeado. Checklist vacío muestra «Sin elementos», sin porcentaje.

Supuesto: la identificación del documento será un único campo de texto. No está definido en el alcance actual (DP-12). No se agregan campos de emisor, número separado, país o tipo.

Supuesto: las comparaciones usan fechas de calendario sin hora ni desplazamiento de zona. DP-10 sigue abierto: se propone distinguir listas de tareas pendientes y tareas que requieren revisión.

Sesión: se propone un único origen público. El navegador llama a `/api` en Next.js; el proxy reenvía a NestJS sin trasladar lógica de dominio. NestJS registra, autentica, emite JWT, configura la cookie y autoriza los recursos. Bajo esa topología se usa cookie HttpOnly, SameSite y Secure en producción, con protección de origen/CSRF para escrituras. Si frontend y API no comparten origen, la estrategia acordada será Bearer en Authorization y se documentará su tratamiento de sesión antes de implementarla. No se expondrán tokens en logs ni fixtures.

Conexión de datos: `.env.example` se creará en Fase 2 con `DATABASE_URL` para pooler y `DIRECT_URL` para migraciones, sin valores reales. Se confirmarán el modo del pooler y la compatibilidad de la versión de Prisma al configurar el entorno. Solo NestJS accede a PostgreSQL de Supabase mediante Prisma.

## Plantilla fijada antes de incorporar archivos

- Repositorio: https://github.com/TailAdmin/free-nextjs-admin-dashboard
- Referencia exacta: https://github.com/TailAdmin/free-nextjs-admin-dashboard/tree/b1676038f01bd31c97d0b658eea29573ca5cdcd8
- Versión declarada en `package.json`: 2.5.0. El changelog del mismo commit anuncia 2.5.1; se fija el commit para evitar ambigüedad. No hay una release publicada en la página de releases consultada.
- Licencia de la versión gratuita: MIT; conservar sus avisos al incorporar componentes.
- Reutilización prevista: sidebar y layout responsive, cards, tablas, formularios, inputs, botones y alertas. La cabecera y la navegación se limitan al alcance aprobado. Se preservan estructura, espaciados y estilo.
- Referencia visual gratuita: https://nextjs-free-demo.tailadmin.com

No se incorporó código de TailAdmin en Fase 1. La ficha de marca y el SVG original corresponden a Fase 2.

## Contraste de colores

Se calculó luminancia relativa sRGB y razón `(L_mayor + 0,05) / (L_menor + 0,05)` para colores planos:

| Texto | Fondo | Razón |
| --- | --- | ---: |
| #334155 | #F59E0B | 4,82:1 |
| #B45309 | #FFFFFF | 5,02:1 |
| #FFFFFF | #0F766E | 5,47:1 |

Las tres combinaciones superan 4,5:1. Ámbar se limita a fondo/borde con texto oscuro; #B45309 puede usarse como texto sobre blanco. Esto verifica las parejas de colores propuestas, no el contraste de todos los componentes, estados, opacidades o fondos de la aplicación aún no implementada.

## Estado de las pruebas y siguiente paso

No se ejecutaron pruebas de la aplicación porque aún no existe implementación. Las comprobaciones de Fase 1 corresponden a integridad y presentación de las hojas, conservación de IDs y trazabilidad documental. No se registran PASS de aplicación.

Se espera la decisión de alcance para cerrar las tres matrices. Después de cerrar Fase 1 se esperará «continúa» antes de iniciar Fase 2.
