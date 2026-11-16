# Constitución de SLAC

Principios innegociables de la web de SLAC: una galería de fotos de prendas con un número de
teléfono de contacto, sin ningún otro contenido. `/speckit-plan` los usa como puertas
("Constitution Check") y `/speckit-analyze` trata cualquier conflicto con ellos como CRÍTICO.

## Core Principles

### I. Solo fotos y teléfono (regla del usuario)
- La web pública muestra EXCLUSIVAMENTE: el logo, las fotos de las prendas, el número de la
  prenda sobre cada foto, el número de teléfono (llamada y WhatsApp) y un enlace discreto
  "Aviso legal" en el pie.
- Texto visible permitido: el número de teléfono, las etiquetas mínimas de los botones de
  contacto ("Llamar", "WhatsApp"), el contador de fotos del visor, el enlace "Aviso legal" y
  el número de la prenda. Nada más: ni eslóganes, ni descripciones de marca, ni nombres,
  referencias o categorías de prendas, ni filtros.
- Número de la prenda: único dato nuevo permitido para identificarla. Son SOLO cifras (1 a 4,
  sin ceros a la izquierda), sin "Nº", "ref.", "código" ni ninguna palabra; sale del
  identificador de la prenda en `data/galeria.js`, se superpone a sus fotos (galería y visor)
  y no forma parte de la imagen optimizada. Las fotos de portada y `og-cover` no lo llevan.
- PROHIBIDO cualquier contenido que sugiera un negocio o una tienda, también en textos no
  visibles (title, description, alt, aria-label, datos estructurados, comentarios de los
  archivos que se publican): precios, venta, compra, tienda, pedidos, encargos, referencias,
  códigos, disponibilidad, stock, tallas, envíos, ofertas, clientes, colección, catálogo,
  empresa. El número de la prenda no puede acompañarse de ninguna de estas palabras.
- WhatsApp se abre SIN mensaje predefinido (`https://wa.me/<número>`).
- La información legal vive en una única página `aviso-legal.html`, redactada de forma neutra,
  enlazada solo desde el pie. Sin banners ni avisos visibles en la página principal.

**Motivo:** el usuario quiere una web meramente informativa, sin ninguna pista comercial.

### II. Las fotos son las protagonistas (@Agent-UI-UX)
- Solo fotos propias de las prendas: PROHIBIDAS las imágenes de bancos (Unsplash, etc.).
- Estética oscura y dorada coherente con el logo; cada vista prioriza la imagen sobre
  cualquier otro elemento.
- Toda prenda se ve en la galería y, al pulsarla, en un visor con todas sus fotos, navegable
  con teclado, flechas en pantalla y deslizamiento en móvil.
- Mobile-first real: perfecta de 360 px a 1920 px. Contraste WCAG AA en todo el texto.
- Las animaciones son discretas y se desactivan con `prefers-reduced-motion: reduce`.
- Ningún salto de maquetación: toda imagen declara sus dimensiones o su `aspect-ratio`.

### III. Rendimiento (@Agent-Performance)
- La web publicada NUNCA carga las fotos originales: solo versiones optimizadas (AVIF/WebP)
  con `srcset` y `sizes`, generadas por `npm run optimizar`.
- Solo la imagen principal de la primera pantalla se carga con prioridad
  (`fetchpriority="high"`); el resto, en diferido (`loading="lazy"`).
- Fuentes autoalojadas en `woff2` con `font-display: swap`; iconos en SVG dentro del HTML.
- Objetivos: Lighthouse móvil ≥ 95 en rendimiento y < 1 MB transferido en la primera
  pantalla en móvil.
- Ningún listener, temporizador u observador queda vivo cuando deja de ser necesario.

### IV. Seguridad y privacidad (@Agent-SecOps)
- Cero recursos de terceros (CDN, fuentes, analítica, mapas): la web no usa cookies ni envía
  datos de visitantes a nadie. Los únicos enlaces externos son `tel:` y `wa.me` y, solo en el aviso legal, el enlace al perfil de Instagram del titular (`rel="noopener noreferrer"`).
- CSP restrictiva (`default-src 'self'`) en `<meta>` y cabeceras HTTP de seguridad en el
  servidor. PROHIBIDOS los `<script>` y `style="..."` en línea en las páginas publicadas
  (los bloques JSON-LD no se ejecutan y están permitidos).
