# Implementation Plan: Datos estructurados (JSON-LD) y sitemap preparados

**Branch**: `006-json-ld-sitemap` | **Date**: 2026-11-16 | **Spec**: [spec.md](./spec.md)

## Summary

1. **`index.html`**: bloque `<script type="application/ld+json">` con `@graph` (`WebSite` + `ImageGallery`, `inLanguage: es`), sin URLs. Marcadores `<!-- DOMINIO:INICIO -->`/`<!-- DOMINIO:FIN -->` donde el comando escribirá canonical y etiquetas para compartir; se retira el comentario "al tener dominio".
2. **`scripts/dominio.js`** (`npm run dominio -- https://ejemplo.com`): valida el dominio, y escribe `sitemap.xml`, la línea `Sitemap:` de `robots.txt`, el bloque entre marcadores (canonical, `og:url`, `og:image` + tamaño), `twitter:card` → `summary_large_image` y `url`/`image` absolutas en el JSON-LD (se parsea y se reserializa). Repetible.
3. **`scripts/comprobar-seo.js`** (usado por `verificar`): valida JSON-LD (JSON, tipos permitidos `WebSite`/`ImageGallery`), y si hay canonical, que existan `sitemap.xml` y la línea de `robots.txt` con el mismo dominio; devuelve el host permitido.
4. **`scripts/verificar.js`**: sección "SEO técnico" que llama a lo anterior; host de la canonical admitido en "URLs externas"; `sitemap.xml` se revisa si existe. `package.json`: script `dominio`.
5. Documentación: `COMO-ACTUALIZAR-FOTOS.md` (sección "Poner el dominio"), `MEMORY.md`.

## Technical Context

**Language/Version**: Node.js ≥ 18.17 (herramientas, sin dependencias); HTML sin build

**Testing**: ejecuciones de `npm run dominio` con dominios de prueba sobre una copia (se restaura con git); `npm run verificar`; Lighthouse

**Constraints**: constitución v1.2.0: JSON-LD solo `WebSite`/`ImageGallery`; sin `<script>` ejecutable en línea (el bloque `ld+json` está permitido); sin texto visible nuevo; archivos JS ≤ 200 líneas; sin dominio no hay direcciones inventadas

## Constitution Check (v1.2.0)

| Principio | Estado | Nota |
|---|---|---|
| I Solo fotos y teléfono | ✅ | Sin texto visible; el JSON-LD no lleva teléfono ni palabras comerciales. |
| II / III | ✅ | Sin cambios visuales; ≈ 0,4 KB más de HTML. |
| IV Seguridad | ✅ | `ld+json` no se ejecuta; CSP intacta; el dominio solo se admite si coincide con la canonical. |
| V SEO neutro | ✅ | Exactamente los tipos que pide el principio; sin `Store`/`LocalBusiness`/`Product`/`Offer`. |
| VI Simplicidad | ✅ | Scripts de Node sin dependencias; sin build para la web. |

**Complexity Tracking**: sin violaciones.

## Modern Web Guidance

Sin funciones nuevas de plataforma (HTML/JS de la web no cambia más que un bloque de datos): sin guía aplicable. Consulta realizada: `structured data json-ld` (genérica).

## Project Structure

```text
index.html · robots.txt · package.json · scripts/{dominio.js, comprobar-seo.js, verificar.js}
COMO-ACTUALIZAR-FOTOS.md · MEMORY.md · specs/006-json-ld-sitemap/
```
