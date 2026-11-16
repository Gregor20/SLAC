# Implementation Plan: Modern Web Guidance en el flujo de desarrollo

**Branch**: `003-modern-web-guidance` | **Date**: 2026-11-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-modern-web-guidance/spec.md`

## Summary

Se integra la herramienta Modern Web Guidance de Google Chrome en el ciclo Spec Kit como
consulta obligatoria de guías de plataforma web moderna, sin tocar la web publicada:

1. **Regla de uso en `AGENTS.md`**: nueva sección con cuándo y cómo consultar (plan → registrar en
   `research.md`; implementación → consultar antes de escribir; auditoría → `legacy-scan` guardado
   en `checklists/`), con consultas genéricas en inglés sin datos del proyecto.
2. **Configuración compartida `.claude/settings.json`**: telemetría desactivada y plugin
   habilitado desde el marketplace oficial de Google Chrome para quien abra el proyecto.
3. **Constitución 1.1.0**: la guía es orientativa; los principios I-VI prevalecen.
4. **`MEMORY.md`**: ADR, mapa, cómo actualizar y regla de privacidad.
5. **Sin interferir**: todo el trabajo se hace en un worktree (`../slac-mwg`); no se ejecuta
   ningún `/plugin` ni instalación a nivel de usuario; no se crea `.mwgrc`.

## Technical Context

**Language/Version**: Markdown y JSON (sin código de la web). CLI: `modern-web-guidance` 1.0.1 vía
`npx`, Node.js ≥ 18.17 (ya requerido por el proyecto; local: 24.20).

**Primary Dependencies**: ninguna añadida a `package.json`. Herramienta externa de desarrollo:
`modern-web-guidance` (Apache-2.0, guías CC-BY 4.0, sin dependencias propias, sin claves).

**Storage**: archivos del repositorio (`AGENTS.md`, `MEMORY.md`, constitución, `.claude/settings.json`).

**Testing**: comprobación manual de la quickstart (JSON válido, consulta de ejemplo, `legacy-scan`,
diff limitado a archivos de documentación/configuración) y `npm run verificar` sin cambios.

**Target Platform**: Claude Code (CLI/escritorio/IDE) en Windows; la configuración es multiplataforma.

**Project Type**: flujo de trabajo y documentación de un proyecto web estático.

**Performance Goals**: consulta de ejemplo < 30 s (SC-002); colaborador nuevo listo en < 2 min (SC-005).

**Constraints**: 0 cambios en la web publicada (FR-011); 0 cambios en la sesión abierta en la rama
002 (FR-009); telemetría desactivada (FR-006); `.mwgrc` ausente (FR-005).

**Scale/Scope**: 4 archivos tocados (`AGENTS.md`, `MEMORY.md`, constitución, `.claude/settings.json`)
más los artefactos de `specs/003-modern-web-guidance/`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Evaluación |
|---|---|
| I. Solo fotos y teléfono | OK: no cambia contenido visible ni oculto de la web. Las consultas al CLI no incluyen datos del proyecto. |
| II. Las fotos son las protagonistas | OK: sin cambios de interfaz. |
| III. Rendimiento | OK: no se carga nada en la web. |
| IV. Seguridad y privacidad | OK con control: la herramienta es de desarrollo, no se publica y no añade recursos a la web. Su telemetría (consultas, ids, agente) se desactiva en `.claude/settings.json`; las consultas son genéricas. Sin secretos. |
| V. Semántica y SEO neutro | OK: sin cambios. |
| VI. Simplicidad | OK: sin framework ni build; nada en `package.json` (se usa `npx`); documentación breve. |
| Flujo y puertas | OK: rama propia `003-...` creada desde `main`; se actualiza `MEMORY.md` al cerrar. Enmienda MINOR de la constitución (1.0.0 → 1.1.0) con `/speckit-constitution`. |

Sin violaciones. Complexity Tracking no aplica. Re-evaluación tras el diseño: sin cambios.

## Project Structure

### Documentation (this feature)

```text
specs/003-modern-web-guidance/
├── plan.md
├── research.md       # decisiones, verificación del CLI y línea base de legacy-scan
├── quickstart.md     # validación de extremo a extremo
├── checklists/requirements.md
└── tasks.md          # /speckit-tasks
```

`data-model.md` y `contracts/` no aplican: no hay datos ni interfaces externas.

### Source Code (repository root)

```text
.claude/settings.json            # NUEVO: env DISABLE_TELEMETRY, marketplace googlechrome, plugin habilitado
AGENTS.md                        # §3 roles (Architect, UI-UX, Performance), §5 tabla y nueva regla
MEMORY.md                        # §3 mapa, §4 ADR, §6 regla
.specify/memory/constitution.md  # flujo y puertas + versión 1.1.0
```

**Structure Decision**: configuración compartida en `.claude/settings.json` (versionada; el
`settings.local.json` ya está ignorado), sin tocar `package.json` ni la web.

## Complexity Tracking

Sin violaciones que justificar.
