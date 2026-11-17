# Traspaso de la 015 (panel online) — estado a 2026-11-17 (tarde)

> Sin identificadores de cuenta, AUD, equipo de Access ni correos (ADR 013). Los reales están solo en `wrangler.jsonc` local (ignorado por git) y en los secretos del Worker.

## Dónde trabajar
- Worktree `C:\Users\grygo\OneDrive\Escritorio\MIS_COSAS\WEBS\slac-panel`, rama `015-panel-admin-online` (subida a GitHub). La carpeta `slac` está en `main`: **no tocar `main`** hasta T060.
- Commit y push solo si la titular lo pide. Antes de cualquier `git push`: `git grep` de AUD, equipo, cuenta y correos = 0.
- Node 24, wrangler autenticado en la máquina. `npm test` = 104 pruebas; `npm run verificar` en verde.
- El MCP `cloudflare-api` está añadido en el alcance local de la carpeta `slac`; en `slac-panel` puede no verse (`claude mcp add --scope user …` lo deja disponible en ambas).

## Ya hecho en Cloudflare
- D1 `slac-estado`, R2 `slac-fotos` (679 archivos) y Worker `slac` desplegados en `slac-official.com`; 37 prendas visibles.
- **T043 hecho:** aplicación Access «SLAC panel» (`panel*` y `api/admin/*`, código por correo, sesión 12 h, política Allow con dos correos) y secretos `ACCESS_AUD` / `ACCESS_TEAM_DOMAIN` puestos. Login probado desde el móvil.
- Producción: `/` y `/api/prendas.js` públicos; `/panel*` y `/api/admin/*` redirigen al login (también con rutas codificadas, mayúsculas y `//`); un JWT o un correo falsificados no dan acceso.
- Incidencia corregida (commit `7bf9260`): 403 en miniaturas con el Worker en frío.
- Lighthouse móvil 100/100/100/100, 0 terceros, sin cookies en la web pública.
- Auditorías generadas: `checklists/seguridad.md`, `rendimiento.md`, `seo.md` (puntos sin marcar: los revisa la titular). `legacy-scan`: 5 hallazgos, 1 corregido, 4 justificados. `/speckit-analyze` hecho (0 críticos). `/speckit-converge` hecho: **Fase 9, T061-T065**.
- T059 hecho (`MEMORY.md` actualizado).

## Pendiente
1. **T061:** desplegar el estado actual (`npm run publicar` y `npx wrangler deploy -c wrangler.jsonc`); producción aún lleva el `panel-api.js` anterior. Después, abrir el panel con sesión y comprobar que carga y guarda.
2. **T062 / T063:** reintento de miniaturas con recuadro y número; aviso de «recarga la página» si la sesión caduca.
3. **T064:** anotar el contraste medido (mínimo 6,56:1) y probar teclado y lector de pantalla.
4. **T065:** corregir la deriva documental (constitución v1.5.1, `AbortSignal.timeout`, módulos `enrutador.js`/`panel-estatico.js`, caso límite del Worker en frío).
5. **T044 (titular):** correo no autorizado, baja de un segundo correo con «Revocar tokens» en < 5 min, acceso desde otro ordenador. **T048:** vigilar peticiones/día (< 100.000). **T052:** registro con el correo en producción.
6. **Cierre:** T055 (puerta de calidad completa, web a 390 y 1440 px), T057 (quickstart §1-§4), T058 (analyze y converge hasta `Converged`), T060 (traer `main`, pedir confirmación y `git merge --no-ff`).

## Trampas conocidas
- **Nunca** `wrangler deploy` sin `-c wrangler.jsonc` ni `wrangler pages …` (ADR 010). `npm run publicar` solo genera `dist/`; el despliegue es aparte.
- `npm run optimizar` tarda ~5 min y `npm run subir-imagenes` más de 10: lanzarlos en segundo plano; no usar `timeout` ni `| tail` que oculte el progreso. Con `-- --simular` se ve qué falta sin subir nada.
- Tras desplegar, las imágenes de R2 pueden dar 404 unos segundos por propagación.
- Los archivos que sirve `/panel/*` están en la lista `ARCHIVOS` de `worker/src/panel-estatico.js`: un `.js`/`.css` nuevo en `panel/` debe añadirse allí (hay una prueba que lo vigila).
- Ningún archivo ≤ 200 líneas (constitución VI), salvo el generado `galeria.generated.js`; los `.bat` van en CRLF y el resto en LF.
- Estado local de `wrangler dev` (`.wrangler/`, `.dev.vars`) está ignorado; el D1 local tiene datos de prueba de la 027.
