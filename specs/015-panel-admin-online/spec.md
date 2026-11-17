# Feature Specification: Panel de administración online

**Feature Branch**: `015-panel-admin-online`

**Created**: 2026-11-17

**Status**: Draft

**Input**: User description: "Panel de administración online para activar o desactivar fotos de la web desde cualquier sitio, incluido el móvil. Solo la persona autorizada puede entrar (acceso seguro, sin contraseñas propias, con comprobación en el servidor). Al desactivar una foto o prenda desaparece de la web pública y resulta imposible verla, incluso con su enlace directo; al activarla vuelve a verse sin tener que volver a publicar la web. La web pública sigue siendo solo fotos y teléfono, rápida y sin recursos de terceros. Debe poder darse y quitarse acceso a otras personas."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Activar y desactivar fotos desde el móvil (Priority: P1)

La titular (o una persona autorizada) abre el panel desde cualquier dispositivo, se identifica de
forma segura, ve todas las prendas con su estado (visible u oculta) y cambia el estado de una con un
solo gesto. El cambio se refleja en la web pública sin tener que ejecutar herramientas en un
ordenador ni volver a publicar la web.

**Why this priority**: es el núcleo de la petición; hoy ocultar o mostrar una prenda exige el PC del proyecto y una publicación completa.

**Independent Test**: desde un móvil, entrar al panel, desactivar una prenda y comprobar en la web pública (otra pestaña o dispositivo) que desaparece; volver a activarla y comprobar que reaparece.

**Acceptance Scenarios**:

1. **Given** una persona autorizada con sesión iniciada, **When** desactiva una prenda visible, **Then** la prenda deja de aparecer en la web pública en menos de 1 minuto.
2. **Given** una prenda desactivada, **When** la persona autorizada la activa, **Then** reaparece en la web pública en menos de 1 minuto, sin publicar de nuevo.
3. **Given** el panel abierto en un móvil de 360 px de ancho, **When** la persona lo usa, **Then** puede ver el estado de todas las prendas y cambiarlo sin desplazamientos horizontales ni zoom.
4. **Given** un cambio guardado, **When** se recarga el panel, **Then** el estado mostrado coincide con el de la web pública.
5. **Given** una prenda visible con varias fotos, **When** la persona desactiva solo una de ellas, **Then** esa foto desaparece de la galería y del visor y las demás siguen visibles.
6. **Given** una prenda con una foto desactivada, **When** se desactiva y se vuelve a activar la prenda, **Then** la foto desactivada sigue oculta y las demás reaparecen.

---

### User Story 2 - Una foto desactivada es imposible de ver (Priority: P1)

Cuando una foto o prenda se desactiva, no basta con que desaparezca de la galería: nadie puede
verla, ni siquiera quien tenga o adivine su dirección directa, ni desde una copia guardada
(caché) del navegador o de la red tras el plazo de actualización.

**Why this priority**: es la razón de ocultar; una foto «desactivada» que sigue accesible por enlace sería un fallo de privacidad.

**Independent Test**: guardar la dirección directa de una imagen visible, desactivar la prenda y comprobar que la dirección deja de entregar la imagen (no se encuentra) para cualquier visitante.

**Acceptance Scenarios**:

1. **Given** una prenda desactivada, **When** un visitante abre la dirección directa de cualquiera de sus imágenes, **Then** no recibe la imagen.
2. **Given** una prenda desactivada, **When** se inspecciona el código y los datos que recibe la web pública, **Then** no aparece ni su número, ni sus imágenes, ni su descripción.
3. **Given** un fallo del servicio que guarda los estados, **When** un visitante abre la web, **Then** nunca ve una prenda desactivada (ante la duda, se oculta).

---

### User Story 3 - Dar y quitar acceso a otras personas (Priority: P2)

La titular puede autorizar a otra persona (por ejemplo, una ayudante) para gestionar las fotos y
retirarle el acceso cuando quiera, sin compartir contraseñas ni claves.

**Why this priority**: permite delegar y revocar sin riesgo; secundario porque la titular ya puede usar el panel sola.

**Independent Test**: autorizar a una segunda persona, comprobar que entra y cambia un estado; retirarle el acceso y comprobar que ya no puede entrar ni cambiar nada.

**Acceptance Scenarios**:

1. **Given** una persona no autorizada, **When** intenta abrir el panel o enviar un cambio, **Then** se le deniega el acceso sin mostrar ningún dato de las prendas.
2. **Given** una persona autorizada, **When** la titular le retira el acceso, **Then** deja de poder entrar y de guardar cambios en menos de 5 minutos, incluso con una sesión abierta.
3. **Given** un intento de cambio sin identificación válida, **When** llega al servidor, **Then** se rechaza y no modifica ningún estado.

