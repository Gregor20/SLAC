# Auditoría SEO y accesibilidad (@Agent-SEO) — 004 Número en la foto

**Fecha**: 2026-11-16 | **Rama**: `004-numero-en-foto`

> Auditoría de la implementación (convención de `AGENTS.md` §5, paso 7): `[x]` = comprobado con la evidencia indicada.

- [x] CHK001 Un único `<h1>` y estructura semántica sin cambios (el número es un `<span>`; no añade encabezados).
- [x] CHK002 `<title>` y `<meta name="description">` sin cambios y neutros: no incluyen números ni palabras nuevas.
- [x] CHK003 `alt` de las fotos intacto; el nombre accesible del botón de cada prenda es "número + descripción" (p. ej. "1 Vestido largo…") y el `<dialog>` usa `aria-label="3. Mono de cuello halter…"`, sin palabras comerciales (FR-006).
- [x] CHK004 Lighthouse: accesibilidad **100** y SEO **100**.
- [x] CHK005 Contraste AA: texto dorado `#e5c158` sobre píldora `rgba(10,9,8,.82)`; peor caso (foto blanca detrás) ≈ 6,9:1 por cálculo (≥ 4,5:1, SC-003). Sin medir sobre las fotos reales de la galería.
- [x] CHK006 Portada y `og-cover.jpg` sin número (FR-010): el número es texto superpuesto solo en la galería y el visor.
- [x] CHK007 Sin datos estructurados nuevos ni tipos comerciales; JSON-LD (`WebSite`/`ImageGallery`) sigue pendiente de otra funcionalidad (MEMORY §5).
- [x] CHK008 `robots.txt` presente; `sitemap.xml`, canonical y `og:image` siguen a la espera de dominio.
