# Implementation Plan: Datos reales del titular y del contacto

**Branch**: `005-datos-reales-contacto` | **Date**: 2026-11-16 | **Spec**: [spec.md](./spec.md)

## Summary

Cambio de datos y texto, sin lógica nueva:

1. `data/galeria.js` (`CONTACTO`): `telefono "+34 000 000 000"`, `telefonoRaw "+34000000000"`, `whatsapp "34000000000"`; se quita el comentario `PENDIENTE: número real`.
2. `aviso-legal.html` (sección 1): titular "SLAC", fila NIF eliminada, nueva fila "Instagram" con `[INSTAGRAM]` como texto; domicilio y correo siguen con `[COMPLETAR]`.
3. `scripts/verificar.js`: se elimina `TELEFONO_PROVISIONAL` y su aviso; el formato del teléfono ya se valida.
4. `COMO-ACTUALIZAR-FOTOS.md` y `MEMORY.md`: sin rastro del provisional; MEMORY recoge los datos reales y lo que sigue pendiente.

## Technical Context

**Language/Version**: HTML5 + JavaScript ES2020+ sin build; Node.js ≥ 18.17 (herramientas)

**Primary Dependencies**: ninguna

**Storage**: `data/galeria.js` (fuente única del teléfono, constitución VI)

**Testing**: `npm run verificar`; revisión en navegador a 390 y 1440 px; búsqueda del provisional con `grep`

**Project Type**: web estática informativa

**Performance Goals**: sin cambio (Lighthouse móvil ≥ 95, CLS 0)

**Constraints**: constitución v1.2.0; sin enlaces a terceros nuevos; sin texto nuevo en la página principal

## Constitution Check (v1.2.0)

| Principio | Estado | Nota |
|---|---|---|
| I Solo fotos y teléfono | ✅ | El Instagram va solo en `aviso-legal.html` (información legal), como texto; la principal no cambia. |
| II Fotos protagonistas | ✅ | Sin cambios visuales. |
| III Rendimiento | ✅ | Sin cambios de carga. |
| IV Seguridad | ✅ | Sin enlaces nuevos: Instagram como texto; solo `tel:` y `wa.me`. |
| V SEO neutro | ✅ | Sin cambios en metadatos; `aviso-legal.html` sigue `noindex`. |
| VI Simplicidad | ✅ | El teléfono sigue en un único lugar (`CONTACTO`). |

**Complexity Tracking**: sin violaciones.

## Modern Web Guidance

Sin funciones de plataforma nuevas (solo datos y texto): sin guía aplicable.

## Project Structure

```text
data/galeria.js · aviso-legal.html · scripts/verificar.js · COMO-ACTUALIZAR-FOTOS.md · MEMORY.md
specs/005-datos-reales-contacto/{spec.md, plan.md, tasks.md, checklists/}
```
