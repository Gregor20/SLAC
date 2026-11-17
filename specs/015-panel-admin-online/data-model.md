# Data Model: Panel de administración online (015)

## Fuente de la galería (no cambia)
`data/galeria.js` sigue siendo la fuente única de prendas, descripciones y fotos (la edita el panel local). Lo que contiene es lo que el panel online puede mostrar u ocultar; una prenda con la casilla «Oculta» del panel local no está en ese archivo y **nunca se sube**.

`npm run publicar` genera `worker/src/galeria.generated.js` (no se edita a mano):

```js
export const GALERIA = {
  anchos: [160, 480, 800, 1200], anchosAvif: [480, 800, 1200],
  prendas: [
    { id: "001", descripcion: "…", fotos: [[1200, 1600], [1200, 1600]] }   // índice + 1 = n (nº original)
  ]
};
```

## Entidades (D1)

### `prenda_estado`
| Campo | Tipo | Regla |
|---|---|---|
| `id` | TEXT PK | Debe existir en `GALERIA.prendas`; formato `^[0-9A-Za-z_-]{1,16}$` |
| `visible` | INTEGER | 0 o 1 (`CHECK`) |
| `por` | TEXT | Correo del JWT (minúsculas), ≤ 254 |
| `en` | INTEGER | Marca de tiempo Unix en ms |

Sin fila → **oculta** (FR-009).

### `foto_estado`
| Campo | Tipo | Regla |
|---|---|---|
| `prenda` | TEXT | Como `prenda_estado.id` |
| `n` | INTEGER | 1 ≤ n ≤ nº de fotos de la prenda en `GALERIA` |
| `visible` | INTEGER | 0 o 1 |
| `por`, `en` | TEXT, INTEGER | Como arriba |

PK `(prenda, n)`. Sin fila → **activa**.

### `registro`
| Campo | Tipo | Regla |
|---|---|---|
| `id` | INTEGER PK autoincremental | |
| `en` | INTEGER | ms Unix |
| `por` | TEXT | Correo |
| `objeto` | TEXT | `'prenda'` o `'foto'` (`CHECK`) |
| `prenda` | TEXT | |
| `foto` | INTEGER NULL | `n`, solo si `objeto = 'foto'` |
| `visible` | INTEGER | Estado nuevo |

Solo se añade (nunca se edita ni borra desde el panel). El panel muestra los últimos 50.

### `meta`
Una única fila (`id = 1`) con `version INTEGER`. Cada cambio de estado incrementa la versión **en la misma transacción** (`batch`). Los aislados del Worker leen solo esta fila para saber si deben recargar.

## Regla de visibilidad (función pura `visibilidad.js`)

```
fotoVisible(prenda, n) = prenda_estado[prenda]?.visible === 1
                         && (foto_estado[prenda, n]?.visible ?? 1) === 1
prendaVisible(prenda)  = prenda_estado[prenda]?.visible === 1
                         && existe al menos una n con fotoVisible
```

- Una prenda visible sin fotos activas no se muestra (sin hueco, sin número suelto).
- Desactivar la prenda no borra los estados de sus fotos: al reactivarla se recupera cada uno (spec, US1 escenario 6).
- Ante cualquier error de lectura el resultado es «oculta» salvo el último estado correcto de menos de 60 s.

## Transiciones

```
(sin fila) ──activar──▶ visible ──desactivar──▶ oculta ──activar──▶ visible
```
Cada transición escribe en `*_estado` + `registro` + `meta.version` en una sola transacción. Repetir el mismo estado no escribe nada (idempotente, devuelve el estado actual).

## Entidades derivadas (no se guardan)
- **Persona autorizada**: la que presenta un JWT válido de Access (correo). La lista vive en Access, no en D1 (research D7).
- **En portada**: una prenda cuyo `id` aparece en `PORTADA` de `data/galeria.js` (se incluye en `galeria.generated.js` como `portada: ["026", …]`).

## Migración
`worker/migraciones/0001_estado.sql` crea las cuatro tablas e inserta `meta(1, 0)`. Se aplica con `wrangler d1 migrations apply <base> --remote -c wrangler.jsonc` (y `--local` en pruebas).
