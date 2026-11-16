# Feature Specification: Optimización de fotos

**Feature Branch**: `002-optimizacion-fotos`

**Created**: 2026-11-16

**Status**: Draft

**Input**: User description: "Optimiza también las fotos." (petición del usuario). Medición de partida
(001, móvil 390×844 a 3×): 685 KB en la primera carga, de ellos ~600 KB de fotos y 53 KB de logo.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Las fotos llegan antes al móvil (Priority: P1)

Quien abre la web con datos móviles ve la portada y la galería antes y gasta menos datos, sin notar
pérdida de calidad en las prendas (tejidos, encajes, colores).

**Why this priority**: la web es casi solo fotos; su peso decide la velocidad.

**Independent Test**: medir los datos descargados en la primera carga en móvil antes y después, y
comparar a ojo recortes con detalle (encaje) en ambas versiones.

**Acceptance Scenarios**:

1. **Given** un navegador actual, **When** carga la web, **Then** recibe las fotos en el formato más
   ligero que admite, con el mismo encuadre y sin pérdida de calidad apreciable.
2. **Given** un navegador que no admite ese formato, **When** carga la web, **Then** recibe las fotos
   en el formato actual y todo se ve igual.
3. **Given** el visor abierto, **When** se pasa de foto, **Then** también usa el formato más ligero.

---

### User Story 2 - Imagen para compartir el enlace (Priority: P2)

Quien comparte el enlace por WhatsApp o redes ve una vista previa cuidada, hecha con fotos propias y
el logo, sin texto.

**Why this priority**: mejora la primera impresión, pero solo funciona cuando haya dominio.

**Independent Test**: abrir la imagen generada y comprobar medidas, peso y contenido.

**Acceptance Scenarios**:

1. **Given** las fotos de la portada, **When** se optimizan, **Then** existe una imagen de 1200×630
   con esas fotos y el logo, de menos de 300 KB, sin texto.

### Edge Cases

- Foto original muy estrecha o más pequeña que el tamaño pedido: no se amplía.
- Fotos optimizadas antiguas (solo en el formato anterior): la comprobación automática pide regenerarlas.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Toda foto de galería, portada, contacto y visor MUST ofrecerse en un formato moderno más
  ligero con respaldo automático en el formato actual.
- **FR-002**: La calidad visual MUST mantenerse: sin artefactos apreciables en tejidos y encajes al
  tamaño en que se muestran.
- **FR-003**: El logo MUST pesar como máximo 30 KB en su versión mayor, sin bordes visibles sobre las fotos.
- **FR-004**: MUST generarse una imagen para compartir de 1200×630 (< 300 KB) con fotos propias y el
  logo, sin texto; se enlaza en la página cuando exista dominio.
- **FR-005**: La comprobación automática MUST fallar si falta alguna versión de alguna foto.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: los datos de fotos e imágenes descargados en la primera carga en móvil (390×844, 3×)
  bajan al menos un 30 % respecto a la medición de partida.
- **SC-002**: rendimiento móvil de Lighthouse ≥ 95 en la prueba local.
- **SC-003**: en recortes con detalle (encaje) no hay diferencias apreciables a simple vista.
- **SC-004**: 0 errores en la comprobación automática.

## Assumptions

- El formato concreto y la calidad se deciden en el plan con mediciones propias.
- La etiqueta que enlaza la imagen para compartir necesita una dirección absoluta: queda preparada y
  se activa con el dominio (funcionalidad 003 o posterior).
