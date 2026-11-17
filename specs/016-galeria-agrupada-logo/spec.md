# Feature Specification: Galería agrupada por prenda y logo de portada ajustado

**Feature Branch**: `016-galeria-agrupada-logo`

**Created**: 2026-11-17

**Status**: Draft

**Input**: User description: "Añadir a la galería de la web las fotos de la carpeta fotos-slac (body-1 a body-14), ordenadas y agrupadas: cada prenda es un grupo de fotos (los collages y parejas se separan en fotos individuales; las variantes de color de una misma prenda van en el mismo grupo). Incluir el fondo de portada ya hecho (portada.jpeg) y ajustar el logo de la portada (en móvil se solapa con la modelo). Sin textos de venta ni precios."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver las fotos nuevas agrupadas por prenda (Priority: P1)

Una visitante recorre la galería y encuentra, a continuación de las prendas actuales, las prendas nuevas. Cada prenda aparece una sola vez, con su foto principal, y al abrirla ve todas sus fotos (frente, espalda, otros colores) en el visor, sin collages ni fotos pegadas.

**Why this priority**: es el contenido nuevo que se quiere publicar; sin él no hay funcionalidad.

**Independent Test**: abrir la galería, comprobar que hay una tarjeta por cada grupo nuevo y que el visor de cada una enseña únicamente fotos individuales de esa prenda.

**Acceptance Scenarios**:

1. **Given** la galería cargada, **When** la visitante llega al final, **Then** ve las prendas nuevas en el orden de las fotos de origen, cada una con su número.
2. **Given** una prenda con varias fotos, **When** la abre, **Then** el visor la recorre foto a foto (teclado, flechas y deslizamiento) con el contador de fotos.
3. **Given** un collage de origen (varias fotos en una), **When** se publica, **Then** cada foto del collage es una imagen independiente dentro del grupo de su prenda.

---

### User Story 2 - Portada con fondo propio y logo bien colocado (Priority: P1)

Al entrar, la visitante ve la foto de portada a pantalla completa. En escritorio la imagen ya incorpora el logo; en móvil, el logo y el teléfono se leen con claridad sin tapar el rostro ni el cuerpo de la modelo.

**Why this priority**: es la primera impresión y hoy el logo se solapa con la modelo en móvil.

**Independent Test**: abrir la web a 360, 390, 768 y 1440 px de ancho y comprobar que logo y teléfono se ven completos, legibles y sin cubrir a la modelo.

**Acceptance Scenarios**:

1. **Given** una pantalla de móvil, **When** carga la portada, **Then** el logo y el teléfono se ven completos, con contraste suficiente y sin cubrir el rostro.
2. **Given** una pantalla de escritorio, **When** carga la portada, **Then** el logo no aparece duplicado y el teléfono es visible y pulsable.

---

### User Story 3 - Carga rápida de las fotos nuevas (Priority: P2)

La web sigue cargando rápido pese a tener más fotos: solo se descargan versiones optimizadas y las de fuera de pantalla se cargan al llegar a ellas.

**Why this priority**: mantiene los objetivos de rendimiento ya fijados para el proyecto.

**Independent Test**: medir la primera pantalla en móvil y comprobar que no carga ninguna foto de la galería nueva.

**Acceptance Scenarios**:

1. **Given** la portada recién cargada en móvil, **When** se mide lo transferido, **Then** es menos de 1 MB y no incluye fotos de la galería.

---

### Edge Cases

- Una foto de origen contiene 2 o 4 fotos en una sola imagen: se separan sin dejar bordes ni recortar a la modelo.
- Una prenda tiene una sola foto: se muestra sin contador de fotos.
- Los grupos de variantes de color se publican como una sola prenda; si más adelante hay que separarlos, solo cambia el agrupado, no las fotos.
- Fotos con texto incrustado en la imagen (véase FR-008).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La galería MUST incluir, tras las prendas existentes, las prendas nuevas formadas con las fotos de `fotos-slac` (`body-1` a `body-14`), en el orden de los archivos de origen.
- **FR-002**: Cada prenda nueva MUST ser un único grupo con todas sus fotos individuales; los collages y parejas se separan en fotos independientes.
- **FR-003**: Las variantes de color de una misma prenda MUST estar en el mismo grupo.
- **FR-004**: Cada prenda nueva MUST tener su número visible (solo cifras, a continuación de la última existente) y una descripción neutra para lectores de pantalla.
- **FR-005**: El visor MUST funcionar con las prendas nuevas igual que con las existentes.
- **FR-006**: La portada MUST usar `portada.jpeg` como fondo principal a pantalla completa, con una versión recortada para móvil.
- **FR-007**: El logo de la portada MUST verse completo y legible en móvil y escritorio sin cubrir a la modelo ni duplicarse con el de la imagen.
- **FR-008**: La web MUST NO mostrar textos de venta, precios ni nada que sugiera una tienda (principio I de la constitución). Decisión del usuario (2026-11-17): se mantiene el lema "MODA QUE RESALTA TU ESENCIA" que lleva `portada.jpeg` (la constitución se enmienda para permitirlo solo ahí); en las fotos `body-11` a `body-14` solo debe quedar el texto "SLAC": se elimina la palabra "BOUTIQUE" y el adorno bajo ella.
- **FR-009**: Solo se publicarán versiones optimizadas de las fotos; los originales no se publican.
- **FR-010**: Las fotos nuevas MUST declarar sus dimensiones y cargarse en diferido, salvo la imagen de portada.

### Key Entities

- **Prenda (grupo)**: número visible, descripción neutra y lista ordenada de fotos; la primera es la que se ve en la galería.
- **Foto**: imagen individual obtenida de una imagen de origen (o la imagen entera si ya era individual).
- **Portada**: fondo principal con su versión móvil, logo y teléfono.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100 % de las fotos de `body-1` a `body-14` se pueden ver en la web, cada una como foto individual (22 fotos en 11 prendas).
- **SC-002**: Ninguna foto publicada contiene un collage ni bordes de recorte visibles.
- **SC-003**: En 360, 390, 768 y 1440 px el logo y el teléfono de la portada se ven completos y no cubren el rostro de la modelo.
- **SC-004**: La primera pantalla en móvil transfiere menos de 1 MB y la puntuación de rendimiento móvil se mantiene en 95 o más.
- **SC-005**: La verificación automática del proyecto (`npm run verificar`) pasa sin errores.

## Assumptions

- Agrupado confirmado por el usuario: (1) `body-1`, 4 fotos de un body de encaje; (2), (3) y (4) `body-2`, `body-3` y `body-4`, cada una su propia prenda de 1 foto; (5) a (9) `body-5` a `body-9`, parejas separadas en 2 fotos cada una; (10) `body-10`, 1 foto; (11) `body-11` a `body-14`, cuatro colores de un top palabra de honor en un solo grupo. Total: 11 prendas y 22 fotos.
- Logo: en móvil se baja y se reduce para no tapar a la modelo; en escritorio se mantiene el logo de la propia imagen.
- Las prendas nuevas se numeran a continuación de la última existente (027 a 037).
- Las descripciones son neutras (tipo, color, detalle), sin palabras prohibidas.
- Los originales viven en `fotos-slac/` y no se publican; las versiones optimizadas están en `public/img/`.
- El fondo de portada ya generado (escritorio y móvil) se reutiliza.
- Otra sesión trabaja en paralelo en la rama `015-panel-admin-online` (carpeta `slac-panel`): esta funcionalidad no toca el panel de administración.
