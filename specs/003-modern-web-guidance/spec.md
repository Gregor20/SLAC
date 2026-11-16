# Feature Specification: Modern Web Guidance en el flujo de desarrollo

**Feature Branch**: `003-modern-web-guidance`

**Created**: 2026-11-16

**Status**: Draft

**Input**: User description: "Añadir al flujo de desarrollo la herramienta de Google Chrome Modern Web Guidance (https://github.com/GoogleChrome/modern-web-guidance) para modernizar el desarrollo y estar actualizados, sin molestar a otras sesiones de trabajo abiertas."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Los agentes consultan la guía antes de escribir código de plataforma web (Priority: P1)

Cuando un agente va a planificar o escribir HTML, CSS o JavaScript que toca una función de la
plataforma web (diálogos, animaciones, imágenes, formularios, accesibilidad…), consulta primero
la guía de Modern Web Guidance y usa el patrón moderno que esta recomienda en lugar del que
recuerda de memoria, que suele ser antiguo.

**Why this priority**: es el motivo de la integración. Sin una regla clara de cuándo consultar,
la herramienta existe pero nadie la usa.

**Independent Test**: leer `AGENTS.md` y comprobar que cada fase del ciclo indica si se consulta
la guía y cómo; lanzar una consulta de ejemplo y obtener una guía utilizable.

**Acceptance Scenarios**:

1. **Given** un plan (`/speckit-plan`) que incluye una función de plataforma web, **When** el
   agente redacta `research.md`, **Then** registra la consulta hecha y la guía aplicada (o que no
   hay guía para ese caso).
2. **Given** una tarea de implementación de interfaz, **When** el agente va a escribir el código,
   **Then** consulta la guía antes y sigue su patrón, siempre dentro de los principios de la
   constitución.
3. **Given** una consulta sin resultados útiles, **When** el agente la repite con otras palabras
   sin éxito, **Then** continúa con el criterio habitual y lo anota; la falta de guía nunca
   bloquea una tarea.

---

### User Story 2 - Auditoría de patrones obsoletos antes de cerrar (Priority: P2)

Antes de fusionar una funcionalidad, el código del proyecto se analiza en busca de patrones
heredados que tengan ya una alternativa nativa, y cada hallazgo se corrige o se justifica.

**Why this priority**: detecta lo que se escapó en la implementación y mantiene el código al día
con el tiempo, pero depende de que la consulta del P1 esté ya integrada.

**Independent Test**: ejecutar el análisis sobre el proyecto y comprobar que el resultado queda
registrado en la auditoría de la funcionalidad.

**Acceptance Scenarios**:

1. **Given** una funcionalidad implementada, **When** se hace la auditoría previa a la entrega,
   **Then** se ejecuta el análisis de patrones obsoletos y su resultado queda en `checklists/`.
2. **Given** un hallazgo que contradice la constitución (por ejemplo, propone una dependencia de
   terceros), **When** se revisa, **Then** prevalece la constitución y se anota la decisión.

---

### User Story 3 - Adopción sin interferir y sin filtrar datos (Priority: P1)

Quien trabaja en el proyecto puede activar la herramienta mientras otras sesiones siguen abiertas
sin que estas se alteren, y las consultas no revelan nada del proyecto.

**Why this priority**: es una condición del usuario: no molestar a la sesión en marcha, y la
privacidad del proyecto es innegociable.

**Independent Test**: con otra sesión abierta en otra rama, completar la integración sin que
cambie su rama ni sus archivos; revisar que la telemetría está desactivada para el proyecto.

**Acceptance Scenarios**:

1. **Given** otra sesión trabajando en otra rama, **When** se integra la herramienta, **Then** la
   rama y los archivos de esa sesión no cambian y no se le pide detenerse salvo que sea
   imprescindible (y entonces se avisa al usuario antes).
2. **Given** una consulta a la guía, **When** el agente la redacta, **Then** describe solo la
   función de plataforma buscada (por ejemplo, "animar un diálogo modal"), sin nombres del
   proyecto, números de teléfono, rutas privadas ni contenido de las fotos o los datos.
3. **Given** un colaborador nuevo que abre el proyecto, **When** empieza a trabajar, **Then** la
   herramienta queda disponible con la configuración del proyecto y con la recogida de datos
   anónimos de uso desactivada.

