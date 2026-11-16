# Implementation Plan: Web informativa SLAC (solo fotos y teléfono)

**Branch**: `001-web-informativa` | **Date**: 2026-11-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-web-informativa/spec.md`

## Summary

Se reescribe la capa visible de la web para que solo muestre logo, fotos propias y teléfono:
1. **Portada** a pantalla completa con fotos propias (1 en móvil, 3 en escritorio) generadas por
   el optimizador en `public/img/portada/`, el logo dorado con fondo transparente y el número.
2. **Galería** en columnas tipo revista que respeta la proporción natural de cada foto (de 1:2 a
   1:1), sin textos; cada pieza abre el **visor** (`<dialog>`) con todas sus fotos.
3. **Contacto** en tres puntos: cabecera fija (número), botón flotante (WhatsApp) y bloque final
   sobre una foto propia (número grande, "Llamar", "WhatsApp"). WhatsApp sin mensaje.
4. **Limpieza de contenido**: fuera eslóganes, Atelier, fotos de Unsplash, nombres,
   referencias, categorías, filtros, etiquetas y mensajes; los datos pasan a `data/galeria.js`
   con una descripción neutra por prenda (solo para `alt`).
5. **Legal**: una única `aviso-legal.html` neutra; se eliminan `privacidad.html` y `cookies.html`.
6. **Sin terceros**: fuentes `woff2` autoalojadas, iconos SVG en un sprite dentro del HTML, CSP
   en `<meta>`; `scripts/verificar.js` comprueba palabras prohibidas, URLs externas y código en
   línea.
7. **Herramientas** adaptadas al nuevo modelo: panel `admin.*`, optimizador (dimensiones, logo,
   portada) y servidor local (recarga compatible con la CSP).

## Technical Context

**Language/Version**: HTML5, CSS3, JavaScript ES2020 sin transpilar; Node.js ≥ 18.17 para herramientas

**Primary Dependencies**: web: ninguna. Herramientas: `sharp` (ya instalado)

**Storage**: archivos estáticos; datos en `data/galeria.js` y `data/fotos-optimizadas.js` (generado)

**Testing**: `npm run verificar` (sintaxis, datos, fotos al día, palabras prohibidas, URLs
externas, código en línea) y capturas con Edge sin ventana a 390 px y 1440 px con registro de la
consola, según [quickstart.md](./quickstart.md)

**Target Platform**: últimas versiones de Chrome, Edge, Firefox y Safari (iOS incluido)

**Project Type**: web estática de una página + página de aviso legal + herramientas locales

**Performance Goals**: sin saltos de maquetación (dimensiones en todas las imágenes); primera
pantalla en móvil < 1 MB (la medición fina y AVIF son la funcionalidad 002)

**Constraints**: sin recursos de terceros; sin `<script>`/`style=""` en línea; JS ≤ 200 líneas
por archivo; texto visible limitado a FR-001

**Scale/Scope**: 26 prendas, 75 fotos, 2 páginas públicas

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.* (constitución v1.0.0)

| Principio | Cómo se cumple | Estado |
|---|---|---|
| I. Solo fotos y teléfono | Texto visible: número, "Llamar", "WhatsApp", contador del visor y "Aviso legal". `alt` neutros. `wa.me/<n>` sin `text`. Legal en una sola página enlazada desde el pie. `verificar` busca términos prohibidos en todo lo publicable | ✅ |
| II. Fotos protagonistas | Portada y fondo del contacto con fotos propias; fuera Unsplash. Galería sin crop, visor con teclado/flechas/deslizar/miniaturas. Negro y dorado del logo. `prefers-reduced-motion` | ✅ |
| III. Rendimiento | `srcset`/`sizes` con las WebP del optimizador; solo la foto principal de la portada con `fetchpriority="high"`; el resto `lazy`. Fuentes `woff2` locales con `swap`. Iconos en sprite SVG | ✅ (AVIF y medición Lighthouse en 002) |
| IV. Seguridad y privacidad | Sin CDN ni Google Fonts; CSP `default-src 'self'` en `<meta>`; cero código en línea; `sanitize` en todo HTML generado; `verificar` lo comprueba | ✅ (cabeceras HTTP y `dist/` en 003) |
| V. SEO neutro | Un `<h1>` (el logo), secciones con nombre accesible, `title`/`description` neutros | ✅ (JSON-LD, OG completos y sitemap en 003) |
| VI. Simplicidad | Sin framework ni build; datos en `data/galeria.js`; JS en 3 archivos ≤ 200 líneas | ✅ |

**Re-check post-diseño**: sin incumplimientos. Complexity Tracking vacío.

## Project Structure

### Documentation (this feature)

```text
specs/001-web-informativa/
├── spec.md · plan.md · research.md · data-model.md · quickstart.md
├── contracts/  (galeria-js.md, verificar-cli.md)
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
index.html              # Sprite SVG, cabecera, portada estática, galería (vacía, la rellena JS), contacto, pie, botón flotante, visor <dialog>
aviso-legal.html        # Única página legal, neutra (sustituye a privacidad.html y cookies.html)
styles.css              # Tokens (mismos nombres de variables que usa admin.css), base, cabecera, portada, galería, contacto, pie, botón flotante
visor.css               # Visor de fotos (<dialog>)
legal.css               # Estilos de aviso-legal.html
lib.js                  # sanitize, getFotos (con dimensiones), enlaces tel: y wa.me
app.js                  # Contacto, cabecera, galería, animaciones de entrada
visor.js                # Visor: abrir, navegar, deslizar, miniaturas, limpiar
data/galeria.js         # CONTACTO, PORTADA, PRENDAS (antes catalogo.js)
data/fotos-optimizadas.js  # Generado: dimensiones de cada foto optimizada
public/fonts/           # cormorant-garamond-500.woff2, manrope-variable.woff2 (+ licencias OFL)
public/img/             # Generado: <id>/<n>-<ancho>.webp, portada/<n>-<ancho>.webp, logo-*.webp, favicon
admin.html|js|css       # Panel local adaptado (descripción, fotos, oculta)
scripts/optimizar-imagenes.js  # + dimensiones, portada, logo transparente, favicon; revisión con descripciones
scripts/servidor.js     # Recarga en vivo con script externo (compatible con la CSP)
scripts/verificar.js    # NUEVO: puerta de calidad de la constitución
```

**Structure Decision**: se mantiene la estructura plana actual en la raíz. Se añaden
`visor.js`/`visor.css` para respetar el límite de 200 líneas por archivo JS y separar el visor,
y `scripts/verificar.js` como puerta de calidad.

## Complexity Tracking

Sin violaciones que justificar.
