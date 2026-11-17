# Research: Panel de administración online (015)

**Fecha**: 2026-11-17 · Fuentes: documentación de Cloudflare consultada el mismo día (enlaces al final) y Modern Web Guidance.
Responsables: `@Agent-Architect` + `@Agent-SecOps`.

Todas las cifras de límites son del plan **gratuito** de Cloudflare y deben revisarse al implementar.

## Decisiones

### D1 — Identidad: Cloudflare Access (sin login propio)
- **Decisión**: una aplicación *self-hosted* de Access protege `slac-official.com/panel*` y `slac-official.com/api/admin/*`, con política «Allow» por lista de correos y acceso por código de un solo uso (o Google). Doble factor opcional con el proveedor elegido.
- **Por qué**: no hay contraseñas que guardar, ni sesiones, ni fuerza bruta que frenar; Access ya lo resuelve. Gratis hasta 50 usuarios; una persona solo ocupa un puesto aunque use varias aplicaciones.
- **Alternativas**: (a) login propio con usuario y contraseña — descartado: más superficie de ataque (hash, sesiones, fuerza bruta, CSRF) y contradice FR-006; (b) enlace secreto en la URL — descartado: se filtra y no se puede revocar por persona; (c) Access delante del Worker con `ctx.access` — descartado como única barrera (limitaciones con recursos estáticos y *service bindings*, según la documentación); se usa solo la validación manual del JWT, que además sirve de defensa en profundidad.
- **Condición previa a verificar**: la zona `slac-official.com` debe estar activa en la cuenta de Cloudflare (según la documentación, el dominio de una aplicación de Access debe pertenecer a una zona activa de la cuenta). Si el DNS no está en Cloudflare, véase «Plan B de identidad» más abajo.

### D2 — El Worker valida el JWT de Access en cada petición protegida
- **Decisión**: cabecera `Cf-Access-Jwt-Assertion`; firma RS256 comprobada con `crypto.subtle` contra las claves de `https://<equipo>.cloudflareaccess.com/cdn-cgi/access/certs` (se cachean en el aislado y se recargan si aparece un `kid` desconocido; el endpoint rota claves cada ~6 semanas y conserva la anterior 7 días). Se exige `iss` = dominio del equipo, `aud` = AUD de la aplicación, `exp`/`nbf` vigentes y `email` presente.
- **Por qué**: si alguien llega al Worker por otra dirección (p. ej. `workers.dev`) Access no está delante y la petición no lleva JWT: el Worker responde 403 igualmente (*fail closed*).
- **Sin dependencias**: ~60 líneas con la API Web Crypto en lugar de `jose` (principio de dependencias mínimas de SecOps).
- **Secretos**: `ACCESS_TEAM_DOMAIN` y `ACCESS_AUD` se guardan con `wrangler secret put`, no en el repositorio (ADR 013 retiró del repo el nombre de cuenta de Cloudflare; el equipo de Access lo revelaría).
- **Pruebas locales**: `.dev.vars` (ignorado por git y nunca desplegado) puede definir `ACCESS_DEV_EMAIL` para saltarse el JWT **solo** en `wrangler dev`; el código lo ignora si el host no es `localhost`.

### D3 — Estado en D1 (no KV)
- **Decisión**: base D1 con tres tablas (`prenda_estado`, `foto_estado`, `registro`) y una fila de versión (`meta`).
- **Por qué**: KV es eventualmente consistente («hasta 60 segundos o más» en otras ubicaciones, con caché negativa de claves nuevas) y no garantiza FR-004 (< 1 min) ni el *fail closed*. D1 lee del primario (consistencia fuerte) y permite transacciones (`batch`) para guardar el cambio y su registro a la vez.
- **Presupuesto** (gratis: 5 M filas leídas y 100.000 escritas al día): el Worker cachea el estado 10 s en memoria del aislado y, para refrescar, lee primero solo la fila de versión (1 fila); solo si cambió recarga las tablas (~100 filas). Coste máximo realista: unas decenas de miles de filas al día.
- **Alternativas**: KV — descartado por consistencia; Durable Objects — descartado: más complejidad (clases, migraciones) sin necesidad a esta escala.