---

### Edge Cases

- La guía recomienda un recurso de terceros, un polyfill externo o una herramienta de
  compilación: la constitución (I-IV y VI) prevalece; se descarta o se adapta a una solución
  propia pequeña.
- La guía trata una función experimental (pruebas de origen o disponible en un solo motor): no se
  usa; la funcionalidad queda desactivada por defecto en el proyecto.
- No hay conexión o el servicio de paquetes no responde: el agente continúa sin la guía y lo
  anota; no se bloquea la tarea.
- Una consulta necesitaría incluir datos privados para tener sentido: se generaliza o se omite.
- La herramienta propone cambios en código que está en revisión en otra rama: la auditoría solo
  analiza la rama de trabajo actual.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El flujo de trabajo (`AGENTS.md`) MUST indicar en qué fases del ciclo se consulta
  la guía: planificación (`/speckit-plan`), implementación (`/speckit-implement`) y auditoría
  previa a la entrega.
- **FR-002**: Durante la planificación, las guías aplicadas MUST quedar registradas en
  `research.md` de la funcionalidad, con su identificador.
- **FR-003**: La auditoría previa a la entrega MUST incluir un análisis de patrones obsoletos y
  guardar su resultado en `checklists/`.
- **FR-004**: La constitución MUST establecer que la guía es orientativa y que sus principios
  prevalecen sobre cualquier recomendación de la herramienta.
- **FR-005**: Las funciones experimentales o de un solo motor MUST permanecer desactivadas por
  defecto en el proyecto.
- **FR-006**: La configuración del proyecto MUST desactivar la recogida de datos anónimos de uso
  de la herramienta.
- **FR-007**: Las consultas a la guía MUST ser genéricas: sin nombres del proyecto, números de
  teléfono, rutas ni contenido de datos o fotos.
- **FR-008**: La herramienta MUST quedar disponible para cualquier colaborador solo con abrir el
  proyecto, sin pasos manuales fuera de aceptar la configuración del proyecto.
- **FR-009**: La integración MUST poder hacerse sin cambiar la rama ni los archivos de otras
  sesiones abiertas, y sin instalar nada a nivel de usuario que las afecte.
- **FR-010**: `MEMORY.md` MUST registrar la decisión (ADR), cómo actualizar la herramienta y el
  estado de la integración.
- **FR-011**: La integración MUST NOT modificar el código, los datos ni el aspecto de la web
  publicada.

### Key Entities

- **Guía**: pauta de la plataforma web moderna con patrón recomendado, trampas conocidas y
  alternativa para navegadores antiguos; tiene un identificador y se encuentra por búsqueda.
- **Hallazgo de patrón obsoleto**: coincidencia del análisis con una alternativa moderna; se
  corrige o se justifica por escrito.
- **Configuración del proyecto**: ajustes compartidos del repositorio que activan la herramienta
  y desactivan la telemetría.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100 % de las fases del ciclo afectadas (plan, implementación, auditoría)
  indican cuándo y cómo consultar la guía.
- **SC-002**: Una consulta de ejemplo devuelve una guía utilizable en menos de 30 segundos.
- **SC-003**: Durante la integración, la rama y los archivos de la sesión que ya estaba abierta
  no cambian (0 diferencias en su estado).
- **SC-004**: 0 menciones de datos del proyecto en las consultas de ejemplo documentadas.
- **SC-005**: Un colaborador nuevo tiene la herramienta lista en menos de 2 minutos, sin
  recogida de datos de uso.
- **SC-006**: 0 cambios en los archivos de la web publicada (`index.html`, `styles.css`,
  `app.js`, `data/`, `public/`).

## Assumptions

- El proyecto se trabaja con Claude Code y con el ciclo Spec Kit de `AGENTS.md` §5.
- La herramienta funciona de forma local y sin claves; solo necesita red para descargarse.
- La configuración compartida se versiona en el repositorio; las preferencias personales
  (instalación a nivel de usuario, actualización automática) son opcionales y de cada persona.
- Es un cambio de flujo de trabajo y documentación: no hay interfaz de la web ni SEO afectados.
- Se fusiona en `main` desde su propia rama; si la otra sesión actualiza `MEMORY.md` al cerrar su
  funcionalidad, las dos ediciones se concilian en la fusión.
