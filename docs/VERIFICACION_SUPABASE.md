# Verificación de Supabase

Inicialmente el archivo `.env` solo se cargó mediante dotenv/Prisma. El 15 de noviembre de 2026 el equipo autorizó su modificación e inspección programática para comprobar SSL y sintaxis, sin imprimir valores sensibles. La comprobación de conexión usa exclusivamente DATABASE_URL; no contacta DIRECT_URL ni ejecuta migrate deploy, migrate dev, reset o DDL contra Supabase.

## Reintento SSL autorizado, 15 de noviembre de 2026

1. Se agregó `sslaccept=accept_invalid_certs` a ambas URLs conservando puertos y `pgbouncer=true`. `npm run verify:supabase` falló con la misma excepción reproducida abajo.
2. Se sustituyó por `sslmode=require` en ambas URLs. La verificación falló con la misma excepción.
3. Se solicitó ejecutar el mismo comando en la terminal del equipo para comparar entornos; el resultado está pendiente. No se puede afirmar que falle exclusivamente en el entorno del agente.
4. Se confirmó programáticamente usuario `postgres.svihaljcdisgplkywcwo`, puertos 6543/5432, contraseña presente, sin corchetes, escapes porcentuales válidos y sin caracteres reservados sin codificar detectados. No hay variables heredadas que sustituyan estas URLs. No se imprimieron contraseñas ni URLs completas. Estas comprobaciones no validan la contraseña en el servidor.

La configuración final restaura `sslaccept=accept_invalid_certs`, solo para desarrollo local. La API no llegó a iniciarse en el recorrido porque falló SELECT 1. Ninguno de estos intentos creó datos, por lo que no hubo registros que limpiar. No se hizo push ni se incluyó `.env` en Git.

## Resultado real

Conexión no conseguida. Excepción original, sin credenciales:

```text
PrismaClientInitializationError
Invalid `prisma.$queryRaw()` invocation:

Can't reach database server at `aws-0-us-east-2.pooler.supabase.com:6543`

Please make sure your database server is running at `aws-0-us-east-2.pooler.supabase.com:6543`.
```

No se obtuvo un código Prisma adicional. DNS resolvió correctamente y TCP al puerto 6543 conectó. PostgreSQL aceptó SSLRequest, pero TLS con validación de certificado falló con `SELF_SIGNED_CERT_IN_CHAIN`.

Inferencia de la comprobación inicial: puede existir un problema de confianza en la cadena de certificados o en su ruta de red, como CA no configurada o inspección TLS. Los reintentos posteriores con ambos parámetros SSL tampoco conectaron; no puede atribuirse el fallo genérico de Prisma únicamente a la confianza TLS, ni confirmar o rechazar la contraseña. Revisar el endpoint de Connect, estado del proyecto, restricciones de red y la CA oficial desde Database Settings. En el reintento autorizado sí se permitió omitir la validación del certificado para desarrollo local; no es una configuración de producción.

Fuentes oficiales: [conexión Postgres](https://supabase.com/docs/guides/database/connecting-to-postgres), [SSL](https://supabase.com/docs/guides/platform/ssl-enforcement), [restricciones de red](https://supabase.com/docs/guides/platform/network-restrictions) y [Prisma 6](https://docs.prisma.io/docs/orm/v6/overview/databases/postgresql).

## Recorrido y limpieza

`npm run verify:supabase` se ejecutó y se detuvo en el primer SELECT 1. Resultado: connected=false, apiConnected=false, flowCompleted=false y createdTestAccount=false. No se crearon datos en Supabase; no hay datos de esa ejecución que limpiar.

El script permite repetir el recorrido cuando conecte. Genera credenciales en memoria, opera mediante HTTP y elimina únicamente la cuenta efímera y sus relaciones en una transacción. No borra por prefijo ni elimina otros usuarios. Si la limpieza falla, lo informa.

Las suites anteriores se ejecutaron en PostgreSQL temporal, no en Supabase. Las tablas reales existentes se crearon por el equipo mediante SQL Editor con el SQL de migrate diff. No se intentaron migraciones sobre ellas durante esta verificación.
