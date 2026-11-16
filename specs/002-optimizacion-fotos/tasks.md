---
description: "Tareas de la funcionalidad 002: optimización de fotos"
---

# Tasks: Optimización de fotos

**Input**: Design documents from `/specs/002-optimizacion-fotos/`

**Tests**: puerta `npm run verificar` + mediciones del plan.

## Phase 1: Foundational

- [X] T001 En `scripts/optimizar-imagenes.js`: generar AVIF q50 (480, 800, 1200) junto a las WebP para prendas y portada, firma de caché con los formatos, podar también `.avif`, y escribir `formatos: ["avif", "webp"]` y `anchosAvif` en `data/fotos-optimizadas.js`
- [X] T002 [P] En `scripts/imagenes-extra.js`: logo WebP q78/alfa 60 (≤ 30 KB a 560 px) y `generarOgCover()` → `public/img/og-cover.jpg` 1200×630 < 300 KB sin texto
- [X] T003 [P] En `scripts/verificar.js`: exigir las AVIF de cada foto y portada, y la existencia de `public/img/og-cover.jpg`
- [X] T004 Ejecutar `npm run optimizar` y `npm run verificar`

## Phase 2: User Story 1 - Las fotos llegan antes (P1) 🎯

- [X] T005 [US1] En `lib.js`: `getFotos` devuelve `srcsetAvif`; nueva `fotoHTML(f, { clase, sizes, alt, extra })` que devuelve `<picture>` con `<source type="image/avif">` y el `<img>` WebP (todo escapado)
- [X] T006 [US1] En `app.js`: galería y segunda foto con `<picture>` (la segunda, creada con la API del DOM)
- [X] T007 [US1] En `index.html` y `visor.js`: `<picture>` en portada (3), contacto y visor; el visor actualiza el `<source>` al cambiar de foto
- [X] T008 [US1] Medir: peso de la primera carga (390×844, 3×), Lighthouse móvil local y recorte visual; anotar resultados en `research.md`

## Phase 3: User Story 2 - Imagen para compartir (P2)

- [X] T009 [US2] Revisar `public/img/og-cover.jpg` a ojo y dejar en `index.html` el comentario con las etiquetas `og:image` listas para activar con el dominio

## Phase 4: Polish

- [X] T010 [P] Actualizar `COMO-ACTUALIZAR-FOTOS.md` (AVIF, og-cover) y `MEMORY.md`

## Phase 5: Convergencia

- [X] T011 [P] En `index.html`: quitar `aria-label="Llamar"` de los tres enlaces cuyo texto visible es el número (WCAG 2.5.3, detectado por Lighthouse)

## Dependencies

T001-T003 → T004 → T005 → T006/T007 → T008; T009 tras T004; T010 al final.
