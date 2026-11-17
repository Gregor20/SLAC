# Tasks: Galería agrupada por prenda y logo de portada ajustado

## Phase 1: Portada y logo (US2)

- [X] T001 Generar el fondo de portada (escritorio y móvil) en `scripts/optimizar-fotos-slac.js` → `public/img/slac/`
- [X] T002 [US2] Sustituir el tríptico por el fondo único en `index.html` y `styles.css`; ajustar `describirPortada` en `app.js`
- [X] T003 [US2] Ajustar el logo: más pequeño y bajo en móvil, oculto visualmente en escritorio (`styles.css`, `sizes` en `index.html`)
- [X] T004 Publicar `public/img/slac` en `scripts/publicar.js`

## Phase 2: Fotos agrupadas (US1)

- [X] T005 Enmendar la constitución (1.4.0): lema de la portada y rótulo "SLAC" dentro de las imágenes
- [X] T006 [US1] `scripts/preparar-fotos-slac.js`: separar collages y parejas, eliminar "BOUTIQUE" de `body-11` a `body-14`
- [X] T007 [US1] Añadir las prendas 027 a 037 en `data/galeria.js` (22 fotos, descripciones neutras)
- [X] T008 [US1] `npm run optimizar` (WebP/AVIF, manifiesto)

## Phase 3: Rendimiento y cierre (US3)

- [X] T009 `npm run verificar` sin errores; capturas a 360/390/768/1440 px
- [X] T010 Checklists de seguridad, rendimiento y SEO; `legacy-scan`
- [X] T011 Actualizar `MEMORY.md`
