# Implementation Plan: Galería agrupada por prenda y logo de portada ajustado

**Branch**: `016-galeria-agrupada-logo` | **Date**: 2026-11-17 | **Spec**: [spec.md](./spec.md)

## Summary

Las 14 imágenes de `fotos-slac/` se separan en 22 fotos individuales (`public/fotos/slac-<prenda>-<n>.jpeg`)
con `scripts/preparar-fotos-slac.js`; se declaran como 11 prendas nuevas (027 a 037) en `data/galeria.js`
y las optimiza el flujo existente (`npm run optimizar`: WebP/AVIF con `srcset`). `body-11` a `body-14`
pierden la palabra "BOUTIQUE" y el adorno bajo ella (queda "SLAC"). La portada pasa a un fondo único
(`public/img/slac/fondo-*`, generado con `npm run optimizar:slac`) con recorte vertical para móvil; el logo
superpuesto se reduce y baja en móvil y se oculta visualmente en escritorio (la imagen ya lo lleva).
La constitución se enmienda a 1.4.0 para permitir el lema de la portada y el rótulo "SLAC" dentro de las imágenes.

## Technical Context

**Language/Version**: HTML5, CSS3, JavaScript ES2020; Node.js ≥ 18.17 con `sharp` para herramientas

**Primary Dependencies**: ninguna nueva

**Storage**: archivos estáticos; datos en `data/galeria.js` (`PRENDAS`)

**Testing**: `npm run verificar`; capturas a 360/390/768/1440 px; revisión visual de recortes

**Target Platform**: navegadores actuales (AVIF con respaldo WebP)

**Project Type**: web estática

**Performance Goals**: primera pantalla móvil < 1 MB (la portada móvil pesa ≈ 18–29 KB); fotos de la galería en `loading="lazy"`

**Constraints**: principio I (sin textos comerciales); archivos JS ≤ 200 líneas

**Scale/Scope**: 22 fotos nuevas × (4 WebP + 3 AVIF); 2 scripts de herramienta; cambios en `index.html`, `styles.css`, `app.js`

## Constitution Check

| Principio | Cómo se cumple | Estado |
|---|---|---|
| I. Solo fotos y teléfono | Sin textos nuevos; descripciones neutras; "BOUTIQUE" eliminada de las imágenes; excepción del lema/"SLAC" enmendada en la constitución 1.4.0 | ✅ |
| II. Fotos protagonistas | Solo fotos propias; visor sin cambios; dimensiones declaradas | ✅ |
| III. Rendimiento | Solo versiones optimizadas; el LCP es la portada con `fetchpriority="high"`; resto en diferido | ✅ |
| IV. Seguridad | Sin recursos de terceros ni código en línea; los originales de `fotos-slac/` no se publican | ✅ |
| V. SEO | `alt` neutro de la portada; sin lema en texto, metadatos ni JSON-LD | ✅ |
| VI. Simplicidad | Sin dependencias; flujo de optimización existente | ✅ |

## Project Structure

```text
fotos-slac/                          # originales entregados (no se modifican)
scripts/preparar-fotos-slac.js       # separa collages/parejas, limpia el rótulo → public/fotos/slac-*
scripts/optimizar-fotos-slac.js      # fondo de portada (escritorio y móvil) → public/img/slac/
scripts/publicar.js                  # publica también public/img/slac
data/galeria.js                      # + prendas 027–037
index.html · styles.css · app.js     # portada de fondo único; logo ajustado; alt de contacto
```

**Structure Decision**: sin carpetas nuevas de código; las fotos entran por `public/fotos` como el resto.
