# Enmienda propuesta a la constitución (v1.4.0 → v1.5.0)

Se aplica con `/speckit-constitution` como **primera tarea** de `tasks.md`, antes de escribir código. Tipo de cambio: MINOR (principios ampliados, ninguno eliminado).

## Principio IV — Seguridad y privacidad (@Agent-SecOps)

**Sustituir** el último punto:

> - Lo que no es la web no se publica: herramientas (`admin.*`, `scripts/`, páginas de revisión), fotos originales y copias privadas. `npm run publicar` genera `dist/` solo con los archivos permitidos.

**por**:

> - Lo que no es la web no se publica: herramientas (`admin.*`, `scripts/`, páginas de revisión), fotos originales y copias privadas. `npm run publicar` genera `dist/` solo con los archivos permitidos.
> - **Panel online (única excepción)**: `panel/` y `/api/admin/*` se sirven únicamente tras comprobar en el servidor una identificación válida de Cloudflare Access (JWT con `iss`, `aud` y caducidad verificados en cada petición). Sin identificación válida responden 403 sin leer datos. No hay contraseñas propias, no se enlazan desde la web pública, llevan `noindex` y no figuran en el sitemap. Las operaciones que cambian estado exigen comprobación de origen y límite de frecuencia, y registran quién y cuándo.
> - **Fotos de prendas**: nunca son recursos estáticos públicos; salen de un almacén privado a través del Worker, que solo las entrega si prenda y foto están visibles. Ocultar es *fail closed*: ante un fallo o una duda sobre el estado se trata como oculta y la respuesta es indistinguible de «no existe». La portada, el fondo del bloque de contacto y la vista previa al compartir (`og-cover`) son imágenes estáticas elegidas en local y quedan fuera de esta gestión.
> - **Secretos y datos de cuenta**: el nombre del equipo de Access, el AUD, los identificadores de D1/R2 y la cuenta de Cloudflare no se guardan en el repositorio (`wrangler secret` y `wrangler.jsonc` ignorado por git).
> - «Cero recursos de terceros» sigue aplicando a los visitantes. Solo la persona que administra interactúa con la página de acceso de Cloudflare Access.

## Principio VI — Simplicidad (@Agent-Architect)

**Sustituir** la primera línea:

> - HTML + CSS + JavaScript sin framework ni paso de build para la web. Node.js solo para las herramientas de desarrollo (optimizar imágenes, servidor local, verificar, publicar).

**por**:

> - HTML + CSS + JavaScript sin framework ni paso de build para la web y para el panel. Node.js solo para las herramientas de desarrollo (optimizar imágenes, servidor local, verificar, publicar, subir imágenes, pruebas).
> - **Un único Worker** (`worker/`, JavaScript plano con módulos ES, **sin dependencias de ejecución**) es la única parte con servidor: valida identidad, guarda el estado de visibilidad y entrega las fotos. Wrangler lo empaqueta; el proyecto no define ningún paso de build propio.

## Restricciones técnicas

**Sustituir**:
> - **Herramientas:** Node.js ≥ 18.17 y `sharp` (devDependency) para las imágenes.

**por**:
> - **Herramientas:** Node.js ≥ 18.17, `sharp` (devDependency) para las imágenes y `wrangler` (devDependency) para desplegar y probar el Worker en local.
> - **Servicios:** Cloudflare Workers, D1 y R2 en plan gratuito, y Cloudflare Access para la identidad. Despliegue siempre con `wrangler deploy -c wrangler.jsonc` (nunca autoconfiguración).

## Flujo de trabajo y puertas de calidad

**Añadir** a la lista de puertas: `npm test` (`node --test`) sin errores.

## Principio III — Rendimiento

**Añadir**: «Las fotos de prendas se sirven con `Cache-Control: public, max-age=30` y `ETag` (no `immutable`), para que ocultar una foto surta efecto en menos de un minuto. Los recursos estáticos siguen con caché larga.»

## Motivo
El usuario quiere activar y desactivar fotos desde cualquier sitio, incluido el móvil, con acceso seguro y sin volver a publicar. Es imposible sin un servidor mínimo; la enmienda lo acota al mínimo necesario y mantiene intactos los principios I, II y V.
