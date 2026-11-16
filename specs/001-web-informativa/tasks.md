---
description: "Tareas de la funcionalidad 001: web informativa SLAC"
---

# Tasks: Web informativa SLAC (solo fotos y teléfono)

**Input**: Design documents from `/specs/001-web-informativa/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: no se piden pruebas automatizadas aparte de la puerta `npm run verificar` (constitución)
y la validación visual de [quickstart.md](./quickstart.md).

**Organization**: tareas agrupadas por historia de usuario de la spec.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: puede hacerse en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: historia a la que pertenece (US1…US4)
- Rutas relativas a la raíz del repositorio (estructura plana, ver plan.md)

---

## Phase 1: Setup

**Purpose**: datos, fuentes y servidor local listos para el nuevo diseño

- [X] T001 [P] Copiar a `public/fonts/` `cormorant-garamond-500.woff2` y `manrope-variable.woff2` (subconjunto latino de Fontsource) con su licencia `OFL.txt`
- [X] T002 Crear `data/galeria.js` desde `data/catalogo.js` según [contracts/galeria-js.md](./contracts/galeria-js.md): `CONTACTO` solo con `telefono`, `telefonoRaw`, `whatsapp`; `PORTADA` con "Exactamente 4 entradas" (026 #1, 025 #2, 021 #1, 001 #1); `PRENDAS` con `id`, `descripcion` ("Obligatoria, neutra (tipo, color, detalle), sin términos prohibidos") e `imagenes`; borrar `data/catalogo.js`
- [X] T003 [P] Cambiar `scripts/servidor.js` para servir la recarga en vivo como `/__recargar.js` (sin `<script>` en línea) y no servir `specs/`, `.specify/`, `.claude/`, `.git/`

---

## Phase 2: Foundational (bloquea todas las historias)

- [X] T004 Adaptar `scripts/optimizar-imagenes.js`: leer `data/galeria.js`; escribir `FOTOS_OPT.prendas[id]` como lista `[ancho, alto]`; generar `public/img/portada/<p>-<ancho>.webp` (480, 800, 1200) desde `PORTADA`; logo con transparencia `public/img/logo-280.webp` y `logo-560.webp`; `public/img/favicon-48.png` y `public/img/apple-touch-icon.png`; página de revisión con `descripcion`; no podar `portada/` ni los archivos sueltos
- [X] T005 [P] Reescribir `lib.js`: `sanitize`, `getFotos(p)` → `[{ src, srcset, thumb, ancho, alto }]`, `enlaceTel()` y `enlaceWhatsApp()` (`https://wa.me/<whatsapp>` sin `text`)
- [X] T006 [P] Crear `scripts/verificar.js` según [contracts/verificar-cli.md](./contracts/verificar-cli.md) y el script `verificar` en `package.json`
- [X] T007 Ejecutar `npm run optimizar` y comprobar `data/fotos-optimizadas.js`, `public/img/portada/`, el logo y `revision-por-modelo.html`

**Checkpoint**: datos, fotos y herramientas listos

---

## Phase 3: User Story 1 - Ver las prendas (Priority: P1) 🎯 MVP

**Goal**: portada con fotos propias, galería sin textos y visor con todas las fotos

**Independent Test**: abrir la web a 390 px y 1440 px, recorrer la galería y abrir una prenda
de una foto y otra de varias (quickstart, filas 1-5)

- [X] T008 [US1] Reescribir `index.html`: CSP en `<meta>`, `title`/`description` neutros, precarga de la fuente de la portada, favicon generado, sprite SVG (6 iconos Phosphor light), cabecera, portada estática (`portada/1` con `fetchpriority="high"`, 2 y 3 `lazy`), sección de galería (`h2` solo para lectores de pantalla y aviso `<noscript>`), bloque de contacto, pie con "Aviso legal", botón flotante y `<dialog>` del visor; scripts `defer` (`data/galeria.js`, `data/fotos-optimizadas.js`, `lib.js`, `visor.js`, `app.js`)
- [X] T009 [US1] Reescribir `styles.css`: tokens (manteniendo los nombres de variables que usa `admin.css`), `@font-face` locales, base, cabecera, portada (1 foto en móvil, tríptico ≥ 900 px), galería en columnas (2 / 3 desde 700 px / 4 desde 1100 px), indicador de varias fotos, contacto, pie, botón flotante, animaciones solo con `.js` y anuladas con `prefers-reduced-motion`
- [X] T010 [US1] Reescribir `app.js`: clase `js` en `<html>`, galería desde `PRENDAS` con `width`/`height`, `srcset`/`sizes` y `alt` = `descripcion`, indicador de varias fotos, segunda foto al pasar el ratón (solo punteros finos), animación de entrada con `IntersectionObserver`, estado de la cabecera (logo visible al salir de la portada)
- [X] T011 [P] [US1] Crear `visor.css` y `visor.js`: `<dialog>` con foto, contador "n / total", flechas, miniaturas, teclado, deslizamiento, cierre con botón/Escape/fondo, `alt` "descripción (foto n de total)"; sin flechas, contador ni miniaturas si solo hay una foto; limpieza al cerrar

