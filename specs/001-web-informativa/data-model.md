# Data Model: Web informativa SLAC

Todo vive en `data/galeria.js` (público) salvo la marca de oculta, que solo existe en la copia
privada del panel. Formato exacto en [contracts/galeria-js.md](./contracts/galeria-js.md).

## Contacto (`CONTACTO`)

| Campo | Tipo | Regla |
|---|---|---|
| `telefono` | texto | Número tal como se muestra (`+34 600 000 000`) |
| `telefonoRaw` | texto | Solo `+` y dígitos, para `tel:` |
| `whatsapp` | texto | Solo dígitos con prefijo de país, sin `+`, para `wa.me/` |

Sin mensajes predefinidos. Mientras `telefonoRaw` sea `+34600000000` el teléfono se considera
provisional (aviso en `verificar`).

## Portada (`PORTADA`)

Lista ordenada de `{ prenda, foto }`:
- `prenda`: `id` de una prenda existente; `foto`: posición (desde 1) dentro de sus `imagenes`.
- Posiciones con significado: 1 = foto principal (móvil y centro del tríptico), 2 = izquierda,
  3 = derecha, 4 = fondo del bloque de contacto. Exactamente 4 entradas.

## Prenda (`PRENDAS[]`)

| Campo | Tipo | Regla |
|---|---|---|
| `id` | texto | Único, solo dígitos/letras/guiones; no se muestra; nombra la carpeta `public/img/<id>/` |
| `descripcion` | texto | Obligatoria, neutra (tipo, color, detalle), sin términos prohibidos; se usa como `alt` |
| `imagenes` | lista de rutas | ≥ 1, rutas `public/fotos/…` existentes; la primera es la portada de la pieza |
| `oculta` | booleano | Solo en la copia privada del panel; nunca en `galeria.js` |

Transiciones: *nueva* (se añade en el panel) → *publicada* (exportada en `galeria.js` y
optimizada) ⇄ *oculta* (solo en la copia privada) → *eliminada*.

## Fotos optimizadas (`FOTOS_OPT`, generado)

```text
FOTOS_OPT = {
  anchos:  [160, 480, 800, 1200],
  prendas: { "<id>": [[ancho, alto], …] }   // una entrada por foto, en orden
}
```

`getFotos(prenda)` → `[{ src, srcset, thumb, ancho, alto }]`. Si no hay datos de una prenda, usa
los originales con `ancho`/`alto` vacíos.
