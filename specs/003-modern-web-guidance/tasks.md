# Tasks: Modern Web Guidance en el flujo de desarrollo

**Input**: `specs/003-modern-web-guidance/` (spec.md, plan.md, research.md, quickstart.md)

**Prerequisites**: plan.md, spec.md. Sin tests automáticos (no se pidieron): la validación es la
`quickstart.md`.

**Entorno**: todo se hace en el worktree `../slac-mwg`
(rama `003-modern-web-guidance`). NO se toca la carpeta `slac` (rama 002 de otra sesión), NO se
ejecuta `/plugin` ni `npx modern-web-guidance install`, y NO se crea `.mwgrc`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: se puede hacer en paralelo (archivos distintos, sin dependencias)
- **[Story]**: historia de usuario de `spec.md`
- Las rutas son relativas a la raíz del worktree

---

## Phase 1: Setup

- [X] T001 Comprobar que `git branch --show-current` en el worktree es `003-modern-web-guidance` y que `git -C ../slac branch --show-current` sigue siendo la que tenía (al empezar T001 ya era `004-numero-en-foto`, tras fusionar 002 en `main`); anotar el estado (`git -C ../slac status --short`) para compararlo al final (SC-003)

---

## Phase 2: Foundational (bloquea las historias)

**Propósito**: reglas superiores que el resto de la documentación referencia.

- [X] T002 Enmendar `.specify/memory/constitution.md` a la versión 1.1.0 (MINOR) con `/speckit-constitution`: en "Flujo de trabajo y puertas de calidad" añadir que, al planificar e implementar funciones de la plataforma web, se consulta Modern Web Guidance; que la guía es orientativa y los principios I-VI prevalecen (sin terceros, sin build, sin funciones experimentales); que las consultas son genéricas y sin datos del proyecto (FR-004, FR-007). Actualizar `Last Amended` a 2026-11-16
- [X] T003 Crear `.claude/settings.json` con `env.DISABLE_TELEMETRY = "1"`, `extraKnownMarketplaces.googlechrome` (`source: github`, `repo: GoogleChrome/modern-web-guidance`) y `enabledPlugins["modern-web-guidance@googlechrome"] = true`; validar que el JSON parsea y que `.claude/settings.local.json` sigue ignorado (FR-005, FR-006, FR-008, FR-009)

**Checkpoint**: constitución y configuración listas.

---

## Phase 3: User Story 1 - Consulta de la guía antes de escribir código (Priority: P1) 🎯 MVP

**Goal**: los agentes saben cuándo y cómo consultar la guía.

**Independent Test**: leer `AGENTS.md` y comprobar que plan e implementación indican la consulta; la consulta de ejemplo de `quickstart.md` §2 devuelve una guía.

- [X] T004 [US1] En `AGENTS.md` §5 añadir la subsección "Guía de plataforma web moderna (Modern Web Guidance)": comandos `npx modern-web-guidance@latest search "<consulta en inglés>"` y `retrieve <id>`, cuándo consultar (funciones de HTML, CSS, JS, formularios, accesibilidad, rendimiento), qué hacer si no hay guía o no hay red (continuar y anotarlo) y que la constitución prevalece (FR-001, FR-004)
- [X] T005 [US1] En `AGENTS.md` fila 3 de la tabla del ciclo (`/speckit-plan`): registrar en `research.md` las guías aplicadas (id) o "sin guía"; fila 6 (`/speckit-implement`): consultar antes de escribir código de plataforma (FR-001, FR-002)
- [X] T006 [US1] En `AGENTS.md` §3 añadir una línea en `@Agent-Architect`, `@Agent-UI-UX` y `@Agent-Performance` indicando su uso de la guía en su fase
- [X] T007 [US1] Ejecutar la consulta de ejemplo de `quickstart.md` §2 (`search` y `retrieve`) con `DISABLE_TELEMETRY=1` y comprobar que devuelve una guía en < 30 s (SC-002)

**Checkpoint**: US1 funcional y comprobable.

---

## Phase 4: User Story 3 - Adopción sin interferir y sin filtrar datos (Priority: P1)

