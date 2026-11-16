# Feature Specification: Número en la foto para identificar la prenda

**Feature Branch**: `004-numero-en-foto`

**Created**: 2026-11-16

**Status**: Draft

**Input**: User description: "Quiero que la persona que está en la web, si le gusta una prenda, pueda saber
cómo identificarla mediante un número que aparece en la foto."

> **Enmienda de la constitución necesaria (antes de planificar).** El principio I prohíbe hoy "nombres,
> referencias o categorías de prendas" y limita el texto visible al teléfono, los botones, el contador del
> visor y "Aviso legal". Esta funcionalidad lo contradice de forma expresa y deseada por el usuario. Hay
> que enmendar el principio I con `/speckit-constitution` (MINOR, v1.1.0) para permitir **un único dato
> nuevo: el número de la prenda (solo cifras)**. Siguen prohibidos los textos de venta, precios, "ref.",
> "código", "pedido", "disponible", "stock", etc. y cualquier pista de tienda o negocio. La numeración no
> puede llevar palabras: es un número y nada más.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver el número de una prenda en su foto (Priority: P1)

Quien recorre la galería y se fija en una prenda ve en su foto un número pequeño y legible. Ese número
es la forma de nombrar esa prenda cuando contacte por teléfono o WhatsApp ("la número 12").

**Why this priority**: es lo que se pide: sin el número visible no hay forma de identificar la prenda.

**Independent Test**: abrir la web en el móvil, localizar cualquier prenda de la galería y comprobar que su
foto muestra un número, distinto del de las demás prendas, sin tapar lo importante de la prenda.

**Acceptance Scenarios**:

1. **Given** la galería cargada, **When** la persona mira una prenda, **Then** ve en su foto un número que
   la identifica, y no hay dos prendas con el mismo número.
2. **Given** fotos de colores muy distintos (claras, oscuras, con encaje), **When** se muestra el número,
   **Then** se lee igual de bien en todas.
3. **Given** una prenda con varias fotos, **When** se ve cada una, **Then** todas llevan el mismo número.

---

### User Story 2 - El número también está en el visor (Priority: P1)

Quien abre una prenda en el visor y la ve en grande sigue viendo su número, en cada una de sus fotos, para
poder decirlo sin volver a la galería.

**Why this priority**: es el momento en que la persona decide que le gusta; el número debe estar ahí.

**Independent Test**: abrir el visor, pasar por todas las fotos de una prenda en móvil y en escritorio y
comprobar que el número está siempre visible.

**Acceptance Scenarios**:

1. **Given** el visor abierto en una prenda, **When** se pasa de foto con flechas, teclado o deslizando,
   **Then** el número se mantiene y es el de esa prenda.
2. **Given** el visor abierto, **When** se cambia a otra prenda, **Then** el número cambia al de la nueva.

---

### User Story 3 - El número sale del identificador de la prenda (Priority: P2)

El número que se ve es el identificador que ya tiene cada prenda (la carpeta `001`, `002`…, sin ceros a la
izquierda). Quien mantiene la web no gestiona números aparte: al añadir una prenda, su número es su
identificador.

**Why this priority**: evita una segunda numeración que mantener y garantiza que no haya números repetidos.

**Independent Test**: añadir una prenda nueva con su identificador y comprobar que la web muestra ese
número; intentar repetir un identificador y comprobar que se avisa.

**Acceptance Scenarios**:

1. **Given** una prenda con identificador `012`, **When** se muestra, **Then** su foto lleva el número 12.
2. **Given** dos prendas con el mismo identificador, **When** se verifica, **Then** se avisa del duplicado
   y no se da por válido.
3. **Given** un identificador que no son solo cifras (1 a 4), **When** se verifica, **Then** se avisa.

---

### Edge Cases

