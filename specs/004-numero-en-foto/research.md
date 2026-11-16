# Research — Número en la foto (004)

## Decisiones

| # | Decisión | Motivo | Alternativas descartadas |
|---|---|---|---|
| 1 | Número = `String(Number(id))`, con `id` validado `^\d{1,4}$`; duplicados por **valor** (`001` y `1` chocan) | FR-007/008: una sola numeración | Campo `numero` aparte (segunda fuente, rechazado en la clarificación) |
| 2 | Etiqueta como **texto del DOM** superpuesto (no en la imagen) | FR-009: cambiar el número no regenera fotos; accesible | Estamparlo en el AVIF/WebP |
| 3 | Galería: esquina **superior izquierda** de `.pieza-boton` | La inferior derecha ya tiene el contador de fotos (`.pieza-num`) | Inferior derecha (colisión) |
| 4 | Visor: número en la **barra superior** (izquierda), no pegado a la foto | La foto se centra con tamaño variable (`position:absolute; inset:0; margin:auto`, MEMORY §6); anclarlo a su esquina exigiría un contenedor ajustado o anchor positioning. La barra es una zona fija, visible con cada foto y cambia con la prenda (FR-002 cumplido en lo esencial). | Marco ajustado alrededor de la foto (frágil) |
| 5 | Estilo: píldora `rgba(10,9,8,.82)` + `backdrop-filter` + texto dorado `--clr-gold-light`, cifras tabulares | Dorado ≥ 6:1 aun sobre una foto blanca → AA; coherente con el diseño | Texto blanco con sombra (ilegible en fotos claras) |
| 6 | Accesibilidad: el `<span>` va **antes** de la foto en el botón → nombre "12 <descripción>"; `<dialog aria-label="12. <descripción>">` | FR-006 sin palabras comerciales | `aria-label` en el botón (pisaría el `alt`) |
| 7 | Panel: `pattern` de 1 a 4 cifras + unicidad por valor | FR-011 | — |

## Modern Web Guidance (consultas genéricas, en inglés)

| Función de plataforma | Consulta | Guía | Resultado |
|---|---|---|---|
| Texto legible sobre fondo variable | `text overlay badge on image readable contrast` | `contrast-color` | Descartada: el fondo de la píldora es fijo y oscuro; `contrast-color()` es para fondos dinámicos. Color fijo con contraste calculado. |
| Nombre accesible de botón con imagen y texto | `accessible name button containing image and text` | `accessibility` (solo búsqueda) | Sin cambios: texto real en el DOM, sin ARIA añadido. |
| Cifras alineadas | — | sin guía | `font-variant-numeric: tabular-nums` (ya usado en el visor). |

## Riesgos

- Foto muy clara bajo la etiqueta: cubierto por la opacidad 0,82 (se mide en `quickstart.md`).
- Las palabras prohibidas de `verificar` no incluyen cifras: sin falsos positivos.
