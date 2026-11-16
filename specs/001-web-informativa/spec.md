# Feature Specification: Web informativa SLAC (solo fotos y teléfono)

**Feature Branch**: `001-web-informativa`

**Created**: 2026-11-16

**Status**: Draft

**Input**: User description: "Web informativa SLAC: convertir la web actual (catálogo con textos de venta) en una galería meramente informativa. Solo se muestran el logo, las fotos de las prendas y el teléfono de contacto (llamada y WhatsApp sin mensaje predefinido), con un buen diseño. Eliminar todo texto comercial o de normativa visible: eslóganes, sección Atelier, nombres, referencias, categorías, filtros, etiquetas de nueva/agotado, botones de consulta y mensajes predefinidos. Quitar las fotos de bancos de imágenes y usar solo fotos propias. Nada debe sugerir que es un negocio o una tienda. La información legal queda en una única página de aviso legal neutra enlazada de forma discreta desde el pie."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver las prendas (Priority: P1)

Una persona abre la web desde el móvil (normalmente desde un enlace compartido). Lo primero que ve
es una foto propia de una prenda a pantalla completa con el logo. Al bajar encuentra todas las
prendas en una galería cuidada, sin textos. Al tocar una prenda se abre un visor con todas sus
fotos, que puede recorrer deslizando el dedo o con flechas, y cerrar para volver al mismo punto.

**Why this priority**: es el propósito de la web; sin esto no hay nada que mostrar.

**Independent Test**: abrir la web en un móvil, recorrer la galería y abrir varias prendas
(una con una sola foto y otra con varias) comprobando que se ven todas sus fotos.

**Acceptance Scenarios**:

1. **Given** la web recién abierta, **When** carga, **Then** la primera pantalla muestra una foto
   propia de una prenda y el logo, sin ningún texto comercial.
2. **Given** la galería, **When** se recorre hasta el final, **Then** aparecen todas las prendas
   publicadas, cada una representada por su primera foto, sin nombres, referencias, categorías,
   etiquetas ni botones.
3. **Given** una prenda con varias fotos, **When** se toca, **Then** se abre un visor que muestra
   la primera foto, un contador discreto ("1 / 5") y permite pasar a las siguientes deslizando,
   con flechas en pantalla, con las flechas del teclado o tocando miniaturas.
4. **Given** el visor abierto, **When** se cierra (botón, tecla Escape o toque fuera de la foto),
   **Then** la galería sigue en la misma posición.

---

### User Story 2 - Contactar por teléfono o WhatsApp (Priority: P1)

Quien está viendo las prendas quiere contactar. El número está siempre a mano: en la cabecera,
en un botón flotante y en un bloque de contacto al final. Puede llamar con un toque o abrir
WhatsApp, que se abre con el chat vacío, sin mensaje escrito de antemano.

**Why this priority**: el teléfono es el único otro contenido que el usuario quiere en la web.

**Independent Test**: desde cualquier punto de la página, tocar el teléfono (abre la llamada) y
tocar WhatsApp (abre un chat con ese número sin texto).

**Acceptance Scenarios**:

1. **Given** cualquier posición de desplazamiento, **When** se busca el contacto, **Then** hay
   una forma de llamar o abrir WhatsApp a un solo toque sin desplazarse.
2. **Given** el enlace de WhatsApp, **When** se abre, **Then** el chat aparece sin mensaje
   predefinido.
3. **Given** el bloque final de contacto, **When** se ve, **Then** muestra el número completo en
   grande y las opciones "Llamar" y "WhatsApp", sin ningún otro texto.

---

### User Story 3 - Nada que sugiera un negocio (Priority: P2)

Quien revisa la web (el propio usuario o cualquier visitante) no encuentra textos de venta,
precios, normativa visible ni nada que indique que es una tienda o un negocio, ni en lo que se ve
ni en los textos ocultos que leen buscadores y lectores de pantalla. La información legal
obligatoria está en una única página neutra a la que se llega desde un enlace pequeño en el pie.

**Why this priority**: es la condición explícita del usuario sobre el contenido.

**Independent Test**: leer todo el texto visible y oculto de la web y del aviso legal buscando
términos comerciales; ninguno debe aparecer.

**Acceptance Scenarios**:

1. **Given** la página principal, **When** se lee todo su texto visible, **Then** solo aparecen el
   número de teléfono, las etiquetas "Llamar" y "WhatsApp", el contador del visor y el enlace
   "Aviso legal".
2. **Given** los textos no visibles (título de la pestaña, descripción para buscadores,
   descripciones de las fotos, datos para buscadores), **When** se revisan, **Then** son neutros
   e informativos y no contienen términos comerciales.
3. **Given** el pie, **When** se pulsa "Aviso legal", **Then** se abre una página neutra con los
   datos del titular, la propiedad de las fotos y la privacidad, sin términos comerciales.
4. **Given** la web, **When** se revisan todas sus imágenes, **Then** todas son fotos propias de
   las prendas (ninguna procede de bancos de imágenes).

---

### User Story 4 - Mantener las fotos al día (Priority: P3)

El responsable de la web sigue pudiendo añadir, ocultar o quitar prendas y cambiar el orden de
sus fotos con la herramienta interna, que ya no pide datos de venta (estado, categoría,
novedades) sino solo la descripción neutra de la prenda y sus fotos.

**Why this priority**: necesario para mantener la web, pero no lo ve el visitante.

**Independent Test**: añadir una prenda de prueba con la herramienta interna, exportar los datos
y comprobar que aparece en la galería con su descripción como texto alternativo.