### D4 — Imágenes en R2 privado, servidas por el Worker
- **Decisión**: las imágenes optimizadas de las prendas salen de `dist/` y se guardan en un bucket R2 **sin acceso público**; solo el Worker las lee (`/f/<id>/<n>-<ancho>.<ext>`) y solo si la prenda y la foto están visibles. Una foto oculta responde 404 idéntico al de una que no existe.
- **Por qué**: es la única forma de cumplir «imposible de ver por enlace directo» y poder reactivar sin publicar. Los recursos estáticos de Workers son públicos por su ruta: ocultarlos exige volver a desplegar.
- **Caché**: `Cache-Control: public, max-age=30` + `ETag` (304 barato). Peor caso de propagación: 10 s (aislado) + 30 s (navegador) = 40 s < 60 s. Se quita `immutable` (antes, un año, en `/public/*`): una copia guardada un año contradiría FR-005.
- **Presupuesto**: R2 gratis 10 GB, 1 M operaciones de clase A y 10 M de clase B al mes, sin cargo de salida. La web pesa ~16 MB.
- **Subida**: `wrangler` no tiene subida masiva a R2 (solo `r2 object put/get/delete`; hay que indicar `--remote` explícitamente). `scripts/subir-imagenes.js` sube de una en una, de forma incremental con un manifiesto de huellas (la primera vez tarda; después solo lo nuevo).
- **Alternativas**: (a) bucket público con dominio propio y mover objetos al ocultar — descartado: segundo *hostname* (CSP `img-src` y `verificar` cambian), caché de borde con TTL difícil de invalidar sin token de zona; queda como **Plan B** si se supera la cuota de peticiones; (b) URLs firmadas o impredecibles — descartado: un enlace ya capturado sigue valiendo; (c) ocultar con CSS/JS en cliente — descartado: no cumple FR-005.

### D5 — Datos públicos de la galería: script dinámico `/api/prendas.js`
- **Decisión**: el Worker responde a `GET /api/prendas.js` con un script clásico que añade solo las prendas y fotos visibles a `PRENDAS` y define `FOTOS_OPT` (con `base: "/f/"` y el número original de cada foto). `data/galeria.js` publicado lleva solo `CONTACTO`, `PORTADA` y `const PRENDAS = [];`.
- **Por qué**: mantiene `app.js`, `visor.js` y la maquetación casi intactos (se lee la misma variable global); ninguna prenda oculta aparece ni en datos ni en código (FR-005). `index.html` solo cambia una etiqueta `<script>`; la LCP sigue siendo la portada estática.
- **Foto con número estable**: `FOTOS_OPT.prendas[id]` pasa de `[ancho, alto]` a `[ancho, alto, n]`; `getFotos` usa `n` si existe. Así ocultar la 2.ª foto no renumera las demás ni apunta una caché antigua a otra imagen.
- **Local**: `scripts/servidor.js` responde a `/api/prendas.js` con el contenido de `data/fotos-optimizadas.js` (todo visible), de modo que el HTML es el mismo en local y en producción.
- **Fallo del estado**: si D1 no responde, se usa el último estado correcto si tiene menos de 60 s; si no, la lista sale **vacía** (con `Cache-Control: no-store`). Nunca se muestra algo oculto. Respuesta 200 con lista vacía y no 5xx: un script que falla dejaría `PRENDAS` sin definir y rompería la página.
- **Alternativas**: JSON + `fetch` en `app.js` — más cambios en archivos que otra sesión está tocando; `PRENDAS` por HTML inyectado — inviable con CSP sin código en línea.

### D6 — Qué pasa por el Worker (cuota de 100.000 peticiones al día)
- **Decisión**: `assets.run_worker_first` = `["/api/*", "/f/*", "/panel", "/panel/*"]`. El HTML, CSS, JS, fuentes, portada, logo y favicon siguen siendo recursos estáticos (peticiones gratuitas e ilimitadas, sin Worker).
- **Riesgo**: cada visita cuenta `1 + nº de imágenes de prendas` peticiones (≈ 25 en la primera pantalla y el primer scroll). 100.000/día ≈ 4.000 visitas/día. Si se supera, las rutas del Worker devuelven error y la galería queda vacía (cierra en seguro; la portada y el teléfono siguen). Mitigación: vigilar en el panel de Cloudflare y pasar a Workers de pago (5 USD/mes) o al Plan B de D4.
- **CPU (10 ms por petición, gratis)**: la lectura de R2/D1 es espera de E/S, no CPU; la verificación RSA ~1 ms. Margen amplio.

