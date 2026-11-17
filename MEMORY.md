# MEMORY.md — Memoria Persistente y Contexto del Proyecto

> **Instrucción para el Agente:** Lee este archivo al inicio de cada sesión y actualízalo automáticamente al finalizar cualquier tarea importante (nuevas rutas, cambios en el sistema de diseño, integraciones o auditorías).
>
> **Reparto con Spec Kit:** aquí va el *estado* del proyecto (qué hay y por qué). Los principios innegociables están en `.specify/memory/constitution.md`, el flujo de trabajo en `AGENTS.md` §5 y el detalle de cada funcionalidad en `specs/NNN-nombre/`. No duplicar aquí specs ni planes: enlazarlos.

---

## 1. Identidad del Proyecto
- **Nombre del Proyecto:** SLAC (carpeta `slac`)
- **Objetivo:** web meramente informativa: fotos de las prendas, su número (solo cifras, sobre la foto) y un teléfono de contacto (llamada y WhatsApp sin mensaje). Sin textos de venta, precios, normativa visible ni nada que sugiera un negocio o una tienda (constitución, principio I).
- **Público Objetivo:** personas que llegan por enlace directo o redes y quieren ver las prendas desde el móvil.
- **Keywords Principales (SEO):** SLAC, vestidos, monos, conjuntos de fiesta (siempre en tono neutro, sin términos comerciales).
- **Datos reales (005):** teléfono y WhatsApp en `CONTACTO` (`data/galeria.js`); aviso legal con titular SLAC e Instagram como enlace (011), sin NIF. En el repositorio van como marcadores (`+34 000 000 000`, `[INSTAGRAM]`); los reales solo existen en local (ADR 007).
- **Dominio (008):** https://slac-official.com (aplicado con `npm run dominio`: canonical, og, sitemap, robots y JSON-LD). Correo del titular en el aviso legal: real solo en local, `[CORREO]` en el repo (mismo filtro que ADR 007).
- **Titular completo (009):** correo y domicilio reales solo en local (`[CORREO]`, `[DOMICILIO]` en el repo). Ya no queda nada pendiente de datos.

---

## 2. Sistema de Diseño (Design Tokens Activos)
- **Dirección Estética:** lujo oscuro y editorial: las fotos mandan; negro cálido y el dorado del logo; casi sin texto (constitución I y II).
- **Paleta de Colores:** fondo `#0a0908`, superficies `#141210`/`#1b1815`, dorado `#d4af37` y `#e5c158` (texto dorado ≈ 11:1 sobre el fondo), texto `#eae6df`, secundario `#a29d95` (≈ 7:1), texto sobre dorado `#15110a`. Variables en `:root` de `styles.css` (también las usa `admin.css`).
- **Tipografías:** Cormorant Garamond 500 (número de teléfono) y Manrope variable (etiquetas y aviso legal), `woff2` latino autoalojado en `public/fonts/` (OFL), `font-display: swap`, precarga de Cormorant.
- **Indicador de la portada:** `.portada-bajar` es una línea dorada animada sin texto que enlaza a la galería (nombre accesible "Ver las fotos"). Se mantiene: invita a bajar sin añadir texto visible (revisado en la convergencia de 001 frente a FR-001).
- **Reglas de Animación:** `--ease-luxury` `cubic-bezier(0.22, 1, 0.36, 1)`; portada con acercamiento de 2,6 s y entrada del logo; fotos de la galería aparecen al entrar en pantalla (solo con JS); con `prefers-reduced-motion` todo se anula.

---

