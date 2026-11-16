# Tasks: Datos reales del titular y del contacto

**Input**: `specs/005-datos-reales-contacto/` (spec.md, plan.md). Sin tests automáticos nuevos: validación con `npm run verificar` y revisión en navegador.

## Phase 1: User Story 1 — Teléfono real (P1) 🎯 MVP

- [X] T001 [US1] En `data/galeria.js` (`CONTACTO`) poner `telefono: "+34 000 000 000"`, `telefonoRaw: "+34000000000"` y `whatsapp: "34000000000"`, y quitar el comentario `PENDIENTE: número real`.
- [X] T002 [US1] Comprobar en Edge sin ventana (390 y 1440 px) que el número visible, `tel:` y `wa.me` coinciden con el real en cabecera, bloque final y botón flotante.

## Phase 2: User Story 2 — Aviso legal (P1)

- [X] T003 [P] [US2] En `aviso-legal.html` (sección 1): titular `SLAC` (sin `<mark>`), eliminar `<dt>NIF</dt>`/`<dd>`, añadir `<dt>Instagram</dt><dd>[INSTAGRAM]</dd>` como texto sin enlace; mantener domicilio y correo con `[COMPLETAR]`; ajustar el comentario superior para que solo mencione lo pendiente.

## Phase 3: User Story 3 — Sin provisional (P2)

- [X] T004 [P] [US3] En `scripts/verificar.js` eliminar `TELEFONO_PROVISIONAL` y el aviso asociado.
- [X] T005 [P] [US3] En `COMO-ACTUALIZAR-FOTOS.md` sustituir el ejemplo del teléfono provisional por el real.
- [X] T006 [US3] Buscar `600 000 000` / `600000000` / `provisional` fuera de `_backup-original/`, `node_modules/` y `specs/` anteriores: 0 resultados que se refieran al teléfono.

## Phase 4: Polish

- [X] T007 `npm run verificar` sin errores ni avisos de teléfono; Lighthouse móvil ≥ 95 y CLS 0.
- [X] T008 Actualizar `MEMORY.md` (§1 pendientes, ADR de 005, mapa si procede).
- [X] T009 `/speckit-checklist` (seguridad y SEO, `legacy-scan`) y `/speckit-converge` hasta `Converged`; fusionar en `main`.