### D7 — Gestión de personas: en Access, no en el panel
- **Decisión**: quien puede entrar lo gestiona la titular en Zero Trust → Access → política (lista de correos) y «Revocar tokens»; el panel **no** gestiona usuarios.
- **Por qué**: gestionar Access desde un Worker exigiría guardar un token de API con permiso de edición sobre Access: si el Worker se viera comprometido, el atacante se daría acceso a sí mismo. Es un riesgo mayor que la comodidad. La revocación es inmediata (la documentación indica que un usuario revocado puede tardar hasta 1 min en poder volver a entrar), dentro de los 5 min de FR-007.
- **Consecuencia sobre la spec** (ver «Ajustes a la spec»): FR-007 y FR-008 se reformulan; la titular nunca se queda fuera porque es la propietaria de la cuenta de Cloudflare.
- **Sesión**: duración de la aplicación de 12 h (el defecto es 24 h) para limitar el tiempo de una sesión robada.

### D8 — Protección de las operaciones que cambian estado
- Solo `PUT` con `Content-Type: application/json`, cuerpo ≤ 64 bytes, validado de forma estricta (`{"visible": true|false}`); identificadores contra la lista de la galería, nunca contra texto libre.
- **CSRF**: se exige `Origin` igual al propio host y `Sec-Fetch-Site: same-origin` cuando el navegador lo envía; el JWT por sí solo no basta (viaja en cookie).
- **Límite de frecuencia**: *binding* `ratelimits` (30 cambios por 10 s por persona). Cloudflare avisa de que es por ubicación y aproximado: sirve contra errores y abuso torpe, no es un control estricto. **A comprobar**: disponibilidad en el plan gratuito; si no, contador en D1 (`INSERT` + conteo de la ventana).
- Todo `catch` termina en 4xx/5xx genérico, sin trazas ni detalles internos en la respuesta.

### D9 — Panel de la titular (`panel/`)
- HTML, CSS y JS clásicos como el resto del proyecto (≤ 200 líneas por archivo, sin código en línea, CSP `default-src 'self'`), servidos por el Worker tras comprobar el JWT, con `X-Robots-Tag: noindex, nofollow`, sin enlaces desde la web ni en el sitemap.
- Miniaturas: `GET /api/admin/miniaturas/<id>/<n>.webp` (solo con JWT) lee `f/<id>/<n>-160.webp` de R2 aunque esté oculta, para que la titular vea qué está tocando.
- Interruptor: `<input type="checkbox" role="switch">` con estilo propio. **Guía `switch`**: el atributo nativo `switch` solo funciona en Safari 17.4 y su alternativa es una dependencia de terceros (*polyfill*) que no se admite (constitución IV y «sin build»), así que se usa `role="switch"` + CSS, con zona táctil de 44 px (`@media (pointer: coarse)`) y foco visible ≥ 3:1.
- **Guía `form-factor-adaptation`**: objetivos de 24/44 px, contenedor con `container-type: inline-size` para la rejilla de fotos, relleno `env(safe-area-inset-*)` en la barra inferior, `overflow-wrap`. Sin `overflow-x: hidden`.
- Estado visible: texto «Visible / Oculta» (no solo color), `aria-live="polite"` para confirmar y para los errores, con reversión del interruptor si el guardado falla.
- Estado `fetch`: sin guía específica; `AbortController` con límite de 8 s y reintento manual.

### D10 — Convivencia con el panel local y con la portada
- **Panel local (`admin.html`)**: sigue igual y sigue siendo el único sitio donde se suben prendas nuevas y se cambian descripciones. Su casilla «Oculta» mantiene el sentido actual: la prenda sale de `data/galeria.js` y **nunca se sube** (privada). Lo que está en `data/galeria.js` es lo que el panel online puede mostrar u ocultar.
- **Prenda nueva**: tras publicar queda **oculta** hasta que alguien la active en el panel online (FR-009). Cambia el flujo de `PUBLICAR.bat` y se documenta en `COMO-ACTUALIZAR-FOTOS.md`.
- **Portada**: las fotos de la portada y del bloque de contacto son copias estáticas (`public/img/portada/…`) elegidas en local. Desactivar una prenda en el panel online **no** las oculta. El panel marca «En portada» y avisa antes de ocultar, y la guía lo explica (nuevo FR-016). Es una excepción de FR-005 que se acepta de forma explícita.

