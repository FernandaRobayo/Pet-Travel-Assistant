# Cinco pruebas Playwright

Fuente: `e2e/flujo.spec.ts`. `npm run test:e2e` requiere web/API/BD iniciados; `npm run test:local` prepara PostgreSQL temporal y ejecuta todas las suites. Requiere Chrome. Resultado final 5/5.

E01: ruta protegida sin sesión; E02: credencial incorrecta; E03: flujo completo sin advertencias; E04: flujo completo vencido en móvil; E05: igualdad exige revisión sin advertencia de fecha.

## E03 A nivel de código

`account(request)` registra por API una cuenta única con randomUUID y contraseña aleatoria de memoria; comprueba 201. No hay credenciales incrustadas ni storageState exportado.

`login(page,...)` usa `page.goto('/login')`; `getByLabel` y `fill` completan credenciales; `getByRole` pulsa Ingresar. La expectativa del heading Mascotas espera la navegación y contenido.

`trip(page)` registra Luna desde navegador y espera el mensaje con status filtrado por texto, evitando confundir Cargando. Navega mediante el enlace Viajes, completa campos, selecciona mascota con `selectOption`, guarda y abre checklist. Comprueba Sin elementos.

`task(page)` agrega una tarea y verifica `toHaveValue('pendiente')`; después selecciona completa y espera estado general.

`document(page,'2027-02-02')` registra identificación y vencimiento posterior a salida, selecciona documento/tarea por label, pulsa Vincular y espera confirmación real.

Las expectativas finales comprueban Checklist completo, 100% y aviso de no autorización. Los locators y expect usan auto-waiting, sin waitForTimeout.

## E04 A nivel de código

`setViewportSize({width:390,height:844})` fija móvil. Se crea otra cuenta, se inicia sesión y registra mascota. El botón Abrir o cerrar menú abre el sidebar; el enlace Viajes navega y el menú se cierra al cambiar ruta.

Los locators por label completan viaje, salida 2027-02-01 y mascota. `task(page)` agrega y completa la tarea; `document(page,'2027-01-31')` registra y vincula vencimiento un día anterior.

La prueba espera status Requiere revisión y region Advertencias con el motivo. Compara scrollWidth con innerWidth para detectar desbordamiento. Las fechas se comparan con salida, no con hoy. Las cuentas y datos son independientes entre ejecuciones.

## Reporte y trazas

El HTML se genera en `playwright-report/`. La configuración conserva trace y captura solo en fallo. La última ejecución pasó y no deja trazas de fallo. No versionar ni compartir trazas sin depurar: pueden contener datos de sesión. Dos locators ambiguos fallaron inicialmente; se corrigieron y la suite se repitió. No se presenta aquella ejecución fallida como aprobada.
