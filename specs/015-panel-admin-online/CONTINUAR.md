# Traspaso de la 015 (panel online) — estado a 2026-11-17

> Sin identificadores de cuenta, AUD, equipo de Access ni correos (ADR 013). Los reales están solo en `wrangler.jsonc` local (ignorado por git) y en los secretos del Worker.

## Dónde trabajar
- Worktree `C:\Users\grygo\OneDrive\Escritorio\MIS_COSAS\WEBS\slac-panel`, rama `015-panel-admin-online`. La carpeta `slac` está en `main`: **no tocar `main`** hasta T060.
- **Hay cambios sin commitear** (T040-T054, `tasks.md`, este archivo). No usar `git checkout -- <archivo>`, `git restore` ni `git stash drop`: se perderían. Primero `git status`, luego commit por fase (`/speckit-git-commit`).
- Node 24, wrangler 4.163 ya autenticado en la máquina (`npx wrangler whoami`). `npm test` = 103 pruebas; `npm run verificar` en verde.

## Ya hecho en Cloudflare (2026-11-17)
- D1 `slac-estado` creada y migrada (remoto). Bucket R2 privado `slac-fotos` con 679 archivos (`npm run subir-imagenes`, manifiesto local `.r2-manifiesto.json`).
- Carga inicial: las 37 prendas **visibles** (`prenda_estado.por = 'carga-inicial'`, `meta.version = 1`). Las prendas nuevas siguen naciendo ocultas (FR-009).
- Worker `slac` desplegado con `npx wrangler deploy -c wrangler.jsonc` (versión al 100 %). `slac-official.com` sirve la web: `/` 200, `/api/prendas.js` con 37 prendas, `/f/…` 200, `admin.html` 404, `www` → 301.
- `/panel/` y `/api/admin/*` dan **403** porque aún no existen los secretos ni la aplicación de Access (cierra en seguro).

## Pendiente
1. **T043 (Cloudflare, la titular o el MCP de Cloudflare):** aplicación Access self-hosted «SLAC panel» en `slac-official.com`, rutas `panel*` y `api/admin/*` (una entrada por ruta), política Allow por correos, código de un solo uso, sesión 12 h. Anotar el AUD y el nombre de equipo.
2. **Secretos (solo la titular, en su terminal; no pasan por el chat):** `npx wrangler secret put ACCESS_AUD -c wrangler.jsonc` y `ACCESS_TEAM_DOMAIN -c wrangler.jsonc` (valor `https://<equipo>.cloudflareaccess.com`).
3. **T044** validar US3 en producción (quickstart §3 filas 1, 2, 5, 6, 7): correo no autorizado denegado; `curl` sin sesión nunca da datos; alta y baja de un segundo correo con «Revocar tokens» en < 5 min. Anotar en `checklists/auditoria.md`.
4. **T048** US4: `curl -I` de cabeceras (`_headers` y Worker), 0 terceros y 0 cookies, Lighthouse móvil ≥ 95, vigilar peticiones/día (< 100.000). **T052** US5 en producción (el registro muestra el correo).
5. Revisar el panel **en un navegador** a 360-1920 px (solo se ha probado la API con `wrangler dev`, no la vista).
6. **Cierre (T055-T060):** `npm test` + `npm run verificar` + `npm run publicar`; `/speckit-checklist seguridad|rendimiento|seo` (incluido `legacy-scan`); quickstart §1-§4; `/speckit-analyze` y `/speckit-converge` hasta `Converged`; **T059** actualizar `MEMORY.md` (ADR 015, mapa del código `worker/`, `panel/`, `scripts/subir-imagenes.js`, `wrangler.ejemplo.jsonc`, `comprobar-panel.js`, stack con `-c wrangler.jsonc`, §5 cabeceras HTTP ya cubiertas, constitución 1.5.1); **T060** traer `main` a la rama, pedir confirmación y `git merge --no-ff`.

## Trampas conocidas
- **Nunca** `wrangler deploy` sin `-c wrangler.jsonc` ni `wrangler pages …` (ADR 010: subiría la carpeta entera).
- `npm run optimizar` tarda ~5 min y `npm run subir-imagenes` más de 10: lanzarlos en segundo plano; no usar `timeout` ni `| tail` que oculte el progreso. Con `-- --simular` se ve qué falta sin subir nada.
- Tras desplegar, las imágenes de R2 pueden dar 404 unos segundos por propagación.
- Los archivos que sirve `/panel/*` están en la lista `ARCHIVOS` de `worker/src/panel-estatico.js`: un `.js`/`.css` nuevo en `panel/` debe añadirse allí (hay una prueba que lo vigila).
- Ningún archivo ≤ 200 líneas (constitución VI); los `.bat` van en CRLF y el resto en LF (en Windows, Python/`sed -i` pueden cambiar los saltos de línea).
- Antes de cualquier `git push`: `git grep` de teléfono, correo, domicilio, Instagram, cuenta, AUD y equipo = 0 (ADR 013).
- Estado local de `wrangler dev` (`.wrangler/`, `.dev.vars`) está ignorado; el D1 local tiene datos de prueba de la 027.
