# Research: 016 Galería agrupada y logo de portada

## Guías de Modern Web Guidance

| Función de plataforma | Guía | Resultado |
|---|---|---|
| Imagen de portada con versión distinta para móvil y escritorio (art direction) | sin guía consultada: `<picture>` con `<source media>` y `type` es el patrón estándar ya usado en el proyecto | aplicado |
| Imágenes AVIF/WebP con `srcset` | ya resuelto en la funcionalidad 002 | sin cambios |

## Decisiones

- **Costuras de los collages**: medidas por diferencia de columnas/filas en los originales (`body-1`: x 442, y 752;
  `body-5/6/8`: x 450; `body-7`: x 456–457; `body-9`: x 563). Se recortan 2 px junto a la costura.
  `body-9` (1122×1402) y `body-11` a `body-14` (≈1088×1446) no miden 900×1600.
- **Borrado de "BOUTIQUE"**: se detectan las filas doradas del rótulo (tras "SLAC") y se cubren con un trozo de
  pared lisa tomado justo debajo (desplazado 25 px a la derecha para no copiar el brazo del maniquí), con bordes difuminados.
- **Parejas estrechas**: `body-5` a `body-8` dan fotos de 450×1600; se publican tal cual, como pidió el usuario.
- **Logo**: móvil 44 vw (máx. 210 px) y más bajo; escritorio: oculto visualmente (queda para lectores de pantalla).
- **Legacy-scan**: 4 hallazgos previos a esta funcionalidad (`visor.js:79,103`, `admin.js:9,10`); no se tocan aquí.
