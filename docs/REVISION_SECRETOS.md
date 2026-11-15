# Revisión de secretos

Se revisaron el árbol de trabajo, los archivos versionados y los blobs alcanzables de todas las ramas Git, incluidos los XML contenidos en los Excel. La búsqueda cubrió URLs PostgreSQL con credenciales literales, JWT completos, tokens de proveedor, claves privadas y asignaciones literales de contraseñas/tokens en código, pruebas y Postman. Los matches de mensajes de validación y autocomplete se revisaron como falsos positivos. La revisión final no detectó credenciales reales.

No se abrió el contenido de `.env` para inspección. Se comprobó que no está versionado ni aparece como archivo de entorno real en el historial. La aplicación y las comprobaciones lo cargan mediante su proceso normal de configuración. Los errores de conexión se redactan antes de imprimirlos.

`.gitignore` excluye `.env`, variantes locales, claves PEM/KEY/P12/PFX, dependencias, builds, logs y reportes/trazas pesadas. Los ejemplos `.env.example` se conservan con valores vacíos. No hay logs, trazas ni claves privadas versionados; el environment Postman solo contiene baseUrl. Las contraseñas y tokens de las pruebas se generan en memoria, no se incrustan ni exportan.

El SQL nuevo `backend/prisma/bootstrap.sql` contiene únicamente DDL. El archivo no versionado del equipo `backend/schema.sql` fue preservado, sin modificar ni incorporar al commit. No se reescribió historial ni se hizo push.
