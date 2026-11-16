# Tasks: Número en la foto para identificar la prenda

**Input**: `specs/004-numero-en-foto/` (spec.md, plan.md, research.md, data-model.md, contracts/ui.md, quickstart.md)

**Tests**: no se piden tests automáticos; la validación es `npm run verificar` y la prueba visual de `quickstart.md`.

**Formato**: `- [ ] T### [P?] [US?] Descripción con ruta`. `[P]` = se puede hacer en paralelo (archivos distintos).

Antes de escribir HTML/CSS/JS de plataforma, consultar Modern Web Guidance (AGENTS.md §5); las guías aplicadas
ya constan en `research.md`.

## Phase 1: Foundational (bloquea las historias)

**Propósito**: la regla única `id` → número, compartida por la web y por Node.

- [X] T001 [P] Añadir `numeroPrenda(p)` en `lib.js`: devuelve `String(Number(p.id))` (el `id` es de 1 a 4 cifras; `"001"` → `"1"`).
- [X] T002 [P] Añadir `numeroPrenda(p)` (misma regla) y exportarlo en `scripts/datos.js`.

**Checkpoint**: ambos helpers devuelven `"12"` para `{ id: "012" }`.

---

## Phase 2: User Story 1 — Número en la foto de la galería (P1) 🎯 MVP

**Objetivo**: cada foto de la galería muestra el número de su prenda.

**Prueba independiente**: abrir la web a 390 px; cada prenda lleva un número distinto arriba a la izquierda.

- [X] T003 [US1] En `app.js` (`piezaHTML`), insertar `<span class="pieza-id">${sanitize(numeroPrenda(p))}</span>` dentro de `.pieza-boton`, **antes** del `<picture>` (el nombre accesible queda "12 descripción", sin palabras añadidas).
- [X] T004 [US1] En `styles.css`, estilo `.pieza-id`: `position:absolute; top/left: var(--space-2); z-index:1`; píldora `rgba(10, 9, 8, 0.82)` + `backdrop-filter: blur(6px)` (con prefijo `-webkit-`), texto `var(--clr-gold-light)`, `font-size ≈ 0.78rem`, `font-weight 600`, `font-variant-numeric: tabular-nums`, `pointer-events:none`; sin animación propia. Comprobar que no choca con `.pieza-num` (abajo a la derecha) ni con el `::after` del borde.
- [X] T005 [US1] Comprobar con Edge sin ventana (390 y 1440 px) que se ve el número, no hay repetidos y la entrada de fotos (`.js .pieza`) sigue funcionando; con `prefers-reduced-motion` no hay animación.

**Checkpoint**: US1 funciona sola (MVP).

---

## Phase 3: User Story 2 — Número en el visor (P1)

**Objetivo**: el número sigue visible al ver una prenda en grande y cambia al cambiar de prenda.

**Prueba independiente**: abrir dos prendas con varias fotos, pasar de foto: el número se mantiene y cambia con la prenda.

- [X] T006 [US2] En `index.html`, añadir `<span class="visor-id" id="visor-id"></span>` como primer hijo de `.visor-barra` (antes de `#visor-contador`), sin ningún otro texto.
- [X] T007 [US2] En `visor.js` (`abrirVisor`), poner `$v('visor-id').textContent = numeroPrenda(prenda)` y `visor.setAttribute('aria-label', `${numeroPrenda(prenda)}. ${prenda.descripcion}`)`; en `limpiarVisor`, vaciar `#visor-id`. Mantener `visor.js` ≤ 200 líneas.
- [X] T008 [P] [US2] En `visor.css`, estilo `.visor-id`: mismo aspecto que `.pieza-id` (píldora oscura, texto dorado, cifras tabulares), sin posición absoluta (va en el flujo de la barra, a la izquierda); `:empty { display:none }`. Ajustar `.visor-barra` para que el contador no pierda su sitio y el botón de cerrar siga a la derecha (`margin-left:auto`). Con `.visor--una` el número se sigue mostrando.
- [X] T009 [US2] Comprobar en Edge sin ventana (390 y 1440 px): número visible en cada foto, cambia al abrir otra prenda y no queda texto residual al cerrar; sin errores en consola.

**Checkpoint**: US1 y US2 funcionan.

---

## Phase 4: User Story 3 — El número sale del identificador (P2)

**Objetivo**: no hay segunda numeración; los ids inválidos o repetidos se detectan.

**Prueba independiente**: con `id` `"A1"` o repetido, `npm run verificar` falla; el panel lo rechaza.

- [X] T010 [P] [US3] En `scripts/verificar.js` (función `datos`), exigir `^\d{1,4}$` al `id` de cada prenda y detectar duplicados por **valor** con `numeroPrenda` (`"001"` y `"1"` chocan); mensaje claro con el id. Mantener el archivo ≤ 200 líneas (hoy 173).
- [X] T011 [P] [US3] En `admin.html` (`#nueva-id`), cambiar `pattern` a `\d{1,4}` (placeholder `Ej: 027`); en `admin.js` (`iniciarFormulario`), validar `^\d{1,4}$` y unicidad por valor (`numeroPrenda`), con mensajes en español. Comprobar que `admin.html` carga `lib.js`; si no, comparar con `String(Number(id))` en línea.
- [X] T012 [US3] Probar el fallo y revertir: cambiar temporalmente un id a `"A1"` y otro a un valor repetido, ejecutar `npm run verificar` (debe fallar con ambos avisos) y restaurar `data/galeria.js`.

**Checkpoint**: las tres historias funcionan.

---

## Phase 5: Polish y puertas de calidad

- [X] T013 Confirmar que la portada y `public/img/og-cover.jpg` no llevan número (FR-010) y que no hay ninguna palabra añadida junto al número en HTML/JS/CSS.
- [X] T014 Medir contraste (≥ 4,5:1) del texto dorado sobre la píldora con la foto más clara y la más oscura de la galería (SC-003); ajustar la opacidad del fondo si hace falta.
- [X] T015 Ejecutar `npm run verificar` (sin errores) y Lighthouse móvil local (rendimiento ≥ 95, CLS 0).
- [X] T016 Actualizar `MEMORY.md`: mapa del código (`numeroPrenda`, `.pieza-id`, `.visor-id`), ADR de 004, checklist y regla de contenido (el número es el único dato añadido). Actualizar la spec si el visor queda con el número en la barra (FR-002).
- [ ] T017 `/speckit-checklist seguridad rendimiento seo` (incluido `legacy-scan`) y `/speckit-converge`; repetir hasta `Converged`.

---

## Dependencias y orden

- Phase 1 (T001-T002) → todas las historias.
- US1 (T003-T005) es el MVP; US2 (T006-T009) depende de T001 pero no de US1; US3 (T010-T012) depende de T002.
- Paralelo: T001 ‖ T002; T008 ‖ T010 ‖ T011 (archivos distintos). `app.js`, `visor.js` e `index.html` se editan en serie.
- Estrategia: Foundational → US1 (validar) → US2 → US3 → Polish → fusión en `main` (previa confirmación del usuario).

**Resumen**: 17 tareas · Foundational 2 · US1 3 · US2 4 · US3 3 · Polish 5.
