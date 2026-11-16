# Modelo de datos — 004

Sin campos nuevos. Cada entrada de `PRENDAS` (`data/galeria.js`) sigue siendo
`{ id, descripcion, imagenes }`.

| Concepto | Regla |
|---|---|
| `id` | Cadena de 1 a 4 cifras (`"001"`, `"12"`). |
| Número de la prenda | `String(Number(id))` → `"1"`, `"12"`. |
| Unicidad | No hay dos prendas con el mismo número (se compara el valor, no el texto). |
| Prendas ocultas | No están en el `PRENDAS` publicado: no se numeran. |
| Portada y `og-cover` | Sin número. |
