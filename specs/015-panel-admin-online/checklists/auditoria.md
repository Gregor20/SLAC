# Auditoría de la funcionalidad 015 (panel de administración online)

Resultados de las validaciones manuales y automáticas, por historia. Se completa durante la implementación y se cierra con `/speckit-checklist seguridad`, `rendimiento` y `seo`.

## US1 — Activar y desactivar fotos desde el móvil (T027)

Entorno: `wrangler dev --local` (D1 y R2 locales, `ACCESS_DEV_EMAIL`), Edge sin ventana (puppeteer-core), 2026-11-17. Con las miniaturas de 4 prendas subidas al R2 local (el resto da 404 y el panel deja el hueco).

- [X] Sin desplazamiento horizontal a 320, 360, 768 y 1920 px (SC-007), 37 prendas.
- [X] Sin errores de consola al cargar a esos cuatro anchos.
- [X] Activar una prenda desde el móvil (toque) → «Guardado»; interruptor, nota «Visible · por … · fecha» y resumen coinciden con el servidor.
- [X] Desactivar una foto: la prenda sigue visible con las demás (US1.5); sin fotos activas → «Sin fotos visibles: no se muestra».
- [X] Los `<details>` abiertos y el foco no se pierden al guardar (la lista se actualiza en su sitio).
- [X] Prenda «En portada»: ocultar abre la confirmación (foco inicial en «Cancelar»); Esc la cierra y deja prenda y servidor como estaban; «Ocultar» guarda.
- [X] Sin conexión: avisa «No se pudo guardar. Inténtalo de nuevo.», el interruptor vuelve a su valor y el servidor no cambia.
- [X] Teclado: la barra espaciadora activa el interruptor y el foco se mantiene.
- [X] `prefers-reduced-motion` anula las transiciones.
- [X] Zonas táctiles ≥ 44 px (mínimo medido 44).
- [ ] Contraste AA y lector de pantalla: pendiente de la auditoría `/speckit-checklist seguridad|rendimiento` (FR-014).
- [X] Reflejo en la web pública: cerrado en US2 (T039; 2 s en local, la medición real entre aislados queda para producción).

Notas:
- La guía `dialog` de Modern Web Guidance se aplicó tal cual (`showModal()`, `aria-labelledby`, `autofocus` en la acción segura, sin polyfills); `switch` y `form-factor-adaptation`, según `research.md`.
- `/%70anel/index.html` (ruta con la «p» codificada) → pendiente de comprobar en producción (T044): ver nota de T016.

## US2 — Una foto desactivada es imposible de ver (T039)

Entorno: `wrangler dev --local` con `dist/` regenerado (1,5 MB: sin fotos ni datos de prendas), R2 local con las prendas 1, 3 y 12 (56 archivos), Edge sin ventana, 390 px, 2026-11-17.

- [X] Con 0 prendas visibles: la portada y el teléfono siguen; la galería queda vacía, sin texto (principio I) ni errores de consola.
- [X] Activar las prendas 1 y 3 desde el panel: la web las muestra en orden, con número sin ceros, y sus fotos salen de `/f/…` (AVIF) con contador 5 y 2. Reflejo medido: 2 s.
- [X] Enlace directo: prenda activa → 200; prenda no activada → 404; `public/img/<id>/…` ya no existe (404).
- [X] Desactivar la foto 1 (la de la miniatura): su enlace directo → 404 y las demás siguen; la miniatura pasa a la foto 2, el contador baja a 4 y el visor muestra «1 / 4» sin imágenes rotas ni la foto oculta.
- [X] Desactivar y reactivar la prenda conserva el estado de cada foto (US1.6); reactivar la foto la devuelve al instante.
- [X] Ocultar la prenda: desaparece de la galería, del HTML y de `/api/prendas.js`; 5 enlaces directos (`avif`/`webp`, varios anchos y fotos) → 404.
- [X] Caché de las fotos: `Cache-Control: public, max-age=30`, sin `immutable`.
- [X] `dist/` sin `public/img/<id>/`, sin `data/fotos-optimizadas.js` y con `data/galeria.js` sin prendas (`verificar` lo comprueba).
- [ ] Caída de D1 simulada de extremo a extremo: no se hizo en `wrangler dev` (no se puede apagar D1 local sin tocar la base en uso); la regla «fail closed» está cubierta por `estado.test.js`, `api-publica.test.js` e `imagenes.test.js` (D1 caído: lista vacía con `no-store`, 404 uniforme).
- [ ] Propagación entre aislados (≤ 10 s de caché del estado + 30 s de caché de fotos): solo se puede medir en producción (quickstart §3, fila 3).