---

### User Story 4 - La web pública no cambia (Priority: P3)

Para el visitante, la web sigue siendo solo fotos y teléfono: igual de rápida, sin recursos de
terceros ni cookies, sin ninguna pista de que existe un panel.

**Why this priority**: protege lo ya conseguido (constitución I–IV); no aporta funcionalidad nueva, pero un fallo aquí estropea el resto.

**Independent Test**: comparar la web pública antes y después: mismo aspecto, mismas medidas de rendimiento y ningún enlace ni texto que lleve al panel.

**Acceptance Scenarios**:

1. **Given** la web pública, **When** se recorre, **Then** no hay enlaces, textos ni metadatos que mencionen el panel, y el panel no aparece en buscadores ni en el mapa del sitio.
2. **Given** la web con el panel activo, **When** se mide en móvil, **Then** mantiene los objetivos de rendimiento actuales (Lighthouse móvil ≥ 95, < 1 MB en la primera pantalla).
3. **Given** un visitante, **When** abre la web, **Then** no se contacta con ningún servicio de terceros ni se guardan cookies.

---

### User Story 5 - Saber quién cambió qué (Priority: P3)

Cada cambio de estado queda registrado con la persona y el momento, para poder aclarar quién
ocultó o mostró una prenda.

**Why this priority**: da trazabilidad cuando hay más de una persona con acceso.

**Independent Test**: hacer un cambio y ver en el panel la última modificación de esa prenda con persona y hora.

**Acceptance Scenarios**:

1. **Given** un cambio de estado, **When** se consulta la prenda en el panel, **Then** se ve quién lo hizo y cuándo.

---

### Edge Cases

- Dos personas cambian la misma prenda a la vez: prevalece el último cambio y ambas ven el estado final tras recargar.
- Se pierde la conexión mientras se guarda: el panel avisa de que el cambio no se guardó y no muestra un estado falso.
- Se desactivan todas las prendas: la web pública sigue funcionando (portada y teléfono) sin galería rota.
- Se desactivan todas las fotos de una prenda visible: la prenda deja de mostrarse como si estuviera desactivada (no queda un hueco vacío ni un número sin foto).
- Se desactiva la foto que era la primera (la de la miniatura) de una prenda: la miniatura pasa a ser la primera foto activa.
- Se desactiva una foto mientras un visitante tiene abierto el visor: la foto deja de entregarse en cuanto caduque su copia guardada y el visor no muestra imágenes rotas ni un contador incoherente tras recargar.
- Se retira el acceso a la última persona autorizada: la titular nunca se queda fuera, porque gestiona el acceso desde su cuenta de Cloudflare y puede volver a darse permiso.
- Una prenda nueva, aún sin estado: se considera desactivada hasta que alguien la active (nunca se publica por defecto).
- El servicio que guarda los estados no responde: la web pública no muestra ninguna prenda desactivada (ver FR-005).
- Una página o imagen antigua guardada en una caché sigue mostrando una foto ya desactivada: debe caducar dentro del plazo de FR-004.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST ofrecer un panel accesible desde móvil y ordenador que muestre todas las prendas con su estado (visible u oculta) y permita cambiarlo.
- **FR-002**: El panel MUST permitir activar o desactivar una prenda completa (todas sus fotos a la vez) y, además, cada foto individual de una prenda. Una foto solo se ve si su prenda está visible y la foto está activa; desactivar la prenda oculta todas sus fotos sin perder el estado individual de cada una, que se recupera al volver a activar la prenda.
- **FR-003**: El acceso al panel y a toda operación de cambio MUST exigir identificación segura de la persona, comprobada en el servidor en cada operación; ninguna comprobación solo en el navegador es válida.
- **FR-004**: Un cambio de estado MUST reflejarse en la web pública en menos de 1 minuto (diseño: ≈ 40 s como máximo), sin publicar de nuevo la web ni ejecutar herramientas locales.
- **FR-005**: Una prenda o foto desactivada MUST ser inaccesible para cualquier visitante: ni en la galería, ni en los datos que recibe la web, ni por la dirección directa de sus imágenes. Ante cualquier fallo o duda sobre el estado, MUST tratarse como desactivada.
- **FR-006**: El sistema MUST NOT usar contraseñas propias: la identificación se delega en un mecanismo de acceso seguro con comprobación en dos pasos o equivalente, y las claves no se guardan en el código ni en el repositorio.
- **FR-007**: La titular MUST poder autorizar y retirar el acceso de otras personas sin compartir credenciales, desde el gestor de acceso de Cloudflare (no desde el propio panel, para que la web no tenga permisos sobre sus propios accesos); la retirada MUST surtir efecto en menos de 5 minutos, incluso con una sesión abierta.
- **FR-008**: La titular MUST conservar siempre la capacidad de entrar y de dar acceso (es la propietaria de la cuenta que gestiona el acceso); ninguna acción del panel puede dejar a la web sin forma de administrarse.
- **FR-009**: Una prenda sin estado registrado MUST considerarse desactivada.
- **FR-010**: Cada cambio de estado MUST registrar la persona y el momento, y el panel MUST mostrar la última modificación de cada prenda.
- **FR-011**: El panel MUST protegerse frente a peticiones falsificadas, limitar la frecuencia de operaciones y validar todos los datos recibidos.
- **FR-012**: El panel MUST NOT aparecer en la web pública (enlaces, textos, metadatos), en el mapa del sitio ni en buscadores.
- **FR-013**: La web pública MUST seguir mostrando solo logo, fotos, número de prenda, teléfono y enlace «Aviso legal» (constitución I), sin recursos de terceros ni cookies, y manteniendo los objetivos de rendimiento actuales.
- **FR-014**: El panel MUST cumplir contraste WCAG AA, funcionar con teclado y respetar la reducción de movimiento, como el resto del proyecto.
- **FR-015**: Las fotos nuevas y la edición de descripciones MUST seguir haciéndose con el flujo local actual; el panel online solo cambia el estado visible u oculto. Una prenda nueva MUST quedar oculta tras publicarla hasta que alguien la active en el panel.
- **FR-016**: Las imágenes estáticas derivadas de prendas (el fondo del bloque de contacto y la vista previa al compartir la web) MUST seguir eligiéndose en local (`PORTADA`) y NO dependen del panel online: ocultar una prenda en el panel no las retira de ellas. El panel MUST marcar las prendas que se usan en esas imágenes y avisar antes de ocultarlas. Es una excepción explícita de FR-005.

