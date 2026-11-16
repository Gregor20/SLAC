# Research: Optimización de fotos

## R1. Formato y calidad

Muestra de 6 fotos (encaje, satén, composiciones) a 800 px:

| Formato | Peso total | Diferencia |
|---|---|---|
| WebP q76 (actual) | 322 KB | — |
| AVIF q55 | 265 KB | −18 % |
| **AVIF q50** | **202 KB** | **−37 %** |
| AVIF q45 | 163 KB | −49 % |

- **Decision**: AVIF q50, `effort: 4`, en 480/800/1200 px; WebP q68-76 como respaldo; miniaturas de
  160 px solo WebP (pesan 3-6 KB y el ahorro no compensa otra petición/archivo).
- **Rationale**: en un recorte de encaje rojo (image00030) AVIF q50 no muestra diferencias apreciables
  frente al WebP actual; q45 empieza a suavizar el tejido.
- **Alternatives considered**: solo AVIF (dejaría sin fotos a navegadores antiguos); JPEG XL (sin
  soporte general); bajar la calidad WebP (artefactos visibles en encajes).

## R2. Logo

| Ajuste WebP | Peso (560 px) |
|---|---|
| q90, alfa 100 (actual) | 52 KB |
| q80, alfa 80 | 38 KB |
| **q75-78, alfa 70-75** | **≈ 27-30 KB** |
| sin pérdida | 95 KB |

- **Decision**: WebP q78, alfa 75, `effort: 6`; revisar a ojo los bordes sobre foto.

## R3. Imagen para compartir

- **Decision**: `public/img/og-cover.jpg`, 1200×630, JPEG mozjpeg q80: las fotos de portada 2 | 1 | 3
  recortadas a 400×630 y el logo centrado en el tercio inferior sobre un degradado oscuro. JPEG por
  compatibilidad con las vistas previas de WhatsApp y redes.

## R4. Marcado

- **Decision**: `<picture><source type="image/avif" srcset sizes><img src srcset sizes …></picture>`.
  El `<img>` conserva clases, dimensiones, `alt`, `loading` y `fetchpriority`, así que los estilos
  existentes siguen aplicándose. En el visor se actualiza el `srcset` del `<source>` junto al del `<img>`.

## R5. Resultados medidos (T008)

Edge sin ventana, 390×844 a 3×, caché desactivada, 4 s tras cargar (script fuera del proyecto).
Comparación sobre la misma máquina, con el commit anterior (WebP) y el actual (AVIF + WebP):

| | Antes (001) | Después (002) | Cambio |
|---|---|---|---|
| Imágenes en la primera carga | 717 KB (13) | 433 KB (13) | **−40 %** |
| Total de la primera carga | 818 KB | 537 KB | −34 % |
| Logo (560 px) | 54 KB | 30 KB | −44 % |

- SC-001 cumplido (−40 % en imágenes; −34 % frente a los 653 KB de imágenes de la medición de partida).
- SC-003: portada y logo revisados a ojo en la captura móvil: sin artefactos ni bordes en el logo.
- Visor: abre en AVIF, cambia el `<source>` y el `<img>` al pasar de foto y queda sin `src`/`srcset` al
  cerrar. Segunda foto al pasar el ratón: `<picture>` con AVIF. Sin errores de consola.
- **Incidencia resuelta:** con `picture { display: contents }` los `<source>` se maquetaban como hijos
  vacíos de la rejilla de la portada y la foto dejaba de cubrir (650 px en vez de 844). Solución:
  `picture source { display: none }` (`styles.css`).
- **Logo:** q78/alfa 75 daba 36 KB; el canal alfa pesa más que el color, así que se fijó alfa 60 (30 KB).
- **SC-002 (Lighthouse ≥ 95): pendiente de medir.** `npx lighthouse` no se pudo ejecutar en esta sesión.