## 3. Arquitectura y Stack Actual
- **Entorno / Framework:** HTML + CSS + JavaScript sin framework ni build (constitución VI). Node.js ≥ 18.17 solo para herramientas.
- **Hosting y Despliegue:** Cloudflare Worker `slac` con recursos estáticos (`dist/`), D1 `slac-estado` y bucket R2 privado `slac-fotos`, en `https://slac-official.com` (`workers_dev: false`; `www` redirige a la raíz). La configuración real vive en `wrangler.jsonc` (ignorado por git; el modelo es `wrangler.ejemplo.jsonc`). **Despliegue siempre con `npx wrangler deploy -c wrangler.jsonc`; NUNCA sin `-c` ni con `wrangler pages ...`** (su autoconfiguración subió una vez la carpeta entera, ADR 010). Pasos: `npm run optimizar` → `npm run publicar` (genera `dist/` y `worker/src/galeria.generated.js`) → `npm run subir-imagenes` (R2) → `npx wrangler deploy -c wrangler.jsonc`. El panel `/panel` y `/api/admin/*` va detrás de Cloudflare Access (código por correo, sesión de 12 h) y el Worker revalida el JWT. Las fotos de prendas solo salen del Worker (`/f/…`); no están en `dist/`.
- **Librerías Instaladas Clave:** web: ninguna. Worker: JS plano sin dependencias de ejecución (Web Crypto para el JWT). Herramientas (devDependencies): `sharp`, `wrangler`. Guía de desarrollo (no es dependencia): Modern Web Guidance por `npx`.
- **Mapa del código:**
  - `index.html` — CSP en `<meta>`, sprite SVG (Phosphor light, MIT), cabecera (aparece al salir de la portada), portada de fondo único (`public/img/slac/fondo-escritorio|movil-*`, 016; `public/img/portada/1-3` ya no se usa en la web, solo en `og-cover`), galería `<ul id="galeria-rejilla">` (la rellena JS), contacto (fondo `portada/4`), pie con "Aviso legal", botón flotante de WhatsApp, `<dialog id="visor">`.
  - `aviso-legal.html` + `legal.css` — única página legal, neutra, con campos `[COMPLETAR]`.
  - `styles.css` (tokens, portada, galería en columnas 2/3/4, contacto, pie, flotante) · `visor.css`.
  - `data/galeria.js` — `CONTACTO` (3 números), `PORTADA` (4 posiciones), `PRENDAS` (`id`, `descripcion` = alt, `imagenes`). `data/fotos-optimizadas.js` — generado: `[ancho, alto]` por foto, `anchos` (WebP) y `anchosAvif`.
  - `lib.js` (`sanitize`, `numeroPrenda` = id sin ceros, `getFotos` → `srcset` + `srcsetAvif`, `fotoHTML`/`fotoElemento` → `<picture>`, `enlaceTel`, `enlaceWhatsApp`) · `app.js` (contacto, galería, segunda foto al pasar el ratón, entradas, cabecera/flotante) · `visor.js` (visor).
  - Número de la prenda (004): `.pieza-id` (esquina sup. izquierda de la foto, `app.js`/`styles.css`) y `.visor-id` (barra del visor, `index.html`/`visor.js`/`visor.css`); `verificar` exige id de 1-4 cifras y sin repetir por valor.
  - `admin.html|js|css` — panel local: id numérico de 1-4 cifras, descripción, fotos, oculta; exporta `galeria.js` y copia privada `.json`.
  - `scripts/dominio.js` (`npm run dominio -- https://…`: sitemap.xml, `Sitemap:` en robots.txt, canonical/og entre los marcadores `DOMINIO:INICIO/FIN` de `index.html`, `url`/`image` del JSON-LD; repetible) · `scripts/comprobar-seo.js` (JSON-LD, tipos permitidos, coherencia dominio/sitemap; lo usa `verificar`).
  - `scripts/optimizar-imagenes.js` (+ `imagenes-extra.js`: logo transparente, favicon, `og-cover.jpg`, huellas, revisión) · `scripts/verificar.js` (puerta de calidad) · `scripts/servidor.js` (local, recarga por `/__recargar.js`) · `scripts/datos.js` (lectura compartida).
  - `fotos-slac/` originales entregados (016) → `scripts/preparar-fotos-slac.js` (separa collages/parejas y quita "BOUTIQUE" de body-11..14 → `public/fotos/slac-<prenda>-<n>.jpeg`) · `scripts/optimizar-fotos-slac.js` (fondo de portada).
  - `public/fotos/` originales (no se publican) · `public/img/` generado · `public/fonts/`.
  - `worker/src/` (015, módulos ES, ≤ 200 líneas): `index.js` → `enrutador.js` (orden de comprobaciones: panel y `/api/admin/*` primero con JWT, luego CSRF y límite, luego `/f/*` y `/api/prendas.js`, cabeceras en toda respuesta) · `acceso.js` (JWT de Access con Web Crypto; las peticiones simultáneas comparten la descarga de claves) · `visibilidad.js` (regla pura prenda × foto) · `estado.js` (D1, caché de 10 s, *fail closed*) · `api-admin.js`, `miniaturas.js`, `registro.js` · `api-publica.js`, `imagenes.js` (404 uniforme) · `panel-estatico.js` (lista de archivos de `/panel/*`) · `seguridad.js` (cabeceras, `Origin`, validación, límite). `galeria.generated.js` lo genera `publicar` (ignorado por git). `worker/migraciones/0001_estado.sql` (tablas `prenda_estado`, `foto_estado`, `registro`, `meta`). Pruebas en `worker/test/` y ayudas en `worker/test-ayudas/` (`npm test`).
  - `panel/` (015) — `index.html`, `panel.css`, `panel.js`, `panel-api.js`, `panel-lista.js`, `panel-registro.js`: panel online (interruptores por prenda y foto, «En portada», registro de cambios). Un `.js` o `.css` nuevo debe añadirse a `ARCHIVOS` de `worker/src/panel-estatico.js`.
  - `scripts/subir-imagenes.js` (sube a R2 lo que cambió; manifiesto local `.r2-manifiesto.json`, ignorado) · `scripts/galeria-worker.js`, `comprobar-publicacion.js`, `comprobar-worker.js`, `comprobar-panel.js` (los usa `verificar`/`publicar`) · `wrangler.ejemplo.jsonc` (sin identificadores reales).