### Key Entities

- **Prenda**: elemento de la galería con su número, descripción y fotos; tiene un estado de visibilidad (visible u oculta).
- **Foto**: imagen de una prenda; tiene su propio estado de visibilidad, independiente del de la prenda.
- **Estado de visibilidad**: valor visible/oculta de una prenda o de una foto, con la persona y el momento de su última modificación. Una foto se ve solo si su prenda y ella misma están visibles.
- **Persona autorizada**: quien puede entrar al panel y cambiar estados; se identifica por su correo y la titular puede añadirla o retirarla.
- **Registro de cambios**: historial de quién cambió qué y cuándo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Una persona autorizada completa «entrar, desactivar una prenda y comprobarlo en la web» en menos de 2 minutos desde un móvil.
- **SC-002**: El 100 % de los cambios de estado se refleja en la web pública en menos de 1 minuto.
- **SC-003**: 0 imágenes, datos o números de prendas desactivadas accesibles para un visitante, incluida la dirección directa, en las pruebas de ocultación.
- **SC-004**: El 100 % de los intentos de acceso o de cambio sin identificación válida es rechazado y no modifica ningún estado.
- **SC-005**: Retirar el acceso a una persona surte efecto en menos de 5 minutos.
- **SC-006**: La web pública mantiene Lighthouse móvil ≥ 95 en rendimiento, < 1 MB en la primera pantalla y 0 peticiones a terceros.
- **SC-007**: El panel es utilizable de 360 px a 1920 px de ancho sin desplazamiento horizontal.

## Assumptions

- Hay una titular y como máximo unas pocas personas más autorizadas (menos de 10).
- La identificación se hace por correo electrónico con un servicio de acceso seguro ya existente, sin crear ni guardar contraseñas propias.
- El estado de las prendas se guarda fuera de la web publicada y se sirve de forma que se pueda cambiar sin volver a publicar.
- Las imágenes optimizadas de todas las prendas están disponibles en el servidor para poder activarlas al instante, y solo se entregan si la prenda está visible.
- Subir fotos nuevas, cambiar descripciones o el teléfono sigue haciéndose en local (FR-015); queda fuera de esta funcionalidad.
- El panel local actual (`admin.html`) se conserva para esas tareas; su casilla «Oculta» y el estado online deberán convivir sin contradecirse (a decidir en el plan).
- Esta funcionalidad contradice dos reglas vigentes de la constitución (el panel `admin.*` no se publica; la web no tiene servidor propio), por lo que el plan deberá proponer su enmienda con `/speckit-constitution` antes de implementar.
- La web sigue desplegándose en Cloudflare; esto es una restricción de contexto, no se decide aquí la tecnología concreta.