Notas de la subida a R2 (`scripts/subir-imagenes.js`):
- El R2 local falla con escrituras simultáneas (HTTP 500): en `--local` se sube de una en una (≈ 2,6 s por archivo; `--solo=001,003` para pruebas). En remoto, 4 a la vez.
- `--simular` en remoto: 679 archivos (97 fotos × 7). La primera subida real queda para el despliegue (T041-T042, a cargo de la titular).

## US3 — Identificación y control de acceso en producción (T043-T044)

Entorno: `slac-official.com`, 2026-11-17. Access creado con el MCP de Cloudflare; secretos puestos por la titular.

- [X] `/` y `/api/prendas.js` públicos (200, sin login); `/panel`, `/panel/`, `/panel/*` y `/api/admin/*` redirigen al login de Access.
- [X] Variantes de la ruta (`/%70anel`, `/PANEL`, `/Panel/`, `//panel/`, `/panel%2f`, `/api/%61dmin/estado`, `/API/admin/estado`) → todas al login (cierra la nota de T016). `/api/admin%2festado` → 404 (no es la API).
- [X] Un `Cf-Access-Jwt-Assertion` falso o un correo falsificado en cabeceras no dan acceso ni datos.
- [X] Entrar con código por correo funciona desde el móvil (titular, 2026-11-17).
- [ ] Entrar desde un ordenador distinto: pendiente de confirmar.
- [X] `robots.txt` y `sitemap.xml` sin mención del panel; `workers_dev` en `false`.
- [ ] Correo no autorizado denegado: pendiente de probar con un correo ajeno.
- [ ] Alta y baja de un segundo correo con «Revocar tokens» en < 5 min: pendiente.

Incidencia hallada y corregida (commit `7bf9260`): con el Worker en frío, varias miniaturas del panel recibían 403 en el móvil porque las peticiones simultáneas no esperaban la descarga de las claves de Access. Prueba nueva con 20 peticiones simultáneas en `worker/test/acceso.test.js`; 104 pruebas en verde.

## US4 — La web pública no cambia (T048)

- [X] Cabeceras en páginas, imágenes y API: HSTS, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, `frame-ancestors 'none'`; CSP completa en la `<meta>` (`default-src 'self'`).
- [X] 0 recursos de terceros y 0 cookies en la web pública (solo `CF_AppSession`, en `/panel`).
- [X] Lighthouse móvil: 100 / 100 / 100 / 100; FCP 1,2 s, LCP 1,5 s, TBT 0 ms, CLS 0; 35 peticiones.
- [ ] Peticiones/día del Worker frente a 100.000: sin medir.

## Cierre (T056)

- `checklists/seguridad.md`, `rendimiento.md` y `seo.md` generadas (puntos a revisar por la titular). Los «Gap» pasan a `/speckit-converge`.
- `legacy-scan`: 5 hallazgos. Corregido `panel/panel-api.js` (`AbortSignal.timeout`); el cambio aún no está desplegado y se comprobará con el panel abierto tras el próximo despliegue. Justificados por ser anteriores a la 015: `visor.js:79` y `:103`, `admin.js:9` y `:10`.