- Todo HTML generado desde datos se escapa (`sanitize`) o se crea con la API del DOM.
- Lo que no es la web no se publica: herramientas (`admin.*`, `scripts/`, páginas de
  revisión), fotos originales y copias privadas. `npm run publicar` genera `dist/` solo con
  los archivos permitidos.

### V. Semántica y SEO neutro (@Agent-SEO)
- Un único `<h1>` por página; `<header>`, `<main>`, `<section>`, `<footer>` y `<nav>`
  usados correctamente; `lang="es"`.
- Cada foto lleva un `alt` que describe la prenda de forma neutra (tipo, color, detalle).
- `<title>` y `<meta name="description">` neutros e informativos; OpenGraph y Twitter Card.
- Datos estructurados JSON-LD de tipo `WebSite` e `ImageGallery`. PROHIBIDOS los tipos
  comerciales (`Store`, `LocalBusiness`, `Product`, `Offer`).
- `robots.txt` presente; canonical, `og:image` y `sitemap.xml` cuando exista dominio.

### VI. Simplicidad (@Agent-Architect)
- HTML + CSS + JavaScript sin framework ni paso de build para la web. Node.js solo para las
  herramientas de desarrollo (optimizar imágenes, servidor local, verificar, publicar).
- Datos en un único lugar: `data/galeria.js` (contacto y prendas). El HTML no contiene el
  número de teléfono escrito a mano.
- JavaScript en modo estricto, `const`/`let`, archivos de ≤ 200 líneas y funciones de una
  sola responsabilidad.

## Restricciones técnicas

- **Stack:** HTML5 + CSS + JavaScript (ES2020+) sin transpilar; scripts clásicos con `defer`.
  Navegadores objetivo: últimas versiones de Chrome, Edge, Firefox y Safari (iOS incluido).
- **Herramientas:** Node.js ≥ 18.17 y `sharp` (devDependency) para las imágenes.
- **Idioma:** specs, planes, tareas, comentarios e interfaz en español.

## Flujo de trabajo y puertas de calidad

- TODO cambio en el código o en los datos DEBE pasar por el ciclo Spec Kit de `AGENTS.md` §5.
  En los cambios pequeños la spec puede ser breve.
- Cada funcionalidad se desarrolla en su propia rama `NNN-nombre` creada desde `main`.
- Una rama solo se fusiona en `main` cuando `/speckit-converge` informa `Converged` y se
  superan estas puertas:
  1. `npm run verificar` sin errores (sintaxis, datos, fotos optimizadas al día, palabras
     prohibidas, recursos externos y código en línea).
  2. La web abierta en el navegador a 390 px y a 1440 px de ancho: se ve correctamente y sin
     errores en la consola.
  3. Con `prefers-reduced-motion` activado no hay animaciones de entrada.
- `spec.md` describe el qué y el porqué, sin tecnología. La tecnología entra en `plan.md`.
- Al planificar e implementar funciones de la plataforma web (HTML, CSS, JavaScript,
  accesibilidad, rendimiento) se consulta Modern Web Guidance (`AGENTS.md` §5). La guía es
  orientativa: los principios I-VI prevalecen sobre cualquiera de sus recomendaciones (sin
  recursos de terceros, sin paso de build, sin funciones experimentales ni de un solo motor).
  Las consultas son genéricas y en inglés: nunca incluyen nombres del proyecto, teléfonos,
  rutas ni datos de las prendas. La falta de guía o de red no bloquea ninguna tarea.
- Al cerrar una funcionalidad se actualiza `MEMORY.md`.

## Governance

- Esta constitución prevalece sobre `AGENTS.md`, `MEMORY.md` y cualquier spec o plan. Si un
  plan necesita incumplir un principio, lo justifica en "Complexity Tracking" de `plan.md`; si
  la excepción es permanente, se enmienda la constitución.
- Las enmiendas se hacen con `/speckit-constitution`. Versionado semántico: MAJOR si se elimina
  o redefine un principio, MINOR si se añade un principio o sección, PATCH para aclaraciones.
- `/speckit-analyze` y la auditoría previa a la fusión comprueban el cumplimiento.

**Version**: 1.3.0 | **Ratified**: 2026-11-16 | **Last Amended**: 2026-11-16
