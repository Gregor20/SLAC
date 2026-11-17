# Implementation Plan: Limpieza del repositorio

**Branch**: `014-limpieza-repositorio` | **Date**: 2026-11-17 | **Spec**: [spec.md](spec.md)

## Resumen

Cambio solo de borrado y de referencias: sin código nuevo ni dependencias nuevas. Responsable: `@Agent-Architect`.

## Contexto técnico

HTML + CSS + JS sin build; Node ≥ 18.17 para herramientas. Knip se ejecuta por `npx` (no se añade a `package.json`).
Puerta de calidad: `npm run verificar` y `npm run publicar` (el proyecto no tiene `typecheck`/`test`).

## Constitution Check

- I–V (contenido, datos, seguridad, SEO): no cambian; no se toca nada publicado.
- VI (sin framework ni build): sin cambios.
- Sin datos reales nuevos en archivos versionados.

## Veredictos de los hallazgos (FR-001)

| Hallazgo | Veredicto | Motivo |
|---|---|---|
| `admin.js`, `app.js`, `lib.js`, `visor.js`, `data/galeria.js`, `data/fotos-optimizadas.js` | Conservar | Falsos positivos: los cargan `index.html` y `admin.html` con `<script src>`. |
| `_backup-original/` (6 archivos) | Borrar | Web anterior; sin referencias salvo el bloqueo del servidor local y una nota de `AGENTS.md`; recuperable del primer commit (`ed6b316`). |
| `contact-sheet.html` | Borrar | Hoja de contactos suelta (19 oct); nada la referencia, ni se publica. |
| `.agents/` (vacía, no versionada) | Borrar | Carpeta de agente vacía (`skills/landing-page-design` sin archivos). |
| `.wrangler/` (vacía, no versionada) | Borrar | Temporal vacío de wrangler; se regenera si hace falta. |
| `revision-por-modelo.html` | Conservar | Generada por `optimizar-imagenes.js` y documentada en `COMO-ACTUALIZAR-FOTOS.md`. |
| Exportaciones sin uso en `scripts/datos.js` e `imagenes-extra.js` | Recortar | Solo `module.exports`; sin cambio de comportamiento. |
| `.specify/` (variantes bash/python), `.claude/skills/`, `specs/` | Conservar | Flujo Spec Kit; las gestiona `specify integration upgrade`. |
| `dist/`, `node_modules/` | Conservar | Ignorados por git y necesarios (`dist` se regenera). |

## Estructura de cambios

- Borrar: `_backup-original/`, `contact-sheet.html`, `.agents/`, `.wrangler/`.
- Editar: `scripts/servidor.js` (quitar `_backup-original` en las dos listas), `AGENTS.md` §5 (legacy-scan ya no ignora `_backup-original/`), `scripts/datos.js` e `scripts/imagenes-extra.js` (exports), `MEMORY.md` (ADR 014).

## Guía web moderna

Sin función de plataforma web nueva: sin guía.
