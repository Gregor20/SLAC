# MEMORY.md — Memoria Persistente y Contexto del Proyecto

> **Instrucción para el Agente:** Lee este archivo al inicio de cada sesión y actualízalo automáticamente al finalizar cualquier tarea importante (nuevas rutas, cambios en el sistema de diseño, integraciones o auditorías).
>
> **Reparto con Spec Kit:** aquí va el *estado* del proyecto (qué hay y por qué). Los principios innegociables están en `.specify/memory/constitution.md`, el flujo de trabajo en `AGENTS.md` §5 y el detalle de cada funcionalidad en `specs/NNN-nombre/`. No duplicar aquí specs ni planes: enlazarlos.

---

## 1. Identidad del Proyecto
- **Nombre del Proyecto:** SLAC (carpeta `slac`)
- **Objetivo:** web meramente informativa: fotos de las prendas y un teléfono de contacto (llamada y WhatsApp sin mensaje). Sin textos de venta, precios, normativa visible ni nada que sugiera un negocio o una tienda (constitución, principio I).
- **Público Objetivo:** personas que llegan por enlace directo o redes y quieren ver las prendas desde el móvil.
- **Keywords Principales (SEO):** SLAC, vestidos, monos, conjuntos de fiesta (siempre en tono neutro, sin términos comerciales).
- **Pendiente de definir por el usuario:** número de teléfono real (lo dará al final, tras revisar), dominio y hosting, datos del titular para `aviso-legal.html`.

---

## 2. Sistema de Diseño (Design Tokens Activos)
- **Dirección Estética:** lujo oscuro y editorial: las fotos mandan; negro cálido y el dorado del logo; casi sin texto (constitución I y II).
- **Paleta de Colores:** fondo `#0a0908`, superficies `#141210`/`#1b1815`, dorado `#d4af37` y `#e5c158` (texto dorado ≈ 11:1 sobre el fondo), texto `#eae6df`, secundario `#a29d95` (≈ 7:1), texto sobre dorado `#15110a`. Variables en `:root` de `styles.css` (también las usa `admin.css`).
- **Tipografías:** Cormorant Garamond 500 (número de teléfono) y Manrope variable (etiquetas y aviso legal), `woff2` latino autoalojado en `public/fonts/` (OFL), `font-display: swap`, precarga de Cormorant.
- **Reglas de Animación:** `--ease-luxury` `cubic-bezier(0.22, 1, 0.36, 1)`; portada con acercamiento de 2,6 s y entrada del logo; fotos de la galería aparecen al entrar en pantalla (solo con JS); con `prefers-reduced-motion` todo se anula.

---

## 3. Arquitectura y Stack Actual
- **Entorno / Framework:** HTML + CSS + JavaScript sin framework ni build (constitución VI). Node.js ≥ 18.17 solo para herramientas.
- **Hosting y Despliegue:** _(pendiente: el usuario no lo ha decidido)_
- **Librerías Instaladas Clave:** web: ninguna. Herramientas: `sharp` (devDependency).
- **Mapa del código:**
  - `index.html` — CSP en `<meta>`, sprite SVG (Phosphor light, MIT), cabecera (aparece al salir de la portada), portada estática (`public/img/portada/1-3`), galería `<ul id="galeria-rejilla">` (la rellena JS), contacto (fondo `portada/4`), pie con "Aviso legal", botón flotante de WhatsApp, `<dialog id="visor">`.
  - `aviso-legal.html` + `legal.css` — única página legal, neutra, con campos `[COMPLETAR]`.
  - `styles.css` (tokens, portada, galería en columnas 2/3/4, contacto, pie, flotante) · `visor.css`.
  - `data/galeria.js` — `CONTACTO` (3 números), `PORTADA` (4 posiciones), `PRENDAS` (`id`, `descripcion` = alt, `imagenes`). `data/fotos-optimizadas.js` — generado: `[ancho, alto]` por foto.
  - `lib.js` (`sanitize`, `getFotos`, `enlaceTel`, `enlaceWhatsApp`) · `app.js` (contacto, galería, segunda foto al pasar el ratón, entradas, cabecera/flotante) · `visor.js` (visor).
  - `admin.html|js|css` — panel local: descripción, fotos, oculta; exporta `galeria.js` y copia privada `.json`.
  - `scripts/optimizar-imagenes.js` (+ `imagenes-extra.js`: logo transparente, favicon, huellas, revisión) · `scripts/verificar.js` (puerta de calidad) · `scripts/servidor.js` (local, recarga por `/__recargar.js`) · `scripts/datos.js` (lectura compartida).
  - `public/fotos/` originales (no se publican) · `public/img/` generado · `public/fonts/`.