**Acceptance Scenarios**:

1. **Given** la herramienta interna, **When** se añade una prenda, **Then** solo se piden su
   identificador interno, su descripción neutra y sus fotos.
2. **Given** una prenda marcada como oculta, **When** se exportan los datos públicos, **Then** no
   aparece en ellos.

### Edge Cases

- **Prenda con una sola foto**: el visor no muestra flechas, contador ni miniaturas.
- **Teléfono aún no definido**: la web muestra el número provisional; publicarla queda bloqueado
  hasta poner el real (se gestiona en la funcionalidad de publicación).
- **Foto que no carga**: su hueco conserva el tamaño y un fondo neutro; la galería no se descoloca.
- **JavaScript desactivado**: se ven el logo, el teléfono y un aviso mínimo de que la galería
  necesita JavaScript.
- **Pantallas muy anchas o muy estrechas** (360 px a 1920 px o más): sin desplazamiento horizontal
  y con las fotos sin deformar.
- **Movimiento reducido** activado en el dispositivo: sin animaciones de entrada ni zoom.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La página principal MUST mostrar solo: logo, fotos propias de las prendas, número de
  teléfono, acciones "Llamar" y "WhatsApp", contador del visor y enlace "Aviso legal".
- **FR-002**: La primera pantalla MUST mostrar una composición con fotos propias de prendas y el
  logo, sin eslóganes ni párrafos.
- **FR-003**: La galería MUST mostrar todas las prendas publicadas, una pieza por prenda con su
  primera foto, sin nombre, referencia, categoría, etiqueta ni botón.
- **FR-004**: Cada pieza de la galería MUST abrir un visor con todas las fotos de la prenda,
  navegable por deslizamiento, flechas en pantalla, teclado y miniaturas, y cerrable con botón,
  Escape o toque fuera de la foto.
- **FR-005**: Cada pieza de la galería MUST indicar de forma discreta (sin palabras) que la prenda
  tiene más de una foto.
- **FR-006**: El número de teléfono MUST estar accesible a un toque desde cualquier posición: en
  la cabecera, en un botón flotante y en un bloque de contacto final.
- **FR-007**: La acción "WhatsApp" MUST abrir un chat con el número sin mensaje predefinido; la
  acción "Llamar" MUST iniciar la llamada.
- **FR-008**: El número MUST definirse en un único lugar de los datos; ningún otro archivo lo
  repite.
- **FR-009**: Ningún texto de la web (visible o no) MUST contener términos que sugieran negocio o
  venta: precio, venta, compra, tienda, pedido, encargo, disponibilidad, stock, talla, envío,
  oferta, descuento, cliente, colección, catálogo, empresa, comercial.
- **FR-010**: Las imágenes de bancos de imágenes MUST eliminarse; solo se usan fotos propias.
- **FR-011**: Cada foto MUST tener una descripción alternativa neutra (tipo de prenda, color y
  detalle principal) para lectores de pantalla.
- **FR-012**: La información legal MUST concentrarse en una única página "Aviso legal" neutra
  (titular, condiciones de uso, propiedad de las fotos, privacidad y ausencia de cookies),
  enlazada solo desde el pie. Las páginas legales separadas actuales dejan de existir.
- **FR-013**: La web MUST funcionar sin pedir nada a servicios de terceros al cargarse (sin
  fuentes, iconos ni imágenes externas), de modo que no use cookies.
- **FR-014**: La herramienta interna de gestión MUST adaptarse a los nuevos datos: identificador,
  descripción, fotos y opción de ocultar; sin estados de venta, categorías ni novedades.
- **FR-015**: Existe una comprobación automática que falla si aparece algún término prohibido
  (FR-009), algún recurso externo (FR-013) o código incrustado en las páginas publicadas.

### Key Entities

- **Prenda**: una pieza de ropa mostrada en la galería. Atributos: identificador interno (no se
  muestra), descripción neutra para accesibilidad, lista ordenada de fotos (la primera es la
  portada) y, solo en la herramienta interna, la marca de oculta.
- **Contacto**: número de teléfono tal como se muestra, número para la llamada y número para
  WhatsApp. Uno solo para toda la web.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 0 apariciones de términos comerciales (FR-009) en todo el texto de las páginas
  publicadas y sus archivos, comprobado automáticamente.
- **SC-002**: el 100 % de las prendas publicadas se puede ver en la galería y el 100 % de sus
  fotos en el visor.
- **SC-003**: desde cualquier posición de la página, contactar requiere 1 toque.
- **SC-004**: 0 peticiones a dominios de terceros al cargar la web.
- **SC-005**: el 100 % de las fotos tiene descripción alternativa neutra.
- **SC-006**: la web se ve sin desplazamiento horizontal ni fotos deformadas de 360 px a 1920 px.
- **SC-007**: el texto visible de la página principal se limita a los elementos de FR-001.

## Assumptions

- El número de teléfono real lo facilitará el usuario al final; hasta entonces se mantiene el
  provisional. WhatsApp usa el mismo número.
- La agrupación actual de fotos por prenda (26 prendas) es correcta; las uniones marcadas como
  "por confirmar" se revisarán en la página de revisión por modelo.
- Los datos del titular del aviso legal los completará el usuario (quedan marcados como
  pendientes); la redacción legal final conviene revisarla con su gestoría.
- La optimización de las fotos (formatos y tamaños) es la funcionalidad 002; el SEO técnico y la
  publicación son la 003. Esta funcionalidad funciona con las fotos tal como estén disponibles.
- La herramienta interna se usa solo en local y no se publica.
