# Especificación: Publicación en Cloudflare Pages

**Rama**: `009-publicacion-cloudflare` · **Estado**: implementada

## Qué y por qué
La web se despliega en Cloudflare Pages (gratis, CDN, HTTPS). La constitución (IV) exige `npm run publicar` y cabeceras HTTP de seguridad.
También se completa el domicilio del aviso legal (real solo en local, `[DOMICILIO]` en el repo, igual que 007).

## Requisitos
- **FR-001**: `npm run publicar` ejecuta antes `verificar` y, si pasa, genera `dist/` solo con páginas, estilos, scripts, datos, imágenes de portada y de las prendas visibles, fuentes, `robots.txt`, `sitemap.xml` y `_headers`.
- **FR-002**: `dist/` no contiene `admin.*`, `scripts/`, fotos originales, copias privadas, caché ni páginas de revisión.
- **FR-003**: `_headers` fija HSTS, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, COOP y caché larga para `/public/*`.
- **FR-004**: Se despliega subiendo `dist/` desde local (`wrangler deploy --assets dist`, ver 010), NO por integración con GitHub: el repo lleva marcadores y la web publicada necesita los datos reales.
- **FR-005**: El domicilio real no aparece en el repositorio ni en su historial.

## Criterios de éxito
- `dist/` sin marcadores (`[INSTAGRAM]`, `[CORREO]`, `[DOMICILIO]`, `000 000 000`); todas las imágenes referenciadas existen; `verificar` correcto.
