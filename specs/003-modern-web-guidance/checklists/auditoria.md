# Auditoría previa a la entrega: Modern Web Guidance (003)

**Fecha**: 2026-11-16 | **Rama**: `003-modern-web-guidance` | **Alcance**: flujo y documentación; la web no cambia.

## Convergencia spec ↔ plan ↔ tareas ↔ archivos

| Requisito | Cumplido en |
|---|---|
| FR-001 fases de consulta | `AGENTS.md` §3 (3 roles), tabla §5 (filas 3, 6, 7, 8) y subsección "Guía de plataforma web moderna" |
| FR-002 guías en `research.md` | `AGENTS.md` fila 3 y subsección |
| FR-003 `legacy-scan` en la auditoría | `AGENTS.md` fila 7 y subsección (ignora `_backup-original/` y `specs/`) |
| FR-004 la constitución prevalece | `constitution.md` v1.1.0 y `AGENTS.md` |
| FR-005 nada experimental | sin `.mwgrc` (comprobado) y regla en `AGENTS.md` |
| FR-006 telemetría desactivada | `.claude/settings.json` → `DISABLE_TELEMETRY=1` |
| FR-007 consultas genéricas | `constitution.md`, `AGENTS.md`, `MEMORY.md` §6 |
| FR-008 disponible al abrir el proyecto | `.claude/settings.json` (marketplace + plugin) |
| FR-009 sin interferir | trabajo en worktree; la carpeta principal siguió en su rama sin cambios; sin `/plugin` ni `install` |
| FR-010 `MEMORY.md` | ADR, mapa, §6 |
| FR-011 sin tocar la web | `git diff --name-only main...HEAD`: solo `AGENTS.md`, `MEMORY.md`, constitución, `.claude/settings.json` y `specs/003-*` |

Medidas: consulta de ejemplo (`retrieve`) 2,5 s (SC-002, < 30 s); `legacy-scan` reproduce los 8
hallazgos de la línea base (SC-001/§D7); 0 menciones del proyecto en las consultas (SC-004).

## Seguridad (@Agent-SecOps)

- [x] Sin secretos ni claves; la herramienta no los necesita.
- [x] Telemetría de Google desactivada en el proyecto; consultas sin datos del proyecto.
- [x] Nada añadido a `package.json` ni a la web publicada (CSP y 0 terceros intactos).
- [ ] **Riesgo aceptado (decisión del usuario pendiente de confirmar):** `npx modern-web-guidance@latest`
  ejecuta en cada uso el último paquete publicado en npm (sin versión fijada). Mitigaciones: paquete
  de Google Chrome sin dependencias propias (según su README) y licencia Apache-2.0. Alternativa
  más estricta: fijar la versión (`modern-web-guidance@1.0.1`) y actualizarla a mano.
- [x] Al abrir el proyecto, Claude Code pide confiar en el marketplace `googlechrome` antes de
  habilitar el plugin.

## Rendimiento y SEO

No aplican: no cambia ningún archivo publicado.

## Pendiente de comprobar fuera de esta rama

- El formato de `extraKnownMarketplaces` / `enabledPlugins` solo se puede probar abriendo una
  sesión nueva en el proyecto (no se hizo para no tocar la sesión abierta). Si no se aplicase, el
  CLI por `npx` sigue funcionando y la regla no depende del plugin.
