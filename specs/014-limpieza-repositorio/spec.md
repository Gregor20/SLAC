# Feature Specification: Limpieza del repositorio

**Feature Branch**: `014-limpieza-repositorio`

**Created**: 2026-11-17

**Status**: Implemented

**Input**: User description: "Analizar con knip qué archivos y dependencias no hacen falta para que la web funcione y se pueda publicar, borrar los que sobren tras comprobarlo, y purgar los artefactos de IA innecesarios. La web, el panel local, los .bat y las puertas de calidad deben seguir funcionando igual."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Quitar los archivos que sobran (Priority: P1)

La persona que mantiene el proyecto quiere una carpeta sin restos: que cada archivo tenga un motivo
para estar (la web, el panel local, las herramientas, la documentación o el flujo de trabajo). Se
analiza el proyecto con la herramienta de código no usado (knip), se comprueba a mano cada hallazgo
(la herramienta no entiende los scripts que cargan las páginas HTML) y solo se borra lo que de
verdad no usa nada.

**Why this priority**: es el núcleo de la petición; menos archivos, menos confusión y un repositorio más limpio para publicar.

**Independent Test**: tras borrar, la web, el panel local y la publicación funcionan igual y no queda ninguna referencia a lo borrado.

**Acceptance Scenarios**:

1. **Given** el informe de la herramienta, **When** se revisa cada archivo marcado como no usado, **Then** los que cargan las páginas HTML se conservan y solo se borran los que nada referencia.
2. **Given** los archivos borrados, **When** se buscan sus nombres en el proyecto, **Then** no queda ninguna referencia viva (código, scripts, documentación de uso ni configuración).
3. **Given** la limpieza hecha, **When** se ejecuta la puerta de calidad y se genera la carpeta publicable, **Then** ambas terminan sin errores y con el mismo contenido publicable que antes.

---

### User Story 2 - Purgar los artefactos de IA innecesarios (Priority: P2)

El proyecto acumula restos de herramientas de IA: carpetas vacías de agentes, directorios temporales
y copias que ninguna herramienta usa. Se eliminan los que no aportan nada, sin tocar lo que el
flujo de trabajo del proyecto necesita (Spec Kit, la constitución, las skills del ciclo, la
configuración compartida y la memoria del proyecto).

**Why this priority**: son restos que no afectan a la web pero ensucian el proyecto y confunden a futuras sesiones de agentes.

**Independent Test**: el ciclo Spec Kit sigue funcionando (los comandos del ciclo siguen disponibles) y no quedan carpetas de agentes vacías o sin uso.

**Acceptance Scenarios**:

1. **Given** las carpetas de agentes y temporales del proyecto, **When** se revisa su contenido, **Then** se borran las vacías o sin uso y se conservan las que usa el flujo de trabajo.
2. **Given** la limpieza hecha, **When** se lanza un comando del ciclo, **Then** sigue funcionando.

---

### User Story 3 - Documentación coherente (Priority: P3)

Las guías que mencionaban lo borrado se actualizan para que no apunten a nada que ya no existe, y
la memoria del proyecto registra qué se eliminó y por qué.

**Why this priority**: evita referencias rotas y deja constancia para no volver a crear lo mismo.

**Independent Test**: ninguna guía de uso menciona un archivo inexistente.

**Acceptance Scenarios**:

1. **Given** un archivo borrado que se mencionaba en una guía, **When** se termina la limpieza, **Then** la guía ya no lo menciona.

### Edge Cases

- Archivos que la herramienta marca como no usados pero cargan las páginas HTML: se conservan (falsos positivos).
- Archivos generados por las herramientas del proyecto (p. ej. la página de revisión de fotos): se conservan mientras una herramienta o guía los use.
- Historial de funcionalidades (`specs/`) y archivos de Spec Kit: son parte del flujo de trabajo; no se borran.
- Archivos solo locales y no versionados: se comprueba su contenido antes de borrarlos.
- Lo borrado sigue recuperable desde el historial del repositorio.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Se MUST ejecutar la herramienta de análisis de código no usado y revisar manualmente cada hallazgo antes de actuar.
- **FR-002**: Se MUST borrar únicamente los archivos o carpetas que ningún elemento de la web, el panel local, las herramientas, los `.bat` o la documentación de uso referencia.
- **FR-003**: Se MUST conservar todo archivo que cargan las páginas HTML, aunque la herramienta lo marque como no usado.
- **FR-004**: Se MUST eliminar los artefactos de IA que estén vacíos o sin uso (carpetas de agentes, temporales) y conservar los que necesita el flujo Spec Kit, la constitución, la configuración compartida y la memoria.
- **FR-005**: Se MUST eliminar las referencias a lo borrado en código de herramientas y guías, y registrar la limpieza en la memoria del proyecto.
- **FR-006**: Las exportaciones no usadas de las herramientas SHOULD recortarse si no cambian su comportamiento.
- **FR-007**: Tras la limpieza, la puerta de calidad MUST pasar y la carpeta publicable MUST ser idéntica en contenido a la anterior.
- **FR-008**: Los datos reales (teléfono, correo, domicilio, Instagram) NO MUST aparecer en ningún archivo versionado.

### Key Entities

- **Hallazgo**: archivo o dependencia que la herramienta marca como no usada; tiene un veredicto (borrar / conservar) con su motivo.
- **Artefacto de IA**: carpeta o archivo creado por una herramienta de agentes que no forma parte de la web ni del flujo de trabajo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100 % de los hallazgos tiene veredicto y motivo documentados.
- **SC-002**: 0 referencias a archivos inexistentes en código, scripts y guías de uso.
- **SC-003**: La puerta de calidad pasa con el mismo resultado que antes de la limpieza.
- **SC-004**: La carpeta publicable contiene exactamente los mismos archivos que antes.
- **SC-005**: El informe de la herramienta sobre lo que queda solo muestra falsos positivos justificados.

## Assumptions

- La copia de la web anterior (`_backup-original/`) y la hoja de contactos suelta (`contact-sheet.html`) no se usan: están en el historial de git y ninguna herramienta o guía de uso las referencia (solo las nombran el bloqueo del servidor local y una nota de `AGENTS.md`).
- La página de revisión de fotos la genera y la documenta el proyecto: se conserva.
- Las dependencias de desarrollo no se tocan: el análisis no encontró ninguna sin usar.
- Las variantes `bash` y `python` de los scripts de Spec Kit las gestiona su propia herramienta de actualización y no se editan a mano.
- La herramienta de análisis se usa por `npx`, sin añadirla a las dependencias del proyecto.