- Identificador que no es numérico: la comprobación automática falla; la web no muestra una etiqueta vacía.
- Número de hasta 4 cifras: se admite sin que se rompa la maquetación.
- Foto muy clara u oscura en la esquina del número: el número conserva el contraste.
- Prenda oculta en el panel: no aparece en la web ni necesita número.
- Lector de pantalla: el número se anuncia junto a la descripción de la foto, sin palabras de venta.
- Con `prefers-reduced-motion`: el número no se anima.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Cada prenda MUST tener un número único (solo cifras, de 1 a 4) mostrado sobre sus fotos en la
  galería.
- **FR-002**: El número MUST mostrarse también en el visor, visible con cada foto de la prenda (en su barra
  superior, zona fija), y cambiar al pasar de prenda.
- **FR-003**: Todas las fotos de una misma prenda MUST mostrar el mismo número.
- **FR-004**: El número MUST ser legible sobre cualquier foto (contraste AA) y ocupar una zona pequeña y
  fija de la foto, sin tapar la prenda de forma relevante, tanto en móvil (360 px) como en escritorio.
- **FR-005**: El número MUST ser solo cifras: sin "Nº", "ref.", "código" ni ninguna otra palabra, y no se
  añade ningún otro texto visible nuevo a la web.
- **FR-006**: El número MUST ser accesible: los lectores de pantalla lo anuncian junto a la prenda sin
  palabras comerciales, y el visor lo incluye en su descripción.
- **FR-007**: El número de una prenda MUST ser su identificador actual en el lugar único de datos de las
  prendas (sin ceros a la izquierda); no existe una segunda numeración que mantener.
- **FR-008**: La comprobación automática MUST fallar si el identificador de una prenda visible no es un
  número de 1 a 4 cifras o si dos prendas comparten el mismo número.
- **FR-009**: El número MUST superponerse a la foto (no formar parte de la imagen optimizada), de modo que
  cambiarlo no obligue a regenerar las fotos.
- **FR-010**: La imagen para compartir (`og-cover`) y las fotos de portada MUST NOT llevar número.
- **FR-011**: El panel de gestión MUST seguir creando identificadores numéricos únicos para las prendas nuevas.

### Key Entities

- **Prenda**: elemento de la galería con sus fotos, su descripción y ahora su **número** (único y visible).
- **Número de prenda**: su identificador actual en cifras (1 a 4); no es un precio ni un código de producto,
  solo una forma de nombrarla.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100 % de las prendas visibles de la galería muestran su número y no hay dos iguales
  (comprobación automática).
- **SC-002**: Una persona que ve la galería por primera vez en el móvil localiza el número de una prenda que
  le gusta en menos de 5 segundos y sin instrucciones.
- **SC-003**: El número cumple contraste AA sobre las fotos más claras y más oscuras de la galería.
- **SC-004**: El rendimiento no empeora: Lighthouse móvil ≥ 95 y sin saltos de maquetación (CLS 0).
- **SC-005**: Añadir una prenda nueva no requiere ningún dato extra para su número y no obliga a regenerar fotos.
- **SC-006**: La web sigue sin mostrar textos de venta, precios ni pistas de tienda (comprobación de
  palabras prohibidas sin errores).

## Clarifications

### Session 2026-11-16

- Q: ¿De dónde sale el número de cada prenda? → A: del identificador actual (001 → 1), sin numeración propia.

## Assumptions

- El número identifica a la **prenda**, no a cada foto, y se muestra como una pequeña etiqueta superpuesta en
  una esquina de la foto.
- No hay buscador ni filtro por número, ni botón para "reservar" o "pedir": la persona simplemente dice el
  número al llamar o escribir por WhatsApp (que sigue abriéndose sin mensaje).
- El diseño exacto de la etiqueta (esquina, tamaño, fondo) se decide en el plan, respetando el estilo oscuro
  y dorado y el principio II (las fotos mandan).
- Las prendas ocultas en el panel no se muestran y no hace falta numerarlas.
- El resto de la constitución sigue vigente (cero recursos de terceros, sin código en línea, mobile-first).