### D11 — Despliegue (ADR 010)
- **Decisión**: un `wrangler.jsonc` **explícito** que se pasa siempre con `-c wrangler.jsonc`, con `assets.directory = "./dist"`, `assets.binding = "ASSETS"`, `main = "worker/src/index.js"`, enlaces a D1, R2 y `ratelimits`. `wrangler deploy` sin `-c` queda prohibido y `PUBLICAR.bat` lo comprueba. Nunca se usa la autoconfiguración que publicó la carpeta del proyecto entera.
- **Datos de la cuenta fuera del repositorio**: `wrangler.jsonc` real (con `database_id`) va a `.gitignore`; el repo lleva `wrangler.ejemplo.jsonc` con marcadores. `scripts/publicar.js` se niega a continuar si falta o si `assets.directory` no es `./dist` (nueva comprobación junto a la de marcadores de ADR 012).
- `workers_dev`: se mantiene `true` hasta confirmar que el dominio propio funciona; después, `false` (Access no cubre `workers.dev` y el Worker responde 403 allí de todos modos).
- **Despliegue de cambios de estado**: no hace falta; solo se despliega al cambiar código, la galería o las imágenes.

### D12 — Pruebas
- `node:test` (incluido en Node ≥ 18, sin dependencias): JWT (firma, `aud`, `iss`, `exp`, `kid` desconocido), cálculo de visibilidad (prenda × foto, sin estado = prenda oculta / foto activa), validación de entradas, construcción de `/api/prendas.js` y enrutado (qué ruta pasa por el Worker). Los módulos del Worker son funciones puras y se importan sin `wrangler`.
- Integración con `wrangler dev` (D1/R2 locales) siguiendo `quickstart.md`.
- Nueva puerta: `npm test`.

## Plan B de identidad (si el DNS no está en Cloudflare)
1. Pasar los *nameservers* a Cloudflare (o CNAME parcial) — recomendado, es gratis.
2. Proteger con Access la ruta `workers.dev` del Worker (Cloudflare permite proteger el `workers.dev` de un Worker) y usar el panel desde esa dirección; el JWT se valida igual.
3. Mientras no haya ninguna de las dos, la funcionalidad no se despliega (el panel local sigue funcionando).

## Ajustes a la spec (a raíz de la investigación)
- **FR-007/FR-008**: la autorización de personas se gestiona en Access (política de correos), no en el panel. La titular conserva siempre el acceso por ser propietaria de la cuenta.
- **FR-016 (nuevo)**: la portada y el bloque de contacto no se gestionan en el panel online (D10).
- **FR-004**: se concreta el máximo en ~40 s (10 s + 30 s) para respetar «< 1 min».
- **Foto sin estado**: activa; **prenda sin estado**: oculta (FR-009); una foto se ve si ambas lo permiten.

## Guías de Modern Web Guidance aplicadas
| Función de plataforma | Guía | Resultado |
|---|---|---|
| Interruptor accesible | `switch` | Adaptada: `role="switch"` + CSS (el atributo nativo no es Baseline y su alternativa es una dependencia de terceros) |
| Maquetación y zonas táctiles | `form-factor-adaptation` | Aplicada |
| Petición `fetch` con tiempo límite | — | Sin guía específica; criterio habitual |

## Pendiente de comprobar durante la implementación
- Disponibilidad del *binding* `ratelimits` en el plan gratuito.
- Que Access admita la aplicación con ruta (`/panel*`, `/api/admin/*`) en `slac-official.com` y que el dominio esté en la cuenta.
- Que `wrangler deploy -c wrangler.jsonc` conserve `_headers` en las respuestas que pasan por `env.ASSETS.fetch`.
- Versión mínima de `wrangler` (≥ 4.36 para `ratelimits`) y fijarla como `devDependency`.

## Fuentes
- Recursos estáticos y Worker: https://developers.cloudflare.com/workers/static-assets/binding/
- Validar el JWT de Access: https://developers.cloudflare.com/cloudflare-one/identity/authorization-cookie/validating-json/
- Consistencia de KV: https://developers.cloudflare.com/kv/concepts/how-kv-works/
- Precios y límites de Workers, KV, D1 y R2: https://developers.cloudflare.com/workers/platform/pricing/ · https://developers.cloudflare.com/d1/platform/pricing/ · https://developers.cloudflare.com/r2/pricing/
- Comandos de R2 en Wrangler: https://developers.cloudflare.com/r2/reference/wrangler-commands/
- Límite de frecuencia: https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/
- Aplicaciones de Access y sesiones: https://developers.cloudflare.com/cloudflare-one/applications/configure-apps/self-hosted-public-app/ · https://developers.cloudflare.com/cloudflare-one/access-controls/access-settings/session-management/
- `workers.dev`: https://developers.cloudflare.com/workers/configuration/routing/workers-dev/
