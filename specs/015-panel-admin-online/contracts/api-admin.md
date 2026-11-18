# Contrato: interfaz de administración (solo con identificación)

Todas las rutas `/panel*` y `/api/admin/*`:
1. Exigen `Cf-Access-Jwt-Assertion` válido (firma RS256 con las claves de Access, `iss`, `aud`, `exp`, `nbf`, `email`). Sin JWT o con JWT inválido → **403**, cuerpo vacío, **sin leer D1 ni R2** y sin pistas sobre el motivo.
2. Añaden `Cache-Control: no-store`, `X-Robots-Tag: noindex, nofollow` y las cabeceras de seguridad del proyecto.
3. Las que cambian estado (`PUT`) exigen además: `Origin` = host propio (403 si falta o difiere), `Sec-Fetch-Site: same-origin` si el navegador lo envía, `Content-Type: application/json` (415 si no), cuerpo ≤ 64 bytes (413), límite de frecuencia por persona (429 con `Retry-After`).

Persona = `email` del JWT, en minúsculas. Errores siempre `{"error":"<código corto>"}` sin trazas.

## `GET /panel/` (y `/panel`)
Devuelve `dist/panel/index.html` a través de `env.ASSETS.fetch`, tras el paso 1. `/panel/panel.css` y `/panel/panel.js` igual. Cualquier otra ruta bajo `/panel/` → 404.

## `GET /api/admin/estado`
**200**
```json
{
  "persona": "ejemplo@correo.com",
  "version": 42,
  "prendas": [
    {
      "id": "001", "numero": "1", "descripcion": "…",
      "visible": true, "efectiva": true, "enPortada": true,
      "cambio": { "por": "ejemplo@correo.com", "en": 1763380800000 },
      "fotos": [
        { "n": 1, "visible": true,  "efectiva": true,  "cambio": null },
        { "n": 2, "visible": false, "efectiva": false, "cambio": { "por": "…", "en": 1763380900000 } }
      ]
    }
  ]
}
```
- `visible` es el estado propio (prenda o foto; foto sin fila = `true`). `efectiva` lo calcula el servidor con `visibilidad.js` (lo que ve hoy un visitante); el panel solo lo muestra y nunca replica la regla.
- Orden = galería. `numero` = id sin ceros (misma función que `numeroPrenda`).
- Prendas sin fila: `visible: false`, `cambio: null`.

## `PUT /api/admin/prendas/<id>`
Cuerpo `{"visible": true}` o `{"visible": false}` (cualquier otra forma o campo extra → 400).
- `<id>` debe existir en la galería (404 si no) y cumplir `^[0-9A-Za-z_-]{1,16}$`.
- **200** `{"id","visible","cambio":{"por","en"},"version"}`.
- Idempotente: si ya tiene ese valor, 200 sin escribir ni registrar.
- Escritura en una transacción: `prenda_estado` (upsert) + `registro` + `meta.version + 1`.

## `PUT /api/admin/prendas/<id>/fotos/<n>`
Igual, con `<n>` entero 1…nº de fotos de la prenda (400 si fuera de rango).
- Respuesta `{"id","n","visible","cambio":{…},"version"}`.

## `GET /api/admin/registro?limite=<1..100>`
Últimos cambios, más reciente primero (por defecto 50). Cualquier `limite` inválido → 400.
```json
{ "registro": [ { "en": 1763380900000, "por": "…", "objeto": "foto", "prenda": "001", "foto": 2, "visible": false } ] }
```

## `GET /api/admin/miniaturas/<id>/<n>.webp`
Miniatura (`f/<id>/<n>-160.webp` de R2) **aunque la foto esté oculta**, para que la titular vea qué cambia. `Cache-Control: private, no-store`. 404 si no existe.

## Códigos
| Código | Cuándo |
|---|---|
| 200 | Correcto |
| 304 | Solo en rutas públicas |
| 400 | Cuerpo o parámetro inválido |
| 403 | Sin JWT válido, `Origin` ausente o distinto |
| 404 | Prenda/foto/ruta inexistente |
| 405 | Método no permitido |
| 413 | Cuerpo > 64 bytes |
| 415 | `Content-Type` no JSON |
| 429 | Límite de frecuencia (30 cambios / 10 s por persona) |
| 500 | Error interno genérico (no se revela nada; el estado no cambia) |

## Pruebas de contrato (`node --test`)
- 403 sin cabecera, con JWT caducado, con `aud` o `iss` erróneos, con firma alterada y con `kid` desconocido.
- Un `PUT` sin `Origin` o con `Origin` de otro sitio no cambia nada.
- Cuerpos con campos extra, `visible` no booleano, `id` con `../` o con mayúsculas fuera de patrón → 400/404 y ninguna escritura.
- Transacción: si falla el registro, el estado no cambia.
