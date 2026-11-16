# Auditoría previa a la entrega: Optimización de fotos (002)

**Fecha**: 2026-11-16 · **Roles**: @Agent-Performance, @Agent-SecOps, @Agent-SEO

## Rendimiento
- [x] Fotos AVIF q50 con respaldo WebP (`<picture>`), `srcset`/`sizes` y dimensiones explícitas.
- [x] Solo la imagen de la portada con `fetchpriority="high"`; el resto `loading="lazy"`.
- [x] Primera carga móvil 390×844 a 3×: imágenes 433 KB (−40 %), total 537 KB (< 1 MB).
- [x] Lighthouse móvil local: rendimiento 99 (LCP 2,1 s, CLS 0, TBT 0).
- [ ] PageSpeed real una vez desplegado.

## Seguridad
- [x] `fotoHTML`/`fotoElemento` escapan con `sanitize` o usan la API del DOM.
- [x] CSP `default-src 'self'` sin cambios: AVIF y WebP son recursos propios; 0 terceros.
- [x] Fotos originales no publicadas; `verificar` sin código en línea ni URLs externas.

## SEO / compartir
- [x] `og-cover.jpg` 1200×630 sin texto; etiquetas `og:image` listas en comentario (pendiente dominio).
- [x] Lighthouse SEO 100 y accesibilidad 100 (tras T011).

## Convergencia (FR/SC)
- [x] FR-001 a FR-005 y SC-001 a SC-004 verificados. **Converged.**
