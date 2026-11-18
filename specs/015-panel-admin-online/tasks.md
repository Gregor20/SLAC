# Tasks: Panel de administración online

**Input**: `specs/015-panel-admin-online/` — [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Prerequisites**: plan.md y spec.md (listos). **La enmienda de la constitución (T001) bloquea todo el código** (plan, Constitution Check).

**Tests**: el plan fija `node --test` (`npm test`) para las funciones puras del Worker y las pruebas de contrato; se incluyen. La integración se valida a mano con `wrangler dev` y en producción según [quickstart.md](quickstart.md).

**Convenciones**: archivos ≤ 200 líneas; JS sin `any`/sin dependencias de ejecución en el Worker; sin código en línea (CSP); texto del panel solo con el vocabulario permitido (prenda, foto, visible, oculta, número, cambio, guardado, error). Antes de escribir HTML/CSS/JS de plataforma, consultar Modern Web Guidance (guías ya fijadas en research.md: `switch`, `form-factor-adaptation`). Rutas relativas a la raíz del worktree `slac-panel`.

## Format: `[ID] [P?] [Story] Descripción con ruta`

- **[P]**: se puede hacer en paralelo (archivos distintos, sin dependencias pendientes)
- **[USn]**: historia de usuario de spec.md (US1 activar/desactivar, US2 imposible de ver, US3 acceso, US4 web pública intacta, US5 registro)
- *(manual)*: lo hace la titular en Cloudflare o en su máquina, no es código

---

## Phase 1: Setup

**Purpose**: gobernanza, dependencias y esqueleto.

- [X] T001 Enmendar la constitución a v1.5.0 con `/speckit-constitution` aplicando íntegro [contracts/enmienda-constitucion.md](contracts/enmienda-constitucion.md) (principios III, IV, VI, restricciones técnicas y puerta `npm test`) en `.specify/memory/constitution.md`; sin esto no se escribe código
- [X] T002 Añadir `wrangler` (≥ 4.36) como `devDependency` y los scripts `test` (`node --test`, sin argumentos: autodescubre `worker/test/*.test.js` en Node 18 a 24) y `subir-imagenes` (`node scripts/subir-imagenes.js`) en `package.json`; ejecutar `npm install`
- [X] T003 [P] Añadir a `.gitignore`: `wrangler.jsonc`, `.dev.vars`, `worker/src/galeria.generated.js`, el manifiesto local de huellas de R2 (`.r2-manifiesto.json`) y `.wrangler/`
- [X] T004 [P] Crear `wrangler.ejemplo.jsonc` con la configuración de [contracts/despliegue.md](contracts/despliegue.md) (`main`, `assets` con `run_worker_first: ["/api/*", "/f/*", "/panel", "/panel/*"]`, bindings `DB`, `FOTOS`, `LIMITE_CAMBIOS`, marcador `__ID_DE_D1__`, `workers_dev: false`, `vars.HOST_PERMITIDO: "slac-official.com"`, sin AUD, equipo, correo ni cuenta)
- [X] T005 [P] Crear la estructura vacía `worker/src/`, `worker/test/`, `worker/migraciones/`, `panel/` y `worker/package.json` con `{"private": true, "type": "module"}` (los módulos ES del Worker y sus tests funcionan en Node ≥ 18.17 sin tocar los scripts CommonJS de la raíz)

---

## Phase 2: Foundational (bloquea todas las historias)

**Purpose**: reglas puras, identidad, entradas, estado y enrutado base del Worker.

**⚠️ CRÍTICO**: ninguna historia puede empezar hasta terminar esta fase.

- [X] T006 Crear `worker/migraciones/0001_estado.sql` con las tablas de [data-model.md](data-model.md): `prenda_estado(id TEXT PK ^[0-9A-Za-z_-]{1,16}$, visible INTEGER CHECK 0/1, por TEXT ≤ 254 en minúsculas, en INTEGER ms Unix)`, `foto_estado(prenda, n INTEGER ≥ 1, visible 0/1, por, en, PK (prenda, n))`, `registro(id INTEGER PK AUTOINCREMENT, en, por, objeto TEXT CHECK 'prenda'|'foto', prenda, foto INTEGER NULL solo si objeto='foto', visible)` y `meta(id=1, version INTEGER)` con `INSERT meta(1, 0)`
- [X] T007 [P] Prueba en `worker/test/visibilidad.test.js`: prenda sin fila = oculta (FR-009); foto sin fila = activa; foto visible solo si prenda y foto lo están; prenda visible sin fotos activas = no se muestra; desactivar la prenda conserva el estado de cada foto
- [X] T008 [P] Implementar `worker/src/visibilidad.js` (funciones puras `fotoVisible(prenda, n)` y `prendaVisible(prenda)` según la regla de data-model.md, sin E/S) hasta pasar T007
- [X] T009 [P] Prueba en `worker/test/acceso.test.js` con claves RSA generadas en la prueba: acepta JWT válido; 403 por falta de cabecera, caducado (`exp`), aún no válido (`nbf`), `aud` o `iss` erróneos, firma alterada, `kid` desconocido (recarga una vez las claves y rechaza), sin `email`; `Host` distinto de `HOST_PERMITIDO` → rechazo aunque el JWT sea válido (solo `localhost` con `ACCESS_DEV_EMAIL` queda exento)
- [X] T010 Implementar `worker/src/acceso.js`: valida `Cf-Access-Jwt-Assertion` (RS256 con `crypto.subtle`, claves de `<ACCESS_TEAM_DOMAIN>/cdn-cgi/access/certs` en caché del aislado), exige `iss`, `aud`, `exp`/`nbf`, `email` (devuelto en minúsculas); exige además que el `Host` sea `env.HOST_PERMITIDO`; `ACCESS_DEV_EMAIL` solo se admite si el host es `localhost`; cualquier fallo → `null` sin detalle (hasta pasar T009)
- [X] T011 [P] Prueba en `worker/test/seguridad.test.js`: cabeceras comunes (HSTS, `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, COOP, `frame-ancestors 'none'` en no HTML); `Origin` ausente o ajeno → rechazo; `Sec-Fetch-Site` distinto de `same-origin` → rechazo; cuerpo > 64 bytes → 413; `Content-Type` no JSON → 415; cuerpo con campos extra o `visible` no booleano → 400; `id` con `../` o fuera de `^[0-9A-Za-z_-]{1,16}$` → rechazado; `n` fuera de 1…nº de fotos → 400
- [X] T012 Implementar `worker/src/seguridad.js`: `cabecerasSeguridad()`, `comprobarOrigen()`, `leerCuerpoVisible()` (≤ 64 bytes, `{"visible": true|false}` estricto), validadores de `id` y `n`, y límite de frecuencia por persona con el binding `LIMITE_CAMBIOS` (30 cambios / 10 s → 429 con `Retry-After`; si el binding no está disponible en el plan gratuito, respaldo contando en D1 las filas de `registro` de esa persona en la ventana de 10 s, sin tabla nueva) hasta pasar T011
- [X] T013 [P] Ampliar `scripts/publicar.js` para escribir `worker/src/galeria.generated.js` (`GALERIA` con `anchos`, `anchosAvif`, `prendas[{id, descripcion, fotos:[[ancho,alto]]}]` y `portada: [ids de PORTADA]`, formato de data-model.md; sin las prendas con «Oculta» local) a partir de `data/galeria.js` y `data/fotos-optimizadas.js` (usar `scripts/datos.js`)
- [X] T014 [P] Prueba en `worker/test/estado.test.js` con un D1 simulado: caché de 10 s; recarga por versión; error de D1 con estado < 60 s sigue sirviendo el último; error con estado > 60 s → todo oculto; si falla el registro la transacción no cambia el estado; repetir un valor no escribe
- [X] T015 Implementar `worker/src/estado.js` (hasta pasar T014): lectura de D1 con caché de 10 s en el aislado y recarga solo si cambia `meta.version` (1 fila); último estado correcto válido si tiene < 60 s; si no, **fail closed** (todo oculto); escritura de cambios con `DB.batch` (upsert de estado + `registro` + `meta.version + 1` en la misma transacción) e idempotencia (mismo valor → sin escribir)
- [X] T016 Crear `worker/src/index.js` (≤ 120 líneas): orden de comprobaciones del plan (1 ruta no gestionada → `env.ASSETS.fetch`; 2 `/panel*` y `/api/admin/*` → `Host` = `HOST_PERMITIDO` y JWT primero (403 de cuerpo vacío sin leer D1/R2), después CSRF y límite; 3 `/f/*`; 4 `/api/prendas.js`; 5 cabeceras de seguridad en toda respuesta; métodos no permitidos → 405; `catch` global → 500 genérico) con los manejadores como stubs 404 que rellenan las historias
- [X] T017 [P] Prueba de enrutado en `worker/test/rutas.test.js`: qué rutas pasan por el Worker; `/panel` y `/api/admin/*` sin JWT dan 403 sin llamar a D1 ni R2; método ajeno → 405; respuesta de error sin trazas

**Checkpoint**: `npm test` en verde; el Worker arranca con `npx wrangler dev -c wrangler.jsonc` (D1/R2 locales).

---

## Phase 3: User Story 1 — Activar y desactivar fotos desde el móvil (P1) 🎯 MVP (junto con US2)

**Goal**: la persona autorizada ve todas las prendas y fotos con su estado y los cambia con un gesto, desde 360 px.

**Independent Test**: en `wrangler dev` con `ACCESS_DEV_EMAIL`, abrir `/panel/`, activar y desactivar una prenda y una foto, recargar y comprobar que el estado persiste (quickstart §2, filas 2-5). El reflejo en la web pública lo cierra US2.

### Tests de US1

- [X] T018 [P] [US1] Prueba de contrato en `worker/test/api-admin.test.js`: `GET /api/admin/estado` devuelve la forma de [contracts/api-admin.md](contracts/api-admin.md) (`persona`, `version`, `prendas[].visible/efectiva/enPortada/cambio/fotos[]`, prendas sin fila `visible:false`, `numero` = id sin ceros); `PUT /api/admin/prendas/<id>` y `/fotos/<n>` con 200, idempotencia, 400 (campo extra, `visible` no booleano, `n` fuera de rango), 404 (id inexistente), 413, 415, 429, y ninguna escritura si falla la comprobación de `Origin`

### Implementación de US1

- [X] T019 [US1] Implementar `worker/src/api-admin.js` (≤ 200 líneas): `GET /api/admin/estado` (`efectiva` calculada con `visibilidad.js`, `enPortada` desde `GALERIA.portada`), `PUT /api/admin/prendas/<id>` y `PUT /api/admin/prendas/<id>/fotos/<n>` usando `estado.js`; respuestas `{"error":"<código corto>"}`; `Cache-Control: no-store` y `X-Robots-Tag: noindex, nofollow`
- [X] T020 [US1] Añadir en `worker/src/api-admin.js` (o `worker/src/miniaturas.js` si supera el límite) `GET /api/admin/miniaturas/<id>/<n>.webp`: lee `f/<id>/<n>-160.webp` de R2 aunque la foto esté oculta, `Cache-Control: private, no-store`, 404 si no existe
- [X] T021 [US1] Enrutar en `worker/src/index.js` `/panel`, `/panel/` y `/panel/panel.css|panel.js` (vía `env.ASSETS.fetch` tras el JWT; cualquier otra ruta bajo `/panel/` → 404) y `/api/admin/*` hacia `api-admin.js`
- [X] T022 [P] [US1] Crear `panel/index.html` según [contracts/panel-ui.md](contracts/panel-ui.md): `lang="es"`, `<meta name="robots" content="noindex,nofollow">`, viewport con `viewport-fit=cover`, CSP `default-src 'self'` en `<meta>`, cabecera con correo y «Salir» (`/cdn-cgi/access/logout`), `<h1>`, resumen, lista, `#estado` con `role="status"`; sin código en línea ni recursos de terceros
- [X] T023 [P] [US1] Crear `panel/panel.css` (≤ 200 líneas): tokens de `styles.css` (negro cálido, dorado, texto `#eae6df`), fuentes autoalojadas, interruptor `role="switch"` con estilo propio, zonas táctiles ≥ 44 px (`@media (pointer: coarse)`) y ≥ 24 px con puntero fino, rejilla de fotos con `container-type: inline-size` (2 columnas a 360 px), `env(safe-area-inset-*)`, foco visible ≥ 3:1, `prefers-reduced-motion`, estado nunca solo con color, sin desplazamiento horizontal hasta 320 px (consultar guía `form-factor-adaptation`)
- [X] T024 [US1] Crear `panel/panel.js` (≤ 200 líneas; si crece, dividir en `panel-api.js` y `panel-lista.js`): carga con `GET /api/admin/estado` (`AbortSignal.timeout` 8 s, error con «Reintentar», nunca estado inventado); lista por prenda con `<details>` para sus fotos y miniaturas con `width`/`height` y `loading="lazy"`; `<input type="checkbox" role="switch">` con nombre accesible («Prenda 12», «Foto 2 de la prenda 12»); `PUT` con bloqueo del control, reversión del interruptor y mensaje en `#estado` si falla; botón «Actualizar» sin sondeo; etiqueta «Sin fotos visibles: no se muestra» y atenuado «Oculta»; una miniatura que no carga (evento `error` con `addEventListener`, nunca atributos en línea) se sustituye por un recuadro con el número de la prenda (consultar guía `switch`)
- [X] T025 [US1] Añadir a `panel/panel.js` (o `panel/panel-lista.js`) la etiqueta «En portada» y el `<dialog>` de confirmación al ocultar una prenda marcada con el texto de contracts/panel-ui.md (FR-016); cancelar deja el interruptor como estaba
- [X] T026 [US1] Añadir `panel/` al flujo de `scripts/publicar.js` (copia a `dist/panel/`) y, en `scripts/servidor.js`, añadir `worker`, `wrangler.ejemplo.jsonc` y `panel` a `BLOQUEADAS` (el servidor local, sin Worker ni Access, no debe servir el panel ni el código del Worker; el panel se prueba con `wrangler dev`)
- [X] T027 [US1] Validar US1 en local según quickstart §2 filas 2-5 y 8-9 (`wrangler dev`, migración `--local`) y a 360, 768 y 1920 px; sin imágenes en R2 las miniaturas dan 404 y el panel muestra el hueco sin romper el diseño (las miniaturas reales se comprueban en T039); anotar resultados en `specs/015-panel-admin-online/checklists/auditoria.md`

**Checkpoint**: el panel lista, activa y desactiva prendas y fotos con persistencia; `npm test` en verde.

---

## Phase 4: User Story 2 — Una foto desactivada es imposible de ver (P1) 🎯 MVP

**Goal**: lo oculto no sale en datos, código ni dirección directa; ante la duda se oculta.

**Independent Test**: guardar la URL de una imagen visible, ocultar la prenda y comprobar 404 uniforme tras ≤ 40 s; inspeccionar `dist/` y `/api/prendas.js` sin rastro de la prenda (quickstart §2 filas 3-7).

### Tests de US2

- [X] T028 [P] [US2] Prueba en `worker/test/api-publica.test.js`: `/api/prendas.js` incluye solo prendas con ≥ 1 foto visible y en orden de galería; `FOTOS_OPT.prendas[id]` con `[ancho, alto, n original]`; descripciones escapadas (`</script>`, U+2028/2029); ETag y 304; fallo del estado → `prendas: {}` con `no-store` y siempre 200; ningún dato de prendas ocultas
- [X] T029 [P] [US2] Prueba en `worker/test/imagenes.test.js`: patrón estricto `^/f/([0-9A-Za-z_-]{1,16})/([1-9][0-9]?)-(160|480|800|1200)\.(avif|webp)$` (160 solo `webp`); 200 solo si `fotoVisible`; 404 idéntico (mismo cuerpo vacío y mismas cabeceras) para mal formada, inexistente, oculta y error de R2/D1; `Cache-Control: public, max-age=30` sin `immutable`; ETag 304

### Implementación de US2

- [X] T030 [P] [US2] Implementar `worker/src/api-publica.js`: `GET /api/prendas.js` según [contracts/api-publica.md](contracts/api-publica.md) (`PRENDAS.push(...)` + `FOTOS_OPT` con `base: "/f/"`, `anchos`, `anchosAvif`), `Content-Type: application/javascript; charset=utf-8`, `Cache-Control: no-cache`, ETag = versión
- [X] T031 [P] [US2] Implementar `worker/src/imagenes.js`: `GET /f/<id>/<n>-<ancho>.<ext>` con el patrón estricto, comprobación de existencia en `GALERIA` y `fotoVisible`, lectura de R2 (`f/<id>/<n>-<ancho>.<ext>`) y 404 uniforme; aislar la lectura de R2 en una función para poder cambiar el almacén
- [X] T032 [US2] Enrutar `/api/prendas.js` y `/f/*` en `worker/src/index.js` (solo `GET`/`HEAD`; otro método → 405; sin cookies ni parámetros)
- [X] T033 [P] [US2] Ajustar `lib.js`: `getFotos` usa `FOTOS_OPT.base` (por defecto `public/img/`) y el número original `n` de cada foto (tercer elemento) para construir `srcset`/`srcsetAvif`; mantener compatibilidad con `[ancho, alto]` (local)
- [X] T034 [P] [US2] Cambiar en `index.html` la etiqueta `<script defer src="data/fotos-optimizadas.js">` por `api/prendas.js` y dejar el orden `data/galeria.js`, `api/prendas.js`, `lib.js`, `visor.js`, `app.js` (todos `defer`)
- [X] T035 [US2] Modificar `scripts/publicar.js`: `data/galeria.js` publicado lleva solo `CONTACTO`, `PORTADA` y `const PRENDAS = [];`; `dist/` sin `public/img/<id>/` de prendas ni `data/fotos-optimizadas.js` (se conservan `portada/*`, `slac/*`, logo, favicon y `og-cover.jpg`); comprobar antes de generar que existe `wrangler.jsonc`, que `assets.directory` es `./dist` y que no quedan marcadores `__…__` (ADR 010)
- [X] T036 [P] [US2] Ajustar `scripts/servidor.js` para responder `/api/prendas.js` con el contenido de `data/fotos-optimizadas.js` (todo visible, sin `base`) y que el HTML sea el mismo en local y en producción
- [X] T037 [US2] Crear `scripts/subir-imagenes.js`: sube a R2 con `wrangler r2 object put slac-fotos/f/<id>/<n>-<ancho>.<ext> --remote` (o `--local` con opción) solo los archivos nuevos o cambiados, con `--content-type` y `--cache-control "public, max-age=30"`, usando el manifiesto de huellas `.r2-manifiesto.json`; elimina de R2 los objetos de fotos que ya no existen; informa del progreso
- [X] T038 [US2] Ampliar `scripts/verificar.js`: quitar `data/fotos-optimizadas.js` de la lista de publicables y admitir `api/prendas.js` como recurso virtual (no exige el archivo en `dist/`); comprobar que `dist/` no contiene `public/img/<id>/` ni `PRENDAS` con datos; `FOTOS_OPT`/`getFotos` coherentes; revisar también `worker/src/*.js` (módulos ES: `vm.Script` falla con `export`, usar `new vm.SourceTextModule` o `node --check` sobre `.js` con el `package.json` de tipo módulo) y `panel/*.js` (sintaxis clásica y ≤ 200 líneas por archivo, constitución VI)
- [X] T039 [US2] Validar US2 en local según quickstart §2 filas 1, 3-7 (incluida la caída de D1 simulada) tras `npm run subir-imagenes` en local, con miniaturas reales en el panel, y comprobar a mano que `dist/` no contiene ninguna foto ni número de prendas; comprobar además los casos límite de la spec: (a) **0 prendas visibles**: la portada y el teléfono siguen y la galería queda vacía sin texto, hueco roto ni errores de consola (si `app.js`/`visor.js` fallan con `PRENDAS` vacío, corregirlo aquí); (b) una prenda cuya primera foto está oculta: la miniatura pasa a la primera activa y el visor no muestra imágenes rotas ni contador incoherente; anotar resultados en `checklists/auditoria.md`

**Checkpoint**: cambio de estado → reflejado en `/api/prendas.js` y en `/f/…` en ≤ 40 s; ocultar es *fail closed*. US1 + US2 = MVP completo.

---

## Phase 5: User Story 3 — Dar y quitar acceso a otras personas (P2)

**Goal**: solo entra quien autoriza la titular en Cloudflare Access; revocar surte efecto en < 5 min; la web no tiene permisos sobre los accesos.

**Independent Test**: añadir un segundo correo a la política, entrar y cambiar un estado; quitarlo y «Revocar tokens»: deja de poder entrar y guardar en < 5 min (quickstart §3 filas 1, 2, 5-7).

- [X] T040 [P] [US3] Ampliar `worker/test/api-admin.test.js` (o `rutas.test.js`) con una prueba por cada ruta `/panel*` y `/api/admin/*`: sin JWT o con JWT inválido → 403 de cuerpo vacío y D1/R2 no se tocan; con JWT válido pero `Host` distinto de `HOST_PERMITIDO` (p. ej. `workers.dev`) → 403 (US3 escenarios 1 y 3, SC-004, SC-005)
- [X] T041 [US3] *(manual, titular)* Crear en Cloudflare la base `npx wrangler d1 create slac-estado` (copiar su `database_id` a `wrangler.jsonc` local, copiado de `wrangler.ejemplo.jsonc`), aplicar `npx wrangler d1 migrations apply slac-estado --remote -c wrangler.jsonc`, crear `npx wrangler r2 bucket create slac-fotos` (sin acceso público) y comprobar permisos de `r2 object put --remote` (repetir `wrangler login` si fallan)
- [X] T042 [US3] *(manual, titular)* Primer despliegue: `npm run optimizar` → `npm run publicar` → `npm run subir-imagenes` → `npx wrangler deploy -c wrangler.jsonc` (nunca sin `-c`; comprobar en la salida que `assets.directory` es `./dist`, que `workers_dev` es `false` y que `HOST_PERMITIDO` apunta al dominio); asociar `slac-official.com` al Worker (Dominios y rutas) y comprobar que la web pública sigue sirviéndose desde el dominio *(hecho el 2026-11-17: 37 prendas, 679 archivos en R2; carga inicial con las 37 prendas visibles, `por = carga-inicial`, aplicada con `wrangler d1 execute` desde un SQL fuera del repo; `/panel` y `/api/admin` dan 403 hasta T043)*
- [X] T043 [US3] *(manual, titular)* Crear en Zero Trust la aplicación *self-hosted* «SLAC panel» para `slac-official.com` con rutas `panel*` y `api/admin/*`, política Allow por lista de correos, código de un solo uso (y/o Google), sesión de 12 h; copiar el AUD y el nombre del equipo; `npx wrangler secret put ACCESS_AUD -c wrangler.jsonc` y `ACCESS_TEAM_DOMAIN -c wrangler.jsonc`; comprobar que `https://slac-official.com/` no pide login y `/panel/` sí *(hecho el 2026-11-17 con el MCP de Cloudflare: proveedor de código por correo, política Allow de dos correos, aplicación con las dos rutas y sesión de 12 h; secretos puestos por la titular; `/` 200 y `/panel/` redirige al login; login probado desde el móvil)*
- [ ] T044 [US3] Validar US3 en producción según quickstart §3 filas 1, 2, 5, 6 y 7 (correo no autorizado denegado; sin sesión por `curl` nunca datos; `workers.dev` sin respuesta o 403 por `Host`; alta y baja de un segundo correo con «Revocar tokens» en < 5 min, comprobando también que el JWT de esa sesión revocada no sirve si se envía a otra dirección); anotar en `checklists/auditoria.md`
- [X] T045 [P] [US3] Documentar en `COMO-ACTUALIZAR-FOTOS.md` cómo dar y quitar acceso (Zero Trust → política de correos y «Revocar tokens»), por qué el panel no gestiona personas y que la titular siempre puede volver a darse acceso (FR-007/008)

**Checkpoint**: solo las personas de la política acceden; la baja es efectiva en minutos.

---

## Phase 6: User Story 4 — La web pública no cambia (P3)

**Goal**: igual de rápida, sin terceros ni cookies, sin ninguna pista del panel.

**Independent Test**: comparar la web antes y después: mismo aspecto, Lighthouse móvil ≥ 95, < 1 MB, 0 peticiones a terceros y sin enlaces, texto ni sitemap que mencionen el panel.

- [X] T046 [P] [US4] Ampliar `scripts/verificar.js`: `panel/` sin palabras prohibidas (constitución I), sin código en línea, con `noindex`; la web pública, `sitemap.xml` y `robots.txt` no mencionan `/panel` ni `/api/admin`; el panel no aparece enlazado desde ningún HTML público
- [X] T047 [P] [US4] Revisar el archivo `_headers` de la raíz (estático, lo copia `publicar.js`): su regla `/public/*` con `immutable` solo debe alcanzar lo que queda en `dist/public/` (portada, logo, fuentes; ninguna foto de prenda tras T035) y `/f/*` no lleva caché larga (el Worker fija `max-age=30`); `verificar.js` falla si `dist/public/img/` contiene carpetas de prendas; tras `wrangler deploy -c wrangler.jsonc` comprobar con `curl -I` que las cabeceras de `_headers` siguen en las respuestas estáticas y que las del Worker llevan las suyas (`seguridad.js`) *(el `curl -I` queda para T048, tras el despliegue)*
- [ ] T048 [US4] Validar US4 según quickstart §3 filas 8 y 9: DevTools en la web pública (0 terceros, 0 cookies, sin enlaces ni texto del panel; `robots`/`sitemap` sin `/panel`), Lighthouse móvil ≥ 95 con LCP = portada y < 1 MB en la primera pantalla; anotar en `checklists/auditoria.md` y vigilar las peticiones/día del Worker frente a 100.000

---

## Phase 7: User Story 5 — Saber quién cambió qué (P3)

**Goal**: cada cambio queda con persona y momento, visible en el panel.

**Independent Test**: hacer un cambio y ver en el panel el último cambio de esa prenda (persona y hora) y su entrada en «Últimos cambios».

- [X] T049 [P] [US5] Prueba en `worker/test/api-admin.test.js`: `GET /api/admin/registro?limite=<1..100>` (por defecto 50, más reciente primero; `limite` inválido → 400); cada `PUT` añade una fila con la persona del JWT en minúsculas y el estado nuevo; el registro nunca se edita ni se borra desde la API
- [X] T050 [US5] Añadir `GET /api/admin/registro` en `worker/src/api-admin.js` (o `worker/src/registro.js`) según contracts/api-admin.md y enrutarlo en `worker/src/index.js`
- [X] T051 [US5] Mostrar en `panel/panel.js` (o `panel/panel-lista.js`) «Visible · por <correo> · hoy 18:32» por prenda y foto con `cambio`, y la sección «Últimos cambios» (`<h2 id="t-registro">`, `<ol>` con los últimos 50, hora local) que se refresca tras cada `PUT`
- [ ] T052 [US5] Validar US5 en local y en producción (quickstart §3 fila 2: el registro muestra el correo); anotar en `checklists/auditoria.md`

---

## Phase 8: Polish y cierre

**Purpose**: flujo de publicación, documentación, auditorías y cierre del ciclo (AGENTS.md §5 pasos 7-10).

- [X] T053 [P] Actualizar `PUBLICAR.bat`: optimizar → `npm run publicar` → `npm run subir-imagenes` → confirmación «SI» → `npx wrangler deploy -c wrangler.jsonc` (nunca sin `-c`); al terminar avisa de que las prendas nuevas quedan **ocultas** hasta activarlas en el panel (FR-009/FR-015)
- [X] T054 [P] Actualizar `COMO-ACTUALIZAR-FOTOS.md`: nuevo flujo (ocultar y mostrar desde el panel online sin publicar; prendas nuevas ocultas hasta activarlas; casilla «Oculta» del panel local = privada y nunca se sube; imágenes fijas del contacto y `og-cover` se cambian en local)
- [ ] T055 Ejecutar la puerta de calidad completa: `npm test`, `npm run verificar` y `npm run publicar`, todo en verde; abrir la web pública a 390 y 1440 px sin errores en la consola y con `prefers-reduced-motion` sin animaciones de entrada (puertas 2 y 3 de la constitución)
- [X] T056 *(generadas el 2026-11-17: `checklists/seguridad.md`, `rendimiento.md` y `seo.md`, puntos a revisar por la titular; `legacy-scan`: 5 hallazgos, 1 corregido y 4 justificados en `rendimiento.md`)* Auditoría con `/speckit-checklist seguridad` (JWT, CSRF, secretos fuera del repo, `git grep` de datos de cuenta/AUD/equipo = 0 antes de cualquier `git push`, ADR 013), `/speckit-checklist rendimiento` (incluido `npx modern-web-guidance@latest legacy-scan . --json` ignorando `specs/`; corregir o justificar cada hallazgo) y `/speckit-checklist seo`
- [ ] T057 Ejecutar la validación completa de [quickstart.md](quickstart.md) §1-§4 (incluidos SC-001 «entrar, ocultar y comprobar < 2 min» y SC-007 360-1920 px) y anotar resultados
- [ ] T058 `/speckit-analyze` y `/speckit-converge` hasta `Converged`; repetir T055-T057 con lo que añada
- [X] T059 *(hecho el 2026-11-17: ADR 015, mapa del código, stack, comandos, auditoría y lecciones; cita la constitución v1.5.1, ver T065)* Actualizar `MEMORY.md`: ADR 015 (panel online, D1/R2/Access, fail closed, excepción de las copias estáticas), mapa del código (`worker/`, `panel/`, `scripts/subir-imagenes.js`, `wrangler.ejemplo.jsonc`), stack (§3: `wrangler`, despliegue con `-c wrangler.jsonc`), checklist de auditoría (cabeceras HTTP de §5 ya cubiertas por `_headers`/Worker) y constitución v1.5.1
- [ ] T060 Con `main` al día, traerlo a la rama, pedir confirmación a la titular y fusionar: `git switch main` → `git merge --no-ff 015-panel-admin-online` → borrar la rama y el worktree `slac-panel` (`git worktree remove`)

---

## Dependencias y orden de ejecución

- **Phase 1** (T001 primero, bloquea todo el código) → **Phase 2** (bloquea todas las historias) → historias → **Phase 8**.
- **US1 (T018-T027)**: depende de Phase 2. Sin dependencias de otras historias (la miniatura de T020 necesita R2 local con imágenes, que prepara T037 en cuanto exista; hasta entonces responde 404 y el panel muestra el hueco).
- **US2 (T028-T039)**: depende de Phase 2 y de `index.js` (T016). T033/T034/T036 son independientes entre sí. T037 es necesaria para validar T039 y la miniatura de US1. **US1 + US2 forman el MVP end-to-end** (ocultar en el panel y que desaparezca de la web).
- **US3 (T040-T045)**: T040 es código (tras Phase 2); T041-T044 son manuales y exigen US1 y US2 terminadas y Phase 2 (hay algo que desplegar). T041 → T042 → T043 → T044.
- **US4 (T046-T048)**: T046/T047 pueden hacerse tras US2; T048 exige el despliegue (T042-T043).
- **US5 (T049-T052)**: depende de US1 (escritura del registro en la transacción, T015/T019).
- **Dentro de cada historia**: pruebas primero (deben fallar), después módulos puros, después enrutado y UI.

### Oportunidades de paralelismo
- Phase 1: T003, T004, T005 a la vez.
- Phase 2: T007/T008 (visibilidad), T009/T010 (acceso), T011/T012 (seguridad) y T013 (publicar) tocan archivos distintos; T014-T017 después de ellos.
- US1: T022 y T023 (HTML y CSS) a la vez; T019/T020 (Worker) en paralelo con la UI.
- US2: T030, T031, T033, T034, T036 son archivos distintos y pueden ir juntos.
- Tras Phase 2, US1 y US2 pueden llevarlas dos personas a la vez (comparten solo `worker/src/index.js`: T021 y T032 se coordinan).

### Ejemplo en paralelo (Phase 2)
```text
T007+T008  worker/src/visibilidad.js
T009+T010  worker/src/acceso.js
T011+T012  worker/src/seguridad.js
T013       scripts/publicar.js (galeria.generated.js)
```

## Estrategia de implementación

1. **MVP**: Phase 1 → Phase 2 → US1 → US2. Parar y validar en local (quickstart §2): ocultar en el panel hace desaparecer la prenda de `/` y de `/f/…`.
2. **Entrega gradual**: US3 (despliegue y acceso real) → US4 (verificación de la web pública) → US5 (registro).
3. **Cierre**: Phase 8; no fusionar en `main` sin la confirmación de la titular (AGENTS.md §5).
4. **Reversibilidad**: nada público depende de la funcionalidad hasta T042; el procedimiento de vuelta atrás está en [contracts/despliegue.md](contracts/despliegue.md).

## Notas
- Ninguna tarea modifica `admin.html|js|css` (panel local): se conserva (FR-015).
- Ningún identificador de cuenta, AUD, equipo de Access ni correo real entra en el repositorio (constitución IV, ADR 013).
- Hacer commit por fase (`/speckit-git-commit`).

## Phase 9: Convergence

- [X] T061 *(desplegado el 2026-11-17: 4 archivos del panel subidos; `/`, `/api/prendas.js` 200 y `/panel*` al login; falta que la titular abra el panel con sesión y compruebe que guarda)* Desplegar el estado actual de la rama (`npm run publicar` y `npx wrangler deploy -c wrangler.jsonc`) y comprobar con el panel abierto que carga, guarda un cambio y muestra el registro: producción aún lleva el `panel-api.js` anterior a `AbortSignal.timeout` per T024 (partial)
- [X] T062 *(hecho el 2026-11-17: reintento único a 1,5 s y recuadro con el número; probado en Edge contra `wrangler dev --local`: 9 miniaturas reintentadas, 0 imágenes rotas)* Reintentar una vez la miniatura que no carga y, si vuelve a fallar, mostrar el recuadro con el número de la prenda en lugar de dejar la imagen oculta (`visibility: hidden` en `.sin-imagen`, `panel/panel.css:70`; sin reintento en `panel/panel-lista.js`) per T024 (partial)
- [X] T063 *(hecho el 2026-11-17: tras dos fallos seguidos, o con 401/403, pide recargar; probado en Edge)* Distinguir en el panel el fallo de red del de sesión caducada (a las 12 h Access redirige a otro dominio y `fetch` falla): el aviso «No se pudo guardar. Inténtalo de nuevo.» (`panel/panel.js:49`) debe indicar «Recarga la página» tras un segundo fallo seguido, sin mostrar nunca un estado inventado per FR-003 / US3 (partial)
- [ ] T064 *(contraste anotado en `auditoria.md` (mínimo 6,56:1, AA); falta el recorrido con lector de pantalla en móvil, que hace la titular)* Anotar en `checklists/auditoria.md` el contraste medido de la paleta del panel (mínimo 6,56:1, WCAG AA) y completar la parte manual de FR-014: recorrido solo con teclado y con lector de pantalla en móvil, hasta cerrar el punto pendiente de US1 per FR-014 (partial)
- [X] T065 *(hecho el 2026-11-17: constitución v1.5.1, `AbortSignal.timeout`, módulos del Worker y dos casos límite nuevos en `spec.md`)* Corregir la deriva documental: constitución v1.5.1 en `plan.md`, `quickstart.md` y T059 (hoy v1.4.0/v1.5.0), `AbortSignal.timeout` en `contracts/panel-ui.md:28` y T024, los módulos `enrutador.js` y `panel-estatico.js` en la estructura del plan, y el caso límite «peticiones simultáneas con el Worker en frío no se rechazan» en `spec.md` per Constitution (Governance) (partial)