- **Variables de entorno:** Worker: `HOST_PERMITIDO` (variable pública, en `wrangler.jsonc`) y los secretos `ACCESS_AUD` y `ACCESS_TEAM_DOMAIN` (se ponen con `npx wrangler secret put … -c wrangler.jsonc`; nunca en el repositorio ni en el chat). `ACCESS_DEV_EMAIL` solo en `.dev.vars` local (ignorado) y solo vale en `localhost`.
- **Comandos:** `npm run optimizar` · `npm run preparar:slac` · `npm run optimizar:slac` · `npm run verificar` · `npm test` (pruebas del Worker, `node --test`) · `npm run dev` · `npm run publicar` (genera `dist/`) · `npm run subir-imagenes` (R2) · `PUBLICAR.bat` (todo el proceso). Worker local: `npx wrangler dev -c wrangler.jsonc`.
- **Metodología:** Spec-Driven Development con GitHub Spec Kit. Integración Claude Code con scripts PowerShell y extensión `git` (rama `NNN-nombre` por funcionalidad).
  - `.specify/memory/constitution.md` — constitución v1.5.1 (6 principios).
  - `.claude/skills/speckit-*` — comandos del ciclo.
  - `.claude/settings.json` — configuración compartida: `DISABLE_TELEMETRY=1`, marketplace `googlechrome` y plugin `modern-web-guidance@googlechrome` habilitado. Regla de uso en `AGENTS.md` §5.
  - `specs/` — una carpeta `NNN-nombre` por funcionalidad.

---

