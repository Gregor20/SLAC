# Contrato: interfaz pública (sin identificación)

Dos rutas pasan por el Worker para los visitantes. Ambas son de solo lectura (`GET`/`HEAD`); cualquier otro método → 405. Ninguna usa cookies ni acepta parámetros: lo que llega en la URL fuera del patrón se ignora o da 404.

## `GET /api/prendas.js`

Script clásico con las prendas y fotos **visibles** (consulta `visibilidad.js`).

**Respuesta 200** · `Content-Type: application/javascript; charset=utf-8` · `Cache-Control: no-cache` · `ETag: "<version>"` (304 con `If-None-Match`) · cabeceras de seguridad del proyecto.

```js
PRENDAS.push(
  { id: "001", descripcion: "…" },
  { id: "003", descripcion: "…" }
);
const FOTOS_OPT = {
  base: "/f/",
  anchos: [160, 480, 800, 1200],
  anchosAvif: [480, 800, 1200],
  prendas: {
    "001": [[1200, 1600, 1], [1200, 1600, 3]],   // [ancho, alto, n original]: aquí la foto 2 está oculta
    "003": [[1200, 1359, 1], [960, 1200, 2]]
  }
};
```

Reglas:
- `PRENDAS` debe existir antes (`data/galeria.js` publicado declara `const PRENDAS = [];`).
- Solo aparecen prendas con al menos una foto visible, en el orden de la galería.
- Los textos de `descripcion` se escapan al generar el script (JSON seguro; `</script>` y U+2028/2029 neutralizados).
- **Fallo del estado**: último estado correcto si tiene < 60 s; si no, el script contiene `FOTOS_OPT` con `prendas: {}` y no añade nada a `PRENDAS`; `Cache-Control: no-store`. Siempre 200 (un script que falla dejaría la página sin datos).
- Orden de scripts en `index.html`: `data/galeria.js`, `api/prendas.js`, `lib.js`, `visor.js`, `app.js` (todos `defer`).

> En local (`scripts/servidor.js`) la misma ruta devuelve `data/fotos-optimizadas.js`, que declara `FOTOS_OPT` con todo visible y sin `base` (por defecto `public/img/`).

## `GET /f/<id>/<n>-<ancho>.<ext>`

Imagen optimizada de una foto visible.

- **Patrón estricto**: `^/f/([0-9A-Za-z_-]{1,16})/([1-9][0-9]?)-(160|480|800|1200)\.(avif|webp)$` (160 solo `webp`; el resto según `anchosAvif`).
- Se comprueba que `<id>`/`<n>` existen en la galería y que `fotoVisible(id, n)` es verdadero.
- **200**: cuerpo de R2 (`f/<id>/<n>-<ancho>.<ext>`), `Content-Type` correcto, `Cache-Control: public, max-age=30`, `ETag` de R2 (304 con `If-None-Match`), `X-Content-Type-Options: nosniff`.
- **404 uniforme** (mismo cuerpo vacío y mismas cabeceras) para: ruta mal formada, prenda/foto inexistente, **oculta** o error de lectura. No se distingue «no existe» de «oculta».
- Nunca se redirige ni se revelan nombres de archivos de R2.

## Cabeceras comunes de las respuestas del Worker
`Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` y `Cross-Origin-Opener-Policy` iguales a las de `_headers`; `Content-Security-Policy: frame-ancestors 'none'` en las respuestas no HTML.

## Lo que la web pública sigue sirviendo como recursos estáticos
HTML, CSS, JS, fuentes, `public/img/portada/*`, logo, favicon, `og-cover.jpg`, `robots.txt`, `sitemap.xml`. Sin Worker y sin coste de peticiones.