**Goal**: privacidad y no interferencia documentadas y verificadas.

**Independent Test**: la rama 002 y su árbol de trabajo no cambian; `AGENTS.md` y `MEMORY.md` recogen la regla de privacidad.

- [X] T008 [US3] En `AGENTS.md` (misma subsección de T004) añadir la regla de privacidad: consultas genéricas en inglés (solo la función de plataforma), sin nombres del proyecto, teléfonos, rutas ni datos; telemetría desactivada por `.claude/settings.json`; sin `.mwgrc` (no se usan funciones experimentales) (FR-005, FR-006, FR-007)
- [X] T009 [US3] En `AGENTS.md` añadir cómo adoptarla sin molestar a otras sesiones: no ejecutar `/plugin` ni `install` en una sesión con otras abiertas; la configuración del proyecto se aplica al abrir o reiniciar la sesión; actualización con `/plugin` (marketplace `googlechrome`, actualización automática) o `npx modern-web-guidance@latest update` (FR-009)
- [X] T010 [US3] Comparar `git -C ../slac branch --show-current` y `git -C ../slac status --short` con lo anotado en T001: 0 diferencias (SC-003)

**Checkpoint**: US3 verificada.

---

## Phase 5: User Story 2 - Auditoría de patrones obsoletos (Priority: P2)

**Goal**: `legacy-scan` forma parte de la auditoría previa a la entrega.

**Independent Test**: `legacy-scan` se ejecuta y su resultado queda descrito en la auditoría.

- [X] T011 [US2] En `AGENTS.md` fila 7 (`/speckit-checklist`): añadir `npx modern-web-guidance@latest legacy-scan . --json`, guardar el resumen en `checklists/`, ignorar `_backup-original/` y `specs/`, y corregir o justificar cada hallazgo; los hallazgos sin resolver pasan a `/speckit-converge` (FR-003)
- [X] T012 [US2] Ejecutar `legacy-scan . --json` en el worktree y comprobar que reproduce la línea base de `research.md` §D7 (SC-001)

**Checkpoint**: US2 funcional.

---

## Phase 6: Polish y cierre

- [X] T013 Actualizar `MEMORY.md`: §3 (mapa: `.claude/settings.json`; herramienta de desarrollo Modern Web Guidance; constitución v1.1.0), §4 (ADR 2026-11-16: decisiones D1-D6 y línea base D7 como deuda futura), §6 (regla: consultas genéricas y sin `/plugin` con sesiones abiertas) (FR-010)
- [X] T014 Ejecutar `quickstart.md` completo; `git diff --name-only main...HEAD` solo debe listar `AGENTS.md`, `MEMORY.md`, `.specify/memory/constitution.md`, `.claude/settings.json` y `specs/003-modern-web-guidance/**` (SC-006, FR-011)
- [X] T015 Revisar la coherencia de textos de `AGENTS.md` (sin duplicar entre T004-T011) y que ningún archivo publicado de la web cambió

---

## Dependencies & Execution Order

- T001 → Phase 2 → fases de historias. T002 y T003 son archivos distintos: [P] entre sí si se desea.
- T004-T006, T008-T009 y T011 editan `AGENTS.md`: van en secuencia (sin [P]).
- T007, T010 y T012 son verificaciones sin edición.
- T013 (MEMORY.md) y T014-T015 al final.

### Parallel Opportunities

- T002 y T003 en paralelo (constitución / `.claude/settings.json`).
- Tras ellas, T013 (MEMORY.md) puede prepararse en paralelo con las ediciones de `AGENTS.md`.

## Implementation Strategy

- **MVP**: Phases 1-3 (constitución, configuración y regla de consulta en `AGENTS.md`).
- Después: US3 (privacidad/no interferencia) y US2 (auditoría), y por último `MEMORY.md` y la validación.
- Tras `/speckit-implement`: `/speckit-checklist seguridad` y `rendimiento`, `/speckit-converge`, y
  fusión en `main` (`git merge --no-ff`) preguntando antes al usuario.
