# Tasks: JSON-LD y sitemap preparados

Sin tests automáticos nuevos: validación con `npm run verificar` y pruebas del comando sobre el árbol (restaurado con `git checkout` después).

## Phase 1: US1 — JSON-LD (P1) 🎯 MVP

- [ ] T001 [US1] En `index.html` (cabecera), añadir `<script type="application/ld+json">` con `@context`, `@graph`: `WebSite` (`name` "SLAC", `inLanguage` "es") y `ImageGallery` (`name` = título de la página, `description` neutra, `inLanguage` "es"); sin URLs; y los marcadores `<!-- DOMINIO:INICIO -->`/`<!-- DOMINIO:FIN -->` sustituyendo al comentario "Al tener dominio…".
- [ ] T002 [US1] Comprobar en Edge (390 y 1440 px) que la web no cambia y no hay errores en consola.

## Phase 2: US2 — Comando del dominio (P1)

- [ ] T003 [US2] Crear `scripts/dominio.js` (≤ 200 líneas, sin dependencias): validar `^https://[a-z0-9.-]+(:\d+)?/?$` y normalizar (minúsculas, sin barra final); si no es válido, salir con error sin tocar archivos.
- [ ] T004 [US2] En `scripts/dominio.js`: escribir `sitemap.xml` (solo `<loc>` de la raíz y `<lastmod>` de hoy), reemplazar o añadir una única línea `Sitemap:` en `robots.txt` (quitando el comentario PENDIENTE), rellenar entre marcadores `canonical`, `og:url`, `og:image`, `og:image:width` 1200, `og:image:height` 630, cambiar `twitter:card` a `summary_large_image`, y poner `url`/`image` en el JSON-LD (parse + serialización con 2 espacios).
- [ ] T005 [US2] Añadir el script `dominio` en `package.json`.
- [ ] T006 [US2] Probar: dominio inválido (`ejemplo.com`, `http://x.com`, `https://x.com/ruta`, vacío) → error y `git status` limpio; dominio A y luego B → 1 `Sitemap:`, 1 canonical, 1 `og:url`, 1 `og:image`, sin rastro de A; restaurar con `git checkout`.

## Phase 3: US3 — Verificación (P2)

- [ ] T007 [P] [US3] Crear `scripts/comprobar-seo.js`: JSON-LD parseable, tipos ⊆ {WebSite, ImageGallery}; con canonical: `sitemap.xml` existe con la misma raíz, `robots.txt` tiene la línea `Sitemap:` y las URLs absolutas del JSON-LD usan ese host; devuelve `{ errores, host }`.
- [ ] T008 [US3] En `scripts/verificar.js`: sección "SEO técnico", host de la canonical admitido en `urlsExternas` (y `www.sitemaps.org`), `sitemap.xml` revisado si existe; mantener ≤ 200 líneas.
- [ ] T009 [US3] Probar los fallos: JSON roto, tipo `Product`, canonical sin sitemap → `verificar` falla; con dominio configurado correctamente → pasa; restaurar.

## Phase 4: Polish

- [ ] T010 [P] Documentar en `COMO-ACTUALIZAR-FOTOS.md` la sección "Poner el dominio" (`npm run dominio -- https://tudominio.com`, qué hace y que se puede repetir).
- [ ] T011 `npm run verificar` ✓; Lighthouse móvil (SEO 100, rendimiento ≥ 95, CLS 0); `legacy-scan`.
- [ ] T012 Actualizar `MEMORY.md` (mapa, ADR de 006, checklist SEO: JSON-LD hecho; sitemap preparado, a la espera de dominio), auditoría en `checklists/`, convergencia y fusión en `main`.
