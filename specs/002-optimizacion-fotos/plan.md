# Implementation Plan: Optimización de fotos

**Branch**: `002-optimizacion-fotos` | **Date**: 2026-11-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-optimizacion-fotos/spec.md`

## Summary

El optimizador genera además una versión **AVIF** (calidad 50) de cada foto en 480, 800 y 1200 px
(prendas y portada) y la web las sirve con `<picture>` + `<source type="image/avif">`, con la WebP
actual como respaldo. Las miniaturas de 160 px siguen solo en WebP. El logo se recomprime (WebP
calidad 78, alfa 75) y se genera `public/img/og-cover.jpg` (1200×630) con el tríptico de la portada
y el logo. Detalles y mediciones en [research.md](./research.md).

## Technical Context

**Language/Version**: HTML5, CSS3, JavaScript ES2020; Node.js ≥ 18.17 para herramientas

**Primary Dependencies**: `sharp` (ya instalado; codifica AVIF con libheif/aom)

**Storage**: archivos en `public/img/`; `data/fotos-optimizadas.js` añade `formatos`

**Testing**: `npm run verificar` (comprueba AVIF), medición de peso con Edge sin ventana (390×844, 3×),
Lighthouse móvil en local, comparación visual de recortes

**Target Platform**: navegadores actuales (AVIF: Chrome/Edge 85+, Firefox 93+, Safari 16+); el resto, WebP

**Project Type**: web estática

**Performance Goals**: −30 % de datos de imagen en la primera carga móvil; Lighthouse móvil ≥ 95

**Constraints**: sin cambios visibles de encuadre ni maquetación; JS ≤ 200 líneas por archivo

**Scale/Scope**: 75 fotos × 3 anchos AVIF + 4 de portada × 3; 1 imagen para compartir

## Constitution Check

| Principio | Cómo se cumple | Estado |
|---|---|---|
| I. Solo fotos y teléfono | Sin cambios de contenido; la imagen para compartir no lleva texto | ✅ |
| II. Fotos protagonistas | Mismo encuadre y dimensiones; calidad comprobada a ojo | ✅ |
| III. Rendimiento | AVIF/WebP con `srcset`/`sizes`; el LCP mantiene `fetchpriority="high"` | ✅ |
| IV. Seguridad | Todo sigue en `'self'`; el HTML generado se sigue escapando | ✅ |
| V. SEO | `og-cover.jpg` preparado; `og:image` se activa con el dominio | ✅ |
| VI. Simplicidad | Sin dependencias nuevas; `<picture>` nativo | ✅ |

**Re-check post-diseño**: sin incumplimientos.

## Project Structure

```text
scripts/optimizar-imagenes.js   # + AVIF, poda de .avif, formatos en el manifiesto
scripts/imagenes-extra.js       # logo más ligero, og-cover.jpg
scripts/verificar.js            # comprueba también las AVIF
lib.js                          # getFotos → srcsetAvif; fotoHTML (picture) compartido por app y visor
app.js · visor.js · index.html  # <picture> en galería, segunda foto, visor, portada y contacto
```

**Structure Decision**: mismos archivos; `<picture>` se construye en `lib.js` para no duplicarlo.

## Complexity Tracking

Sin violaciones que justificar.