## 4. Registro de Decisiones Arquitectónicas (ADR)
- **2026-11-16 — Inicialización:** proyecto existente adaptado a `plantilla-agentes` (Spec Kit + git; commit inicial con la web anterior para poder recuperarla). Sin `@Agent-LeadGen-CRO` ni §6: la web no capta ni vende.
- **2026-11-16 — Web informativa (001):** fuera textos de venta, sección Atelier, fotos de Unsplash, nombres, referencias, categorías, filtros y mensajes de WhatsApp; `catalogo.js` → `galeria.js`; legal en una sola página. Galería en columnas sin recorte (proporciones de 0,50 a 1,07); portada estática para el LCP; sin recursos de terceros. Detalle en `specs/001-web-informativa/research.md`.
- **2026-11-16 — Optimización de fotos (002):** AVIF q50 (480/800/1200) con WebP de respaldo vía `<picture>`; miniaturas de 160 px solo WebP; logo 54 → 30 KB; `og-cover.jpg` 1200×630 sin texto (para `og:image` cuando haya dominio). Medición y detalle en `specs/002-optimizacion-fotos/research.md`. Enlaces del teléfono sin `aria-label` (el texto visible es el número, WCAG 2.5.3).
- **2026-11-16 — Modern Web Guidance (003):** herramienta de Google Chrome que da a los agentes patrones modernos de la plataforma web. Se usa por `npx modern-web-guidance@latest` (`search`/`retrieve`/`legacy-scan`), sin añadirla a `package.json`; se consulta en plan (→ `research.md`), implementación y auditoría (`legacy-scan` → `checklists/`). La constitución prevalece (v1.1.0). Telemetría de Google desactivada y consultas genéricas; sin `.mwgrc` (nada experimental). Plugin habilitado por `.claude/settings.json`, sin instalar a nivel de usuario. Línea base de `legacy-scan` (deuda para una funcionalidad futura): `visor.js:99` (`<dialog closedby>`, comprobar Safari), `visor.js:75` (`replaceChildren`), `admin.js:9-10` (`structuredClone`). Detalle en `specs/003-modern-web-guidance/research.md`.

