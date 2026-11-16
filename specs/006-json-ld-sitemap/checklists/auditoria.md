# Auditoría previa a la entrega — 006 JSON-LD y sitemap preparados

**Fecha**: 2026-11-16 | **Rama**: `006-json-ld-sitemap`

> Auditoría de la implementación (convención de `AGENTS.md` §5, paso 7): `[x]` = comprobado con la evidencia indicada.

## Convergencia spec ↔ plan ↔ tareas ↔ archivos

| Requisito | Evidencia |
|---|---|
| FR-001/002 JSON-LD válido, solo `WebSite` + `ImageGallery`, `es` | `index.html`; `verificar` ✓; probado: con tipo `Product` falla («tipo no permitido»), con JSON roto falla |
| FR-003 sin cambio visual | Edge 390/1440 px igual que antes (26 etiquetas, sin errores de consola) |
| FR-004 un comando genera los 5 resultados | `npm run dominio -- https://otro-b.es`: sitemap.xml (solo la raíz), 1 línea `Sitemap:`, canonical + `og:url` + `og:image` (+1200×630), `summary_large_image`, `url`/`image` en JSON-LD |
| FR-005 validación del dominio | `ejemplo.com`, `http://x.com`, `https://x.com/ruta`, vacío, `https://a b.com` → exit 1 y 0 archivos modificados |
| FR-006 repetible | dominio A y luego B: 1 canonical, 1 `og:image`, 1 `Sitemap:`, 0 rastros de A |
| FR-007 comprobación | sin sitemap → falla; JSON roto → falla; host distinto en JSON-LD → falla |
| FR-008 dominio admitido solo si coincide con la canonical | `https://malo.com/` en el JSON-LD → «URL externa» y «no coincide con la canonical» |
| FR-009 sin direcciones inventadas sin dominio | árbol final: sin `sitemap.xml` ni canonical; `verificar` ✓ |

Las pruebas con dominios de prueba se hicieron sobre el árbol y se restauraron con `git checkout`; no queda ningún dominio de prueba en los archivos.

## Seguridad

- [x] `ld+json` no se ejecuta y la CSP no cambia; sin `<script>` ejecutable nuevo (`verificar`: "Código en línea" ✓).
- [x] El dominio no se acepta como recurso externo salvo que sea el de la canonical; sin dependencias nuevas.
- [x] `dominio.js` calcula todo antes de escribir: si algo falla no deja archivos a medias.

## SEO y contenido

- [x] Solo los tipos que pide el principio V; sin `Store`, `LocalBusiness`, `Product` ni `Offer`; sin teléfono ni palabras de negocio (palabras prohibidas ✓).
- [x] `aviso-legal.html` sigue `noindex` y queda fuera del sitemap.
- [x] Lighthouse móvil local: rendimiento 98, accesibilidad 100, buenas prácticas 100, SEO 100; CLS 0; LCP 2,0 s.

## Rendimiento

- [x] +≈ 0,6 KB de HTML (bloque JSON-LD); sin peticiones nuevas.
- [x] `legacy-scan` (sin `_backup-original/` ni `specs/`): los mismos 4 hallazgos de la línea base (`visor.js:103`, `visor.js:79`, `admin.js:9`, `admin.js:10`); 006 no añade ninguno.
- [x] Archivos JS ≤ 200 líneas (`verificar.js` 176, `dominio.js` 92, `comprobar-seo.js` 60).

## Pendiente (fuera de esta funcionalidad)

- [ ] Elegir dominio y ejecutar `npm run dominio -- https://…`; enviar el sitemap a Google Search Console.
- [ ] Rich Results Test de Google sobre la URL publicada (no se puede hacer sin dominio).
- [ ] Domicilio y correo del aviso legal; hosting y cabeceras HTTP.
