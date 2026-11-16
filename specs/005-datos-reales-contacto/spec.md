# Feature Specification: Datos reales del titular y del contacto

**Feature Branch**: `005-datos-reales-contacto`

**Created**: 2026-11-16

**Status**: Draft

**Input**: User description: "En el aviso legal el titular es SLAC, quita el NIF, y pon el Instagram [INSTAGRAM]. El teléfono pasa a ser +34 000000000."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - El teléfono real en toda la web (Priority: P1)

Quien quiere contactar por una prenda llama o escribe por WhatsApp al número real de SLAC, +34 000 000 000,
desde cualquier punto de la web donde aparece el contacto (cabecera, bloque final y botón flotante).

**Why this priority**: con el número provisional la web no sirve para contactar; es lo que falta para poder publicarla.

**Independent Test**: abrir la web en el móvil, pulsar "Llamar" y WhatsApp y comprobar que marcan y abren el chat
con +34 000000000, y que el número visible es el mismo en todos los sitios.

**Acceptance Scenarios**:

1. **Given** la web cargada, **When** se mira el número de contacto (cabecera y bloque final), **Then** se
   lee "+34 000 000 000" en todos los sitios y en ninguno aparece el provisional.
2. **Given** un móvil, **When** se pulsa llamar, **Then** se marca +34000000000.
3. **Given** el botón de WhatsApp, **When** se pulsa, **Then** se abre el chat con 34000000000, sin mensaje escrito.

---

### User Story 2 - Titular real y sin NIF en el aviso legal (Priority: P1)

Quien abre el aviso legal ve como titular "SLAC", no ve ninguna fila de NIF y ve el Instagram `[INSTAGRAM]`
como dato de contacto del titular.

**Why this priority**: son los datos que el usuario ha facilitado; el aviso no debe mostrar marcadores sin completar de datos ya conocidos.

**Independent Test**: abrir `aviso-legal.html` y comprobar titular, ausencia de NIF e Instagram.

**Acceptance Scenarios**:

1. **Given** el aviso legal, **When** se lee la sección "Titular del sitio web", **Then** el titular es "SLAC".
2. **Given** esa misma sección, **When** se revisan los datos, **Then** no hay ninguna fila ni mención de NIF/NIE.
3. **Given** esa misma sección, **When** se revisan los datos, **Then** aparece el Instagram "[INSTAGRAM]" como texto (sin enlace).
4. **Given** el aviso, **When** se revisan el domicilio y el correo, **Then** siguen marcados como pendientes de completar.

---

### User Story 3 - El provisional desaparece (Priority: P2)

Quien mantiene la web no encuentra el teléfono provisional en los datos, la documentación ni la comprobación automática:
no queda ningún aviso de "teléfono provisional" ni rastro de +34 600 000 000.

**Why this priority**: evita publicar o documentar un dato falso por descuido.

**Independent Test**: buscar el provisional en el proyecto (fuera de copias de seguridad e historial de specs) y ejecutar la comprobación automática.

**Acceptance Scenarios**:

1. **Given** el proyecto, **When** se busca "600 000 000" / "600000000" en datos, guía de actualización, comprobación y memoria, **Then** no aparece.
2. **Given** la comprobación automática, **When** se ejecuta, **Then** no avisa de teléfono provisional y valida el formato del número real.

---

### Edge Cases

- El número se muestra con espacios y se usa sin ellos para llamar y para WhatsApp (sin `+` ni espacios en `wa.me`).
- El aviso legal debe seguir sin enlaces a terceros nuevos: el Instagram es solo texto.
- El Instagram no se añade a la página principal (la constitución limita el texto visible allí).
- Sin JavaScript el número no aparece (ya ocurre hoy); no se muestran enlaces vacíos.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El teléfono de contacto MUST ser +34 000000000 en un único lugar de datos, y todos los puntos de contacto (visible, llamar, WhatsApp) MUST derivarse de él.
- **FR-002**: El número visible MUST mostrarse como "+34 000 000 000"; el enlace de llamada MUST usar "+34000000000" y el de WhatsApp "34000000000" sin mensaje predefinido.
- **FR-003**: El aviso legal MUST indicar como titular "SLAC".
- **FR-004**: El aviso legal MUST NOT mostrar NIF, NIE ni ninguna fila de identificación fiscal.
- **FR-005**: El aviso legal MUST mostrar el Instagram "[INSTAGRAM]" entre los datos del titular, como texto sin enlace.
- **FR-006**: El domicilio y el correo del aviso legal MUST seguir marcados como pendientes de completar hasta que el usuario los facilite.
- **FR-007**: El teléfono provisional +34 600 000 000 MUST desaparecer de los datos, la guía de actualización de fotos y la comprobación automática, y esta ya MUST NOT avisar de "teléfono provisional".
- **FR-008**: La comprobación automática MUST seguir validando el formato del teléfono y no debe aceptar de nuevo el provisional.
- **FR-009**: La página principal MUST NOT añadir ningún texto visible nuevo (el Instagram solo va en el aviso legal).

### Key Entities

- **Contacto**: número de teléfono en tres formas derivadas (visible, llamada, WhatsApp).
- **Datos del titular**: titular, Instagram, domicilio y correo (estos dos pendientes) del aviso legal.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100 % de los puntos de contacto de la web usan +34 000000000 y ninguno el provisional (comprobación automática y revisión en navegador a 390 y 1440 px).
- **SC-002**: El aviso legal muestra titular "SLAC" e Instagram, sin NIF, y solo quedan 2 marcadores pendientes (domicilio y correo).
- **SC-003**: La búsqueda del provisional en archivos del proyecto (sin copias ni specs anteriores) da 0 resultados.
- **SC-004**: `npm run verificar` pasa sin avisos de teléfono provisional y el rendimiento no empeora (Lighthouse móvil ≥ 95, CLS 0).
- **SC-005**: La web sigue sin mostrar textos de venta ni pistas de tienda (comprobación de palabras prohibidas sin errores).

## Assumptions

- El número es de España (+34) y sirve para llamada y para WhatsApp.
- "NIE" en la petición se refiere a la fila "NIF" del aviso legal.
- El Instagram es un dato legal de contacto del titular y va solo en el aviso legal, sin enlace (la constitución IV permite solo `tel:` y `wa.me` como enlaces externos); no requiere enmendar la constitución.
- Domicilio y correo los facilitará el usuario más adelante.
- Las copias en `_backup-original/` y las specs históricas no se tocan.
