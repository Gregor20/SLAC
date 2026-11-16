# Implementation Plan: Número en la foto para identificar la prenda

**Branch**: `004-numero-en-foto` | **Date**: 2026-11-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-numero-en-foto/spec.md`

## Summary

Cada prenda muestra su número (su `id` sin ceros a la izquierda, 1 a 4 cifras) como una pequeña
etiqueta superpuesta en la esquina superior izquierda de su foto en la galería y en la barra
del visor. Todo se resuelve con DOM, CSS y los datos que ya existen: no hay dato nuevo, ni
imagen regenerada, ni dependencia. La comprobación (`npm run verificar`) y el panel de gestión
imponen que el `id` sea un número de 1 a 4 cifras y único.

1. **`lib.js`**: `numeroPrenda(p)` (única fuente de la regla `id` → número).
2. **Galería (`app.js`, `styles.css`)**: `<span class="pieza-id">` dentro de `.pieza-boton`,
   esquina superior izquierda (la inferior derecha ya la ocupa el contador de fotos).
3. **Visor (`index.html`, `visor.js`, `visor.css`)**: `<span class="visor-id">` en la barra,
   a la izquierda; cambia con la prenda; el `aria-label` del `<dialog>` lo incluye.
4. **`scripts/datos.js` + `scripts/verificar.js`**: regla compartida y comprobación (formato,
   duplicados por valor numérico).
5. **`admin.js` / `admin.html`**: el identificador nuevo debe ser de 1 a 4 cifras y único por valor.

## Technical Context

**Language/Version**: HTML5 + CSS + JavaScript ES2020+ sin transpilar; Node.js ≥ 18.17 (herramientas)

**Primary Dependencies**: ninguna nueva (`sharp` solo para fotos, sin tocarlo)

**Storage**: `data/galeria.js` (el `id` ya existe; sin campos nuevos)

**Testing**: `npm run verificar`; prueba visual con Edge sin ventana a 390 y 1440 px (MEMORY §6)

**Target Platform**: Chrome, Edge, Firefox y Safari recientes

**Project Type**: web estática informativa

**Performance Goals**: Lighthouse móvil ≥ 95, CLS 0; el número es texto (≈ 0 bytes de red extra)

**Constraints**: sin recursos de terceros, sin código en línea (CSP), archivos JS ≤ 200 líneas,
solo cifras visibles, contraste AA sobre cualquier foto

**Scale/Scope**: 26 prendas; 1 etiqueta por foto de galería y 1 en el visor

## Constitution Check (v1.2.0)

| Principio | Estado | Nota |
|---|---|---|
| I Solo fotos y teléfono | ✅ | Número permitido por la enmienda 1.2.0: solo cifras, sin palabras; `alt`/`aria-label` sin "Nº", "ref." ni "código". |
| II Fotos protagonistas | ✅ | Etiqueta pequeña en esquina fija; sin animación propia; contraste AA. |
| III Rendimiento | ✅ | Texto en el DOM, sin imágenes ni listeners nuevos. |
| IV Seguridad | ✅ | Número con `sanitize`/`textContent`; sin `style` en línea (clases CSS). |
| V Semántica y SEO | ✅ | Sin cambios en `h1`, JSON-LD ni metadatos; `alt` intacto. |
| VI Simplicidad | ✅ | Sin framework ni build; un único helper; archivos < 200 líneas. |

Re-evaluado tras el diseño: sin violaciones. **Complexity Tracking**: vacío.

## Project Structure

### Documentation (this feature)

```text
specs/004-numero-en-foto/
├── spec.md · plan.md · research.md · data-model.md · quickstart.md
├── contracts/ui.md
├── checklists/requirements.md
└── tasks.md            # lo genera /speckit-tasks
```

### Source Code (repository root)

```text
lib.js                # + numeroPrenda(p)
app.js                # piezaHTML: <span class="pieza-id">
styles.css            # .pieza-id (etiqueta dorada sobre fondo oscuro translúcido)
index.html            # <span class="visor-id" id="visor-id"> en .visor-barra
visor.js · visor.css  # número en la barra; aria-label con número
scripts/datos.js      # numeroPrenda compartido para Node
scripts/verificar.js  # comprobación de id/número
admin.js · admin.html # id nuevo: 1-4 cifras y único por valor
```

**Structure Decision**: se amplía la estructura existente; no se crean archivos de código nuevos.

## Complexity Tracking

Sin violaciones que justificar.
