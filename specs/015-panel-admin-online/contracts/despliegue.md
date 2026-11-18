# Contrato: despliegue y configuración (ADR 010 respetado)

## Regla innegociable
Nunca `wrangler deploy` ni `wrangler pages …` sin configuración explícita: su autoconfiguración subió una vez la carpeta entera del proyecto (ADR 010). Siempre `-c wrangler.jsonc` y `publicar.js` lo comprueba antes de generar `dist/`.

## Estado de la cuenta de Cloudflare (verificado el 2026-11-17)
No se anotan aquí el identificador de la cuenta, el correo ni el nombre del equipo de Access (ADR 013 / constitución IV).

| Requisito | Estado |
|---|---|
| Dominio `slac-official.com` con DNS en Cloudflare | ✅ (nameservers de Cloudflare; web servida con las cabeceras de `_headers`) |
| Despliegue actual con el método de la ADR 010 | ✅ (último: 2026-11-16) |
| Archivos privados no publicados (`admin.html`, `MEMORY.md`, `scripts/`, `public/fotos/`, `specs/`, `.git`…) | ✅ responden 404 |
| R2 activado | ✅ (`wrangler r2 bucket list` responde sin error; antes daba 10042) |
| Zero Trust Free activo, con proveedor de identidad (código por correo) y titular como Super Administrator | ✅ (nombre de equipo autogenerado) |
| Base D1 `slac-estado` | ❌ pendiente de crear (la lista de D1 está vacía) |
| Bucket R2 `slac-fotos` | ❌ pendiente de crear |
| Aplicación de Access para `/panel*` y `/api/admin/*` | ❌ pendiente: se crea cuando el Worker esté desplegado (hace falta el AUD) |
| Tarjeta guardada en la cuenta (exigida por R2 y Zero Trust, aunque no se cobra dentro del plan gratuito) | ✅ |

### Hecho el 2026-11-17 (independiente de esta funcionalidad)
- Registro DNS `A www → 192.0.2.1` con proxy activado.
- Regla de redirección 301: `https://www.*` → `https://${1}` conservando la cadena de consulta (`www` → dominio sin `www`).
- SSL/TLS → Edge Certificates → **Always Use HTTPS** activado. «Automatic HTTPS Rewrites» también está activo (inofensivo).
- Comprobado con `curl`: `http://` y `www` (con y sin `http`) acaban en `https://slac-official.com/` con 301, conservando ruta y `?`.

Con `www` redirigido, `www.slac-official.com/panel` no llega al Worker sin pasar por el dominio principal (donde sí actúa Access).

## `wrangler.ejemplo.jsonc` (se versiona; el real `wrangler.jsonc` va a `.gitignore`)
```jsonc
{
  "name": "slac",
  "main": "worker/src/index.js",
  "compatibility_date": "2026-11-17",
  "workers_dev": false,                      // el panel solo debe llegar por el dominio propio, donde está Access (analyze I1)
  "vars": { "HOST_PERMITIDO": "slac-official.com" },   // el Worker rechaza /panel* y /api/admin/* en cualquier otro host
  "assets": {
    "directory": "./dist",
    "binding": "ASSETS",
    "run_worker_first": ["/api/*", "/f/*", "/panel", "/panel/*"]
  },
  "d1_databases": [{ "binding": "DB", "database_name": "slac-estado", "database_id": "__ID_DE_D1__", "migrations_dir": "worker/migraciones" }],
  "r2_buckets":   [{ "binding": "FOTOS", "bucket_name": "slac-fotos" }],
  "ratelimits":   [{ "name": "LIMITE_CAMBIOS", "namespace_id": "4101", "simple": { "limit": 30, "period": 10 } }]
}
```
No contiene el nombre del equipo de Access, el AUD, el correo ni el identificador de la cuenta. Variables **secretas** (`wrangler secret put -c wrangler.jsonc`): `ACCESS_TEAM_DOMAIN` (p. ej. `https://<equipo>.cloudflareaccess.com`) y `ACCESS_AUD`.

`publicar.js` se detiene con un mensaje claro si: falta `wrangler.jsonc`; `assets.directory` ≠ `./dist`; o aparece algún marcador `__…__`.

## Configuración única en Cloudflare (la hace la titular una vez)
1. **Dominio**: `slac-official.com` activo en la cuenta (DNS en Cloudflare) y asociado al Worker `slac` (Workers y Pages → slac → Dominios y rutas).
2. **D1**: `npx wrangler d1 create slac-estado` → copiar el `database_id` a `wrangler.jsonc`; `npx wrangler d1 migrations apply slac-estado --remote -c wrangler.jsonc`.
3. **R2**: `npx wrangler r2 bucket create slac-fotos` (sin acceso público ni dominio asociado).
4. **Access** (Zero Trust → Access controls → Applications → Add → Self-hosted):
   - Aplicación «SLAC panel»; dominios: `slac-official.com` con rutas `panel*` y `api/admin/*` (una entrada por ruta).
   - Política «Permitir»: *Include → Emails* = correos autorizados. Método de acceso: código de un solo uso (y/o Google).
   - Duración de sesión de la aplicación: **12 horas**.
   - Copiar el **Application Audience (AUD) Tag** y el nombre del equipo → `wrangler secret put ACCESS_AUD` / `ACCESS_TEAM_DOMAIN`.
5. Verificar que `https://slac-official.com/` (pública) **no** pide login y `/panel/` sí.

## Quién puede entrar
- **Dar acceso**: Zero Trust → Access → Policies → añadir el correo. 
- **Quitar acceso**: quitar el correo de la política y, para cortar una sesión abierta, Applications → Edit → **Revoke existing tokens** (o Team & Resources → Users → Action → Revoke). Efecto inmediato; la persona puede tardar hasta 1 minuto en ver el error al volver a entrar.
- La titular es propietaria de la cuenta de Cloudflare, por lo que siempre puede volver a darse acceso.

## Flujo de publicación (`PUBLICAR.bat`, actualizado)
Cuando cambian prendas, descripciones o fotos (no hace falta para ocultar/mostrar):
1. `npm run optimizar` (como hoy).
2. `npm run publicar`: verifica, genera `dist/` **sin** imágenes de prendas ni `PRENDAS`, con `panel/`, y escribe `worker/src/galeria.generated.js`.
3. `npm run subir-imagenes`: sube a R2 solo lo nuevo o cambiado (`wrangler r2 object put … --remote`, con `--content-type` y `--cache-control`), y actualiza el manifiesto local de huellas.
4. Confirmación («SI») → `npx wrangler deploy -c wrangler.jsonc`.
5. Las prendas nuevas quedan **ocultas** hasta activarlas en el panel (FR-009). El `.bat` lo recuerda al terminar.

## Volver a como estaba (solo local)
1. Si no se ha fusionado: descartar la rama `015-panel-admin-online` y el worktree (`git worktree remove`).
2. Si ya está desplegado: `git revert` de la fusión en `main`; `npx wrangler deploy --assets dist --name slac --compatibility-date 2026-11-16` tras `npm run publicar` (vuelve el despliegue estático de ADR 010); en Cloudflare, borrar la aplicación de Access, la base `slac-estado` y el bucket `slac-fotos` (vaciarlo antes). Las imágenes originales están en `public/fotos/` y las optimizadas en `public/img/` (no se pierde nada).

## Vigilancia
- Cloudflare → Workers → slac → métricas: peticiones/día frente al límite de 100.000 y errores 1027. Si se supera: Workers de pago (5 USD/mes) o Plan B de `research.md` D4.
- Registro de cambios en el panel (últimos 50) y tabla `registro` en D1.