- **2026-11-16 — Número en la foto (004):** constitución 1.2.0 permite un único dato nuevo: el número de la prenda (su `id` sin ceros, solo cifras, superpuesto como texto, no en la imagen; portada y `og-cover` sin número). En el visor va en la barra superior (la foto se centra con tamaño variable) y el contador pasa a la derecha. Detalle en `specs/004-numero-en-foto/`. Lighthouse móvil: 99/100/100/100, CLS 0.
- **2026-11-16 — Datos reales (005):** teléfono real en `CONTACTO` (única fuente); el aviso legal pasa a titular SLAC + Instagram como texto (la constitución IV solo admite `tel:` y `wa.me` como enlaces; el Instagram no va en la página principal por el principio I); fila NIF eliminada; desaparece el aviso de teléfono provisional de `verificar`. Detalle en `specs/005-datos-reales-contacto/`.
- **2026-11-16 — JSON-LD y sitemap (006):** `@graph` con `WebSite` + `ImageGallery` (solo esos tipos, constitución V; sin teléfono ni prendas). Sin dominio no existe `sitemap.xml` ni canonical (nada de direcciones inventadas); `npm run dominio` lo genera todo y `verificar` exige coherencia (canonical ↔ sitemap ↔ robots ↔ JSON-LD) y admite como único externo el host de la canonical. Detalle en `specs/006-json-ld-sitemap/`. Lighthouse móvil 98/100/100/100, CLS 0.
- **2026-11-16 — Privacidad del repositorio (007):** el repo se publica en GitHub sin teléfono ni Instagram reales, tampoco en el historial (reescrito; copia previa en `../slac-respaldo-privado.bundle`, que contiene los datos: no subir ni compartir). Un filtro git `privado` (`.gitattributes` → `data/galeria.js` y `aviso-legal.html`; comandos `clean`/`smudge` con `sed` en `.git/config` y `.git/filtro-privado/`, solo locales) guarda marcadores al hacer commit y restaura los reales al sacar el archivo. **En otra máquina o clon nuevo** no existe el filtro: hay que reescribir los datos reales a mano o recrear `clean.sed`/`smudge.sed` y volver a sacar los dos archivos (`git checkout -- <archivo>`). Detalle en `specs/007-privacidad-repositorio/`.
- **2026-11-16 — Publicación en Cloudflare Pages (009):** `scripts/publicar.js` genera `dist/` solo con lo publicable (tras `verificar`), `_headers` con HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy, COOP y caché larga en `/public/*`. Despliegue desde local con wrangler, no por Git, por los marcadores del repo (ADR 007). Detalle en `specs/009-publicacion-cloudflare/`.
- **2026-11-16 — Despliegue en Workers (010):** `wrangler pages project create/deploy` delegó en Workers y su autoconfiguración publicó la carpeta del proyecto entera (755 archivos, con `admin.html`, originales y documentos); se eliminó el Worker a los pocos minutos y se revirtieron los cambios locales (`wrangler.jsonc`, `.assetsignore`, `package.json`). Despliegue correcto con `--assets dist` (538 archivos); comprobado: cabeceras de `_headers` activas, `admin.html`, `MEMORY.md`, `scripts/` y `public/fotos/` dan 404. Detalle en `specs/010-despliegue-workers/`.
- **2026-11-16 — Instagram como enlace (011):** constitución 1.3.0: el principio IV admite, solo en el aviso legal, el enlace al perfil de Instagram del titular (`target="_blank"`, `rel="noopener noreferrer"`); `verificar` permite `www.instagram.com` únicamente en `aviso-legal.html`. Sustituye la decisión «solo texto» del ADR 005. Detalle en `specs/011-instagram-aviso-legal/`.
- **2026-11-16 — PUBLICAR.bat (012):** doble clic para que otra persona publique tras usar el panel (`admin.html`): optimiza, `npm run publicar`, confirmación, `wrangler deploy --assets dist`. `publicar.js` se niega a generar `dist/` si quedan marcadores de datos de ejemplo (clon sin datos reales). `COMO-ACTUALIZAR-FOTOS.md` actualizado (mostrar/ocultar y publicar). Detalle en `specs/012-publicar-bat/`.
- **2026-11-16 — GitHub (013):** repositorio `https://github.com/Gregor20/SLAC.git`. Antes de subir se reescribió el historial: autor y committer con el correo `noreply` de GitHub (`Gregor20@users.noreply.github.com`, también en `git config` local) y sin el nombre de cuenta de Cloudflare en las URL `workers.dev` (`<cuenta>`). **Antes de cada `git push`**: `git grep` de teléfono, correo, domicilio, Instagram y cuentas sobre `$(git rev-list --all)` debe dar 0; no subir `slac-respaldo-privado.bundle` ni `dist/`. Detalle en `specs/013-subir-github/`.
- **2026-11-17 — Limpieza (014):** análisis con `npx knip` (no se añade como dependencia). Borrados `_backup-original/` (web anterior, recuperable del commit `ed6b316`), `contact-sheet.html` y las carpetas locales vacías `.agents/` y `.wrangler/`; recortado un `module.exports` de `scripts/datos.js` y las referencias a lo borrado (`servidor.js`, `AGENTS.md`). **Falsos positivos de knip que NO hay que borrar:** `admin.js`, `app.js`, `lib.js`, `visor.js` y `data/*.js` (los cargan los HTML con `<script src>`) y los exports de `scripts/imagenes-extra.js` (se usan como `extra.xxx`). `revision-por-modelo.html` la genera el optimizador: se conserva. `dist/` idéntico antes y después. Detalle en `specs/014-limpieza-repositorio/`.
- **2026-11-17 — Panel online (015):** el estado visible/oculta de prendas y fotos pasa a D1 y las fotos a un R2 privado; un Worker las sirve solo si la prenda y la foto están visibles (404 uniforme; ante cualquier fallo o duda, *fail closed*: todo oculto). El panel y su API van detrás de Cloudflare Access (aplicación «SLAC panel» con rutas `panel*` y `api/admin/*`, código de un solo uso por correo, sesión de 12 h) y el Worker revalida el JWT (firma, emisor, audiencia, caducidad, correo y `Host`); sin el JWT responde 403 vacío sin leer D1 ni R2. Cambios con `Origin`, `Sec-Fetch-Site`, `Content-Type`, cuerpo ≤ 64 bytes y 30 cambios/10 s por persona; cada cambio queda en `registro` con el correo. Quitar acceso: política de Zero Trust + «Revocar tokens» (< 5 min); el panel no gestiona personas. Excepción de FR-005 (FR-016): el fondo del contacto y `og-cover` son copias estáticas elegidas en local (`PORTADA`); el panel avisa antes de ocultar una prenda que sale en ellas. Constitución 1.5.0 y 1.5.1 (principios III, IV y VI). Los accesos y secretos (AUD, equipo, cuenta, correos) no entran en el repositorio. **Incidencia:** con el Worker en frío, las peticiones simultáneas de miniaturas recibían 403 porque no esperaban la descarga de las claves de Access; corregido y con prueba (`acceso.test.js`). Lighthouse móvil en producción: 100/100/100/100, 0 terceros, sin cookies en la web pública. Detalle, auditorías y pendientes en `specs/015-panel-admin-online/` (`CONTINUAR.md`, `checklists/`).