**Checkpoint**: US1 funcional

---

## Phase 4: User Story 2 - Contactar (Priority: P1)

**Goal**: llamar o abrir WhatsApp a un toque desde cualquier punto

**Independent Test**: quickstart, filas 6-7

- [X] T012 [US2] En `app.js`, rellenar `data-contact="tel"`, `"tel-texto"` y `"wa"` desde `CONTACTO` con `enlaceTel()`/`enlaceWhatsApp()`; comprobar en `index.html` que la cabecera (número), el botón flotante (WhatsApp) y el bloque final (número, "Llamar", "WhatsApp") usan esas marcas

**Checkpoint**: US1 + US2 = web publicable salvo el teléfono real

---

## Phase 5: User Story 3 - Nada que sugiera un negocio (Priority: P2)

**Goal**: cero términos comerciales y legal en una sola página neutra

**Independent Test**: `npm run verificar` sin errores y lectura de `aviso-legal.html`

- [X] T013 [US3] Reescribir `aviso-legal.html` (neutra, R9) y ajustar `legal.css` a los nuevos tokens, con CSP en `<meta>` y sin recursos externos
- [X] T014 [US3] Borrar `privacidad.html` y `cookies.html`; quitar cualquier enlace a ellas
- [X] T015 [US3] Ejecutar `npm run verificar` y corregir todo lo que encuentre en los archivos publicables

---

## Phase 6: User Story 4 - Mantener las fotos al día (Priority: P3)

**Goal**: el panel interno trabaja con el nuevo modelo

**Independent Test**: añadir una prenda de prueba en `admin.html`, exportar y comprobar el archivo

- [X] T016 [US4] Adaptar `admin.html`, `admin.js` y `admin.css`: cargar `data/galeria.js`; campos `id`, `descripcion`, fotos y casilla "Oculta"; exportar `galeria.js` (CONTACTO + PORTADA + PRENDAS sin ocultas, comentarios neutros) y copia privada `.json`; sin iconos de CDN ni fuentes externas

---

## Phase 7: Polish & Cross-Cutting

- [X] T017 [P] Actualizar `COMO-ACTUALIZAR-FOTOS.md`, `INICIAR.bat`, `OPTIMIZAR-IMAGENES.bat` y `package.json` (nuevo archivo de datos, `npm run verificar`, páginas legales)
- [X] T018 Validación de [quickstart.md](./quickstart.md): capturas a 390×844 y 1440×900, visor y aviso legal; consola sin errores; ninguna petición externa; movimiento reducido
- [X] T019 Actualizar `MEMORY.md` (identidad, diseño, mapa del código, ADR, auditoría)

---

## Dependencies & Execution Order

- **Setup (T001-T003)** → **Foundational (T004-T007)** → historias.
- T004 depende de T002; T007 depende de T004.
- **US1 (T008-T011)** depende de Foundational. T011 en paralelo con T008-T010.
- **US2 (T012)** depende de T008 y T010 (mismos archivos).
- **US3 (T013-T015)**: T013-T014 en paralelo con US1; T015 al final de US1-US3.
- **US4 (T016)** depende solo de T002.
- **Polish** al final; T018 antes de `/speckit-converge`.

## Parallel Example

```text
T001 (fuentes) ‖ T003 (servidor) ‖ T005 (lib.js) ‖ T006 (verificar)
T011 (visor) ‖ T013 (aviso legal) ‖ T016 (panel)
```

## Implementation Strategy

1. Setup + Foundational: datos nuevos, fotos regeneradas, verificador.
2. US1 + US2 (MVP): la web nueva completa con portada, galería, visor y contacto.
3. US3: legal y verificación de palabras.
4. US4: panel interno.
5. Polish: documentación, validación visual y memoria.

---

## Phase 8: Convergence

- [X] T020 CRITICAL: convertir a número (`Number()`) las dimensiones de `FOTOS_OPT` y el contador de fotos antes de interpolarlos en el HTML generado en `app.js` per Constitution IV (contradicts)
- [X] T021 Asignar en `app.js` a las fotos de portada (`.portada-foto`) y al fondo de contacto el `alt` neutro de la prenda indicada en `PORTADA` (`descripcion`) per FR-011 / SC-005 (partial)
- [X] T022 Revisar el indicador `.portada-bajar` de `index.html` frente a FR-001 (sin texto visible, nombre accesible "Ver las fotos") y documentar la decisión en `MEMORY.md` o retirarlo per FR-001 (unrequested)
