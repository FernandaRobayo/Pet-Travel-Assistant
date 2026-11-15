# Verificación de Supabase

El archivo `.env` no se abrió para inspección ni se imprimieron sus valores. Lo carga el proceso normal de dotenv/Prisma. La comprobación usa exclusivamente DATABASE_URL; no contacta DIRECT_URL ni ejecuta migrate deploy, migrate dev, reset o DDL contra Supabase.

## Resultado real

Conexión no conseguida. Excepción original, sin credenciales:

```text
PrismaClientInitializationError
Invalid `prisma.$queryRaw()` invocation:

Can't reach database server at `aws-0-us-east-2.pooler.supabase.com:6543`

Please make sure your database server is running at `aws-0-us-east-2.pooler.supabase.com:6543`.
```

No se obtuvo un código Prisma adicional. DNS resolvió correctamente y TCP al puerto 6543 conectó. PostgreSQL aceptó SSLRequest, pero TLS con validación de certificado falló con `SELF_SIGNED_CERT_IN_CHAIN`.

Inferencia: hay un problema de confianza en la cadena de certificados o en su ruta de red, como CA no configurada o inspección TLS. Esto no prueba que sea la causa única del mensaje genérico de Prisma 6, ni confirma o rechaza la contraseña. Revisar la CA oficial desde Database Settings, el endpoint de Connect y restricciones de red. No se desactivó validación TLS.

Fuentes oficiales: [conexión Postgres](https://supabase.com/docs/guides/database/connecting-to-postgres), [SSL](https://supabase.com/docs/guides/platform/ssl-enforcement), [restricciones de red](https://supabase.com/docs/guides/platform/network-restrictions) y [Prisma 6](https://docs.prisma.io/docs/orm/v6/overview/databases/postgresql).

## Recorrido y limpieza

`npm run verify:supabase` se ejecutó y se detuvo en el primer SELECT 1. Resultado: connected=false, apiConnected=false, flowCompleted=false y createdTestAccount=false. No se crearon datos en Supabase; no hay datos de esa ejecución que limpiar.

El script permite repetir el recorrido cuando conecte. Genera credenciales en memoria, opera mediante HTTP y elimina únicamente la cuenta efímera y sus relaciones en una transacción. No borra por prefijo ni elimina otros usuarios. Si la limpieza falla, lo informa.

Las suites anteriores se ejecutaron en PostgreSQL temporal, no en Supabase. Las tablas reales existentes se crearon por el equipo mediante SQL Editor con el SQL de migrate diff. No se intentaron migraciones sobre ellas durante esta verificación.