---

## 5. Estado de Auditoría Continua (Checklist de Control)
### Rendimiento (Core Web Vitals)
- [x] Imágenes AVIF (q50) con respaldo WebP en `<picture>`, `srcset`/`sizes` y dimensiones explícitas (002).
- [x] Fuentes autoalojadas con `display: swap` y precarga.
- [x] Primera carga móvil (390×844, 3×, Edge sin ventana): imágenes 433 KB (−40 % vs WebP), total 537 KB.
- [x] Lighthouse móvil local (002): rendimiento 99, accesibilidad 100, buenas prácticas 100, SEO 100 (LCP 2,1 s, CLS 0, TBT 0).
- [x] Lighthouse móvil en producción (015, 2026-11-17): 100/100/100/100; FCP 1,2 s, LCP 1,5 s, TBT 0, CLS 0. Falta vigilar las peticiones/día del Worker (< 100.000).

### Seguridad (SecOps)
- [x] Sin entradas de usuario en la web (no aplica Zod); el panel valida id y campos.
- [x] Sin `.env` ni secretos.
- [x] CSP `default-src 'self'` en `<meta>`, sin código en línea; 0 peticiones a terceros.
- [x] Cabeceras HTTP (HSTS, `X-Frame-Options: DENY`, nosniff, `Referrer-Policy`, `Permissions-Policy`, `frame-ancestors`) en páginas, imágenes y API: `_headers` + Worker (015).
- [x] Panel: Access delante + JWT validado en el Worker, CSRF por `Origin`, límite de frecuencia, validación estricta de entradas, `noindex`, sin secretos en el repositorio (`git grep` de AUD, equipo y cuenta = 0).
- [ ] Pendientes de la 015: probar un correo no autorizado, la baja de un segundo correo con «Revocar tokens» y el acceso desde otro ordenador (T044).
- [x] Sin formularios públicos (no aplica rate limiting/CSRF).

### SEO Técnico
- [x] Un único `<h1>` (logo con `alt="SLAC"`), `h2` para lectores de pantalla.
- [x] Title y description neutros, OpenGraph básico. Canonical y `og:image` cuando haya dominio (`public/img/og-cover.jpg` ya generada; etiquetas listas en un comentario de `index.html`).
- [x] JSON-LD `WebSite` + `ImageGallery` en `index.html` (006); `url`/`image` se añaden con el dominio.
- [ ] `sitemap.xml`, canonical y `og:image`: preparados, se generan con `npm run dominio -- https://dominio` (006); a la espera de dominio. `robots.txt` presente.

