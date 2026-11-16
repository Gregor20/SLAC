# Contrato: `npm run verificar`

`node scripts/verificar.js` — sin argumentos, sin dependencias.

**Salida**: una línea por comprobación (`✓`/`✗`/`⚠`) y un resumen final.

**Código de salida**: `0` si no hay errores (los avisos no cuentan); `1` si hay alguno.

| Comprobación | Error si… |
|---|---|
| Sintaxis | algún JS publicable no compila |
| Datos | id repetido o vacío, falta `descripcion`, foto inexistente, `PORTADA` inválida |
| Fotos optimizadas | `FOTOS_OPT` no coincide con `PRENDAS` (pide `npm run optimizar`) o falta algún archivo de `public/img` que use el HTML |
| Palabras prohibidas | aparece algún término de la lista de research R11 en un archivo publicable |
| URLs externas | aparece una URL que no es `wa.me` ni `schema.org` |
| Código en línea | `<script>` sin `src` (salvo JSON-LD), `<style>`, `style="` u `on…="` en el HTML |
| Teléfono | (solo aviso) sigue el provisional |

Archivos publicables: `index.html`, `aviso-legal.html`, `styles.css`, `visor.css`, `legal.css`,
`lib.js`, `app.js`, `visor.js`, `data/galeria.js`, `data/fotos-optimizadas.js`, `robots.txt`.
