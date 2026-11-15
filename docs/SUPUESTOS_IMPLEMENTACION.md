# Supuestos de implementación

Decisiones actualizadas por el usuario. Este documento sustituye las propuestas anteriores de sesión con cookies y progreso con un decimal.

- Supuesto: autenticación JWT por `Authorization: Bearer`, sin cookies, proxy de sesión ni CSRF. El frontend conserva el token en `sessionStorage` de la pestaña y lo elimina al salir o recibir 401. No está definido en el alcance actual del SRS. La API valida firma HS256, expiración, emisor, audiencia y existencia del usuario. La protección del frontend es un control de navegación; NestJS aplica la autorización efectiva. El almacenamiento del token es accesible a JavaScript, por lo que requiere evitar inyección de scripts; no usar HTML del usuario. Sesión de una hora sin recuperación ni renovación automática.
- Supuesto: mostrar el progreso como entero redondeado al más cercano; usar tareas completas / total × 100. No está definido en el alcance actual el redondeo. Nunca decidir el estado general por el porcentaje redondeado. Checklist vacío: «Sin elementos», sin porcentaje.
- Supuesto: contraseña mínima de 8 caracteres y máxima de 72 bytes UTF-8 por límite de bcrypt. No está definido en el alcance actual. Correo se normaliza con trim y minúsculas. La contraseña no se recorta, guarda ni imprime como texto plano.
- Identificación de documento: Supuesto: un único campo de texto. No está definido en el alcance actual.
- Fechas: Supuesto: fechas de calendario YYYY-MM-DD sin hora ni conversión de zona. No está definido en el alcance actual el tratamiento técnico de zonas.
- Supuesto: mostrar una sola advertencia por documento aunque esté vinculado a varias tareas del viaje. No está definido en el alcance actual el tratamiento de avisos duplicados; no se altera la evaluación de vigencia ni el estado de las tareas.

`DATABASE_URL` corresponde al pooler de Supabase para ejecución; `DIRECT_URL` a la conexión de migraciones. Se configuran únicamente en `backend/.env`, junto con `JWT_SECRET`. NestJS y los comandos Prisma cargan esa ubicación; el frontend no recibe esas variables. Solo NestJS usa Prisma; el frontend llama únicamente a su API. `npm run db:check` verifica ambas conexiones sin mostrar sus valores. `npm run db:migrate:dev` invoca Prisma Migrate Dev sin aceptar reset ni pérdida de datos.

Plantilla gratuita TailAdmin, licencia MIT. Versión declarada 2.5.0; changelog 2.5.1; commit fijo `b1676038f01bd31c97d0b658eea29573ca5cdcd8`. Referencia: https://github.com/TailAdmin/free-nextjs-admin-dashboard/tree/b1676038f01bd31c97d0b658eea29573ca5cdcd8

Se reutilizan primitivas originales, tokens CSS, tarjetas y estructura del sidebar de 290px. Adaptaciones: logo, paleta, navegación del dominio, idioma español, retirada de la persistencia de sidebar por cookie. Las pantallas demo, otros idiomas, selector de tema y funciones externas quedan fuera del producto.
