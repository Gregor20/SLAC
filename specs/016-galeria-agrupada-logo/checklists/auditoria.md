# Auditoría previa a la entrega: 016 Galería agrupada y logo

**Fecha**: 2026-11-17 · `npm run verificar`: ✅ sin errores

## Seguridad (@Agent-SecOps)

- [x] Sin recursos de terceros, `<script>` ni `style` en línea nuevos (verificar: "Código en línea (CSP)", "URLs externas")
- [x] Descripciones de prendas escritas como texto plano en `data/galeria.js`; el HTML se sigue generando con `sanitize`
- [x] `fotos-slac/` no se publica: `publicar.js` solo copia `public/img` (portada, prendas y `slac`)
- [x] Sin dependencias nuevas

## Rendimiento (@Agent-Performance)

- [x] Portada móvil: AVIF 12–19 KB; escritorio: AVIF 54–77 KB (antes, 3 fotos de portada)
- [x] Solo la imagen de portada con `fetchpriority="high"`; 39 imágenes con `loading="lazy"` (galería y contacto)
- [x] Dimensiones declaradas (`width`/`height`) en la portada y en las fotos nuevas (manifiesto)
- [x] `legacy-scan`: 4 hallazgos anteriores a esta funcionalidad (`visor.js:79`, `visor.js:103`, `admin.js:9`, `admin.js:10`); ninguno en archivos tocados → pendientes para una limpieza aparte
- [ ] Lighthouse móvil no medido en esta entrega (la portada es más ligera que la anterior); medir tras publicar

## SEO (@Agent-SEO)

- [x] Un único `<h1>` (logo) conservado; la portada lleva `alt` descriptivo neutro
- [x] El lema de la portada solo existe dentro de la imagen: no está en texto, metadatos ni JSON-LD
- [x] Sin palabras prohibidas (verificar) y sin "BOUTIQUE" en ninguna imagen publicada
- [x] Cada prenda nueva con `alt` neutro (tipo, color, detalle)

## Revisión visual

- [x] Capturas a 360, 390, 768 y 1440 px: portada y logo correctos; consola sin errores propios (los avisos de fuente son por abrir con `file://`)
- [x] Con `prefers-reduced-motion` la portada se ve sin animaciones
- [x] 37 tarjetas en la galería (26 anteriores + 11 nuevas)