- **2026-11-17 — Galería agrupada y logo (016):** 14 imágenes de `fotos-slac/` → 22 fotos individuales en 11 prendas nuevas (027–037; `body-1` collage de 4, `body-5..9` parejas, `body-11..14` cuatro colores en un grupo). Portada: `portada.jpeg` como fondo único (recorte 9:16 para móvil); logo superpuesto más pequeño y bajo en móvil, oculto visualmente en escritorio (la imagen ya lo lleva). Constitución 1.4.0: se permite el lema de la portada y el rótulo "SLAC" dentro de las imágenes; "BOUTIQUE" se borró de las fotos. Las parejas separadas dan fotos estrechas (450×1600). Detalle en `specs/016-galeria-agrupada-logo/`.

---

## 6. Lecciones Aprendidas y Reglas del Usuario (Anti-Patrones)
- **Preferencia de código:** Directo al grano, sin abstracciones innecesarias ni dependencias pesadas si se resuelve con APIs nativas.
- **Flujo:** el usuario pide los cambios con sus palabras; el agente los pasa por el ciclo Spec Kit completo.
- **Sesiones en paralelo:** si hay otra sesión abierta en la carpeta principal, no cambiar su rama ni ejecutar `/plugin`/`install`; trabajar en un worktree (`git worktree add --detach ../slac-<nombre> main`). Antes de cerrar, traer `main` a la rama (puede haber avanzado) y avisar al usuario si hay que parar la otra sesión.
- **Guía web moderna:** consultas a Modern Web Guidance siempre genéricas y en inglés (solo la función de plataforma), sin datos del proyecto; si contradice la constitución, gana la constitución.
- **Contenido:** la web es meramente informativa. Nada de textos de venta, precios, normativa visible ni pistas de negocio o tienda, tampoco en `alt`, metadatos ni comentarios de archivos publicados. WhatsApp sin mensaje. Aviso legal discreto en el pie (decisión del usuario, 2026-11-16).
- **Pruebas sin ventana:** el servidor local mantiene abierta la conexión de recarga (EventSource): en Puppeteer usar `waitUntil: 'load'`, no `networkidle0`. Edge: `C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe` con `puppeteer-core` instalado fuera del proyecto.
- **Visor:** una `<img>` con `max-height: 100%` dentro de una fila de rejilla no se limita; se centra con `position: absolute; inset: 0; margin: auto` y `max-*`.
- **`<picture>` con `display: contents`:** los `<source>` hay que ocultarlos (`picture source { display: none }`) o la rejilla de la portada los cuenta como elementos y la foto deja de cubrir.
- **Ediciones de archivos:** los `.js`/`.html`/`.css` del proyecto están en LF; al editar con scripts, conservar los saltos de línea (en Windows, Python los convierte a CRLF y el diff sale entero).
- **Cloudflare por MCP:** el MCP `cloudflare-api` se autoriza con `/mcp` → Authenticate y los permisos se marcan en la pantalla del navegador (Access: Apps and Policies y Organizations en lectura, Zone, Workers). Si falta alguno da 403 en esa ruta y hay que reautenticar. El proveedor de «código por correo» (`onetimepin`) hay que crearlo; no existe por defecto. Los secretos del Worker los pone la titular en su terminal.
- **Worker en frío:** cualquier caché que se rellene con una descarga debe guardar la promesa en curso; si no, las peticiones simultáneas ven la caché vacía y se rechazan (pasó con las claves de Access y las miniaturas del panel en el móvil).
- **`npm run publicar` solo genera `dist/`:** el despliegue es un paso aparte (`npx wrangler deploy -c wrangler.jsonc`). Un cambio en `panel/` no llega a producción hasta desplegar.
