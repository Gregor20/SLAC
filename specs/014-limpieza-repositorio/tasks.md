# Tasks: Limpieza del repositorio

## Fase 1 — Línea base
- [X] T001 Guardar `npm run verificar` y la lista de archivos de `dist/` (tras `npm run publicar`) antes de tocar nada.

## Fase 2 — US1: archivos que sobran
- [X] T002 [US1] Borrar `_backup-original/` y `contact-sheet.html`.
- [X] T003 [US1] Quitar `_backup-original` de las dos listas de `scripts/servidor.js`.
- [X] T004 [US1] Recortar `module.exports` sin uso en `scripts/datos.js` y `scripts/imagenes-extra.js`.

## Fase 3 — US2: artefactos de IA
- [X] T005 [US2] Borrar `.agents/` y `.wrangler/` (vacías); comprobar que las skills `speckit-*` siguen en `.claude/skills/`.

## Fase 4 — US3: documentación
- [X] T006 [US3] `AGENTS.md` §5: quitar `_backup-original/` del `legacy-scan`.
- [X] T007 [US3] `MEMORY.md`: ADR 014 con lo borrado y los falsos positivos de knip.

## Fase 5 — Verificación
- [X] T008 `grep` de los nombres borrados (0 referencias vivas), knip de nuevo (solo falsos positivos), `npm run verificar`, `npm run publicar` y lista de `dist/` idéntica a T001; servidor local responde 200 en `/`, `/admin.html` y `/aviso-legal.html`.
