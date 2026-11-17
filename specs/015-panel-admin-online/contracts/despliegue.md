# Contrato: despliegue y configuración (ADR 010 respetado)

## Regla innegociable
Nunca `wrangler deploy` ni `wrangler pages …` sin configuración explícita: su autoconfiguración subió una vez la carpeta entera del proyecto (ADR 010). Siempre `-c wrangler.jsonc` y `publicar.js` lo comprueba antes de generar `dist/`.

## `wrangler.ejemplo.jsonc` (se versiona; el real `wrangler.jsonc` va a `.gitignore`)
```jsonc
{
  "name": "slac",
  "main": "worker/src/index.js",
  "compatibility_date": "2026-11-17",
  "workers_dev": true,                       // pasar a false cuando el dominio funcione
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
