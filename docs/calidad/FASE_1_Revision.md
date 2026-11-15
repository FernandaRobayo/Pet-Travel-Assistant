# Revisión de requisitos

Alcance cerrado: los 15 SWR enumerados en `docs/ALCANCE_MVP.md`. La propuesta de 40 y la alternativa que excluía documentos/seguimiento quedan descartadas.

La matriz 01 conserva los 100 IDs originales: 15 «Sí» y 85 «No - fuera del MVP». Las 02 y 03 revisan exclusivamente los 15 seleccionados. Los textos originales están separados de los ajustes y supuestos.

Fuentes: SRS v3.6 en inglés, copia local de 19 páginas `SRS_Pet_Travel_Assistant (4) (1).pdf`; actividad `ProyectoFinalCalidad2026.docx`; cierre del usuario del 15/11/2026. Los hashes originales se conservan en la hoja Fuentes. Los documentos fuente no se modificaron.

La cadena de autenticación se obtiene transitivamente de SWR-ACC → SYS-01 → STK-01/02/03 → BR-01, según §4.2/4.3. La condición habilitadora del Anexo A se conserva como contexto.

Decisiones vigentes: JWT Bearer sin cookies; identificación documental en un solo texto; progreso entero redondeado; fechas de calendario; anterior a salida advierte, igual exige revisión sin advertencia de fecha y posterior no genera advertencia de fecha. Véase `docs/SUPUESTOS_IMPLEMENTACION.md`.

Los resultados reales están en `resultados-automatizados.json`. Las hojas de caja negra y exploratoria se entregan sin ejecutar; obtenido, PASS/FAIL y evidencia permanecen en blanco.