- **Variables de entorno:** ninguna.
- **Comandos:** `npm run optimizar` · `npm run verificar` · `npm run dev`.
- **Metodología:** Spec-Driven Development con GitHub Spec Kit. Integración Claude Code con scripts PowerShell y extensión `git` (rama `NNN-nombre` por funcionalidad).
  - `.specify/memory/constitution.md` — constitución v1.0.0 (6 principios).
  - `.claude/skills/speckit-*` — comandos del ciclo.
  - `specs/` — una carpeta `NNN-nombre` por funcionalidad.

---

## 4. Registro de Decisiones Arquitectónicas (ADR)
- **2026-11-16 — Inicialización:** proyecto existente adaptado a `plantilla-agentes` (Spec Kit + git; commit inicial con la web anterior para poder recuperarla). Sin `@Agent-LeadGen-CRO` ni §6: la web no capta ni vende.
- **2026-11-16 — Web informativa (001):** fuera textos de venta, sección Atelier, fotos de Unsplash, nombres, referencias, categorías, filtros y mensajes de WhatsApp; `catalogo.js` → `galeria.js`; legal en una sola página. Galería en columnas sin recorte (proporciones de 0,50 a 1,07); portada estática para el LCP; sin recursos de terceros. Detalle en `specs/001-web-informativa/research.md`.

---

## 5. Estado de Auditoría Continua (Checklist de Control)
### Rendimiento (Core Web Vitals)
- [x] Imágenes WebP con `srcset`/`sizes` y dimensiones explícitas (AVIF pendiente en 002).
- [x] Fuentes autoalojadas con `display: swap` y precarga.
- [x] Primera pantalla móvil ≈ 420 KB (390×844, Edge sin ventana).
- [ ] Medir con PageSpeed/Lighthouse una vez desplegado.

### Seguridad (SecOps)
- [x] Sin entradas de usuario en la web (no aplica Zod); el panel valida id y campos.
- [x] Sin `.env` ni secretos.
- [x] CSP `default-src 'self'` en `<meta>`, sin código en línea; 0 peticiones a terceros.
- [ ] Cabeceras HTTP (HSTS, X-Frame-Options/frame-ancestors, nosniff, Referrer-Policy) en el servidor (003).
- [x] Sin formularios públicos (no aplica rate limiting/CSRF).

### SEO Técnico
- [x] Un único `<h1>` (logo con `alt="SLAC"`), `h2` para lectores de pantalla.
- [x] Title y description neutros, OpenGraph básico. Canonical y `og:image` cuando haya dominio.
- [ ] JSON-LD `WebSite` + `ImageGallery` (003).
- [ ] `sitemap.xml` cuando haya dominio; `robots.txt` presente.

---

## 6. Lecciones Aprendidas y Reglas del Usuario (Anti-Patrones)
- **Preferencia de código:** Directo al grano, sin abstracciones innecesarias ni dependencias pesadas si se resuelve con APIs nativas.
- **Flujo:** el usuario pide los cambios con sus palabras; el agente los pasa por el ciclo Spec Kit completo.
- **Contenido:** la web es meramente informativa. Nada de textos de venta, precios, normativa visible ni pistas de negocio o tienda, tampoco en `alt`, metadatos ni comentarios de archivos publicados. WhatsApp sin mensaje. Aviso legal discreto en el pie (decisión del usuario, 2026-11-16).
- **Pruebas sin ventana:** el servidor local mantiene abierta la conexión de recarga (EventSource): en Puppeteer usar `waitUntil: 'load'`, no `networkidle0`. Edge: `C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe` con `puppeteer-core` instalado fuera del proyecto.
- **Visor:** una `<img>` con `max-height: 100%` dentro de una fila de rejilla no se limita; se centra con `position: absolute; inset: 0; margin: auto` y `max-*`.
