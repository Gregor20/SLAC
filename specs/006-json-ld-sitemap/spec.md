# Feature Specification: Datos estructurados (JSON-LD) y sitemap preparados

**Feature Branch**: `006-json-ld-sitemap`

**Created**: 2026-11-16

**Status**: Draft

**Input**: User description: "Prepara el JSON-LD y el sitemap.xml."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Los buscadores entienden la página (Priority: P1)

Un buscador o un motor de IA que lee la página principal recibe, sin depender del texto visible, la
información de que es el sitio web "SLAC" y una galería de imágenes, en español, sin ninguna pista de
negocio ni de tienda.

**Why this priority**: es la parte que no necesita dominio y mejora cómo se interpreta la web desde el primer día.

**Independent Test**: extraer el bloque de datos estructurados de la página principal, comprobar que es JSON
válido, que declara solo un sitio web y una galería de imágenes, y que la página no cambia a la vista.

**Acceptance Scenarios**:

1. **Given** la página principal, **When** se lee su bloque de datos estructurados, **Then** es válido y describe un sitio web "SLAC" y una galería de imágenes, ambos en español.
2. **Given** ese bloque, **When** se revisan sus tipos, **Then** no aparece ningún tipo comercial (tienda, negocio local, producto, oferta).
3. **Given** la web abierta en el navegador, **When** se compara con la anterior, **Then** no hay ningún cambio visual ni de texto visible.

---

### User Story 2 - Con el dominio, todo queda listo con un solo comando (Priority: P1)

Cuando el usuario tenga dominio, quien mantiene la web lo indica una sola vez y se generan: el sitemap.xml
con la página principal, la línea de sitemap en robots.txt, la URL canónica y las etiquetas para compartir
(dirección e imagen) y las URLs absolutas en los datos estructurados.

**Why this priority**: es la otra mitad de lo pendiente y hoy exige editar varios archivos a mano sin equivocarse.

**Independent Test**: ejecutar el comando con un dominio de prueba y comprobar los cinco resultados; repetirlo con otro dominio y comprobar que se sustituye todo sin duplicar nada.

**Acceptance Scenarios**:

1. **Given** un dominio con https, **When** se ejecuta el comando, **Then** existe un sitemap.xml con solo la página principal (no el aviso legal, que es `noindex`).
2. **Given** ese dominio, **When** se mira robots.txt, **Then** contiene una única línea `Sitemap:` con la dirección completa.
3. **Given** ese dominio, **When** se mira la cabecera de la página principal, **Then** hay canonical, dirección y imagen para compartir (1200×630) y la tarjeta pasa a imagen grande.
4. **Given** ese dominio, **When** se leen los datos estructurados, **Then** incluyen la dirección y la imagen absolutas.
5. **Given** un valor que no es un dominio https (sin esquema, con ruta, vacío), **When** se ejecuta, **Then** se rechaza sin modificar nada.
6. **Given** que ya se ejecutó antes, **When** se ejecuta con otro dominio, **Then** todo se sustituye y no queda rastro del anterior ni líneas duplicadas.

---

### User Story 3 - La comprobación automática lo vigila (Priority: P2)

`npm run verificar` falla si los datos estructurados no son válidos o contienen tipos comerciales, y acepta
el dominio una vez configurado sin tratarlo como recurso de terceros.

**Independent Test**: romper el bloque o añadir un tipo comercial y comprobar el fallo; configurar un dominio y comprobar que `verificar` sigue en verde.

**Acceptance Scenarios**:

1. **Given** datos estructurados con JSON roto o un tipo distinto de sitio web/galería, **When** se verifica, **Then** falla con un mensaje claro.
2. **Given** un dominio configurado, **When** se verifica, **Then** pasa, y falla si el sitemap no existe o no coincide con la canonical.

### Edge Cases

- Antes de tener dominio no existe sitemap.xml (con direcciones inventadas sería inválido) ni canonical.
- Dominio con barra final, mayúsculas o `http://`: se normaliza o se rechaza (http se rechaza).
- El aviso legal queda fuera del sitemap y sigue con `noindex`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La página principal MUST incluir datos estructurados válidos con un sitio web "SLAC" y una galería de imágenes, ambos en español.
- **FR-002**: Los datos estructurados MUST NOT usar tipos comerciales ni palabras de negocio (constitución I y V).
- **FR-003**: Los datos estructurados MUST NOT cambiar el aspecto ni el texto visible de la página.
- **FR-004**: Un único comando con el dominio (https) MUST generar sitemap.xml (solo la página principal), la línea `Sitemap:` en robots.txt, canonical, dirección e imagen para compartir y las direcciones absolutas de los datos estructurados.
- **FR-005**: El comando MUST validar el dominio (https, sin ruta) y no modificar nada si no es válido.
- **FR-006**: El comando MUST ser repetible: cada ejecución sustituye lo anterior sin duplicar líneas ni etiquetas.
- **FR-007**: La comprobación automática MUST validar el JSON, los tipos permitidos y, si hay dominio, la coherencia entre canonical, sitemap y robots.txt.
- **FR-008**: El dominio MUST aceptarse en la comprobación de recursos externos solo cuando coincide con la canonical.
- **FR-009**: Sin dominio, la web publicada MUST NOT contener direcciones inventadas ni marcadores a medio rellenar.

### Key Entities

- **Datos estructurados**: descripción del sitio (sitio web + galería de imágenes), con dirección e imagen cuando hay dominio.
- **Dominio**: dirección base con https de la web publicada; origen único de todas las direcciones absolutas.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Los datos estructurados pasan una validación de JSON y contienen únicamente los tipos permitidos (0 tipos comerciales).
- **SC-002**: Poner dominio requiere 1 comando y produce los 5 resultados de FR-004 sin editar archivos a mano.
- **SC-003**: Repetir el comando 2 veces con dominios distintos deja 1 línea `Sitemap:`, 1 canonical, 1 `og:url` y 1 `og:image`.
- **SC-004**: Sin cambio visual y rendimiento intacto (Lighthouse móvil ≥ 95, CLS 0, SEO 100).
- **SC-005**: `npm run verificar` pasa antes y después de configurar un dominio.

## Assumptions

- Aún no hay dominio: se entrega todo listo, pero **sin** sitemap.xml ni canonical hasta ejecutar el comando.
- El comando se pasa por línea de comandos (`npm run dominio -- https://ejemplo.com`).
- Solo se indexa la página principal; el aviso legal sigue `noindex`.
- La imagen para compartir es la ya generada `public/img/og-cover.jpg` (1200×630, sin texto ni número).
- Los datos estructurados no incluyen cada prenda ni teléfono, para no sugerir negocio (constitución I).
