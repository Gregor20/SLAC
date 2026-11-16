# Auditoría de rendimiento (@Agent-Performance) — 004 Número en la foto

**Fecha**: 2026-11-16 | **Rama**: `004-numero-en-foto`

> Auditoría de la implementación (convención de `AGENTS.md` §5, paso 7): `[x]` = comprobado con la evidencia indicada.

- [x] CHK001 Lighthouse móvil local: rendimiento **99**, accesibilidad **100**, buenas prácticas **100**, SEO **100**; LCP 2,0 s; CLS **0** (SC-004: ≥ 95 y CLS 0). [`npx lighthouse`, Edge sin ventana]
- [x] CHK002 Sin peso añadido de red: el número es texto en el DOM; no hay imágenes, fuentes ni scripts nuevos ni regeneración de fotos (FR-009).
- [x] CHK003 Sin saltos de maquetación: la etiqueta de la galería es `position: absolute` dentro del botón; la del visor ocupa la barra existente y `:empty` la oculta sin reservar espacio.
- [x] CHK004 Sin fugas: no se añaden listeners, temporizadores ni observadores; `limpiarVisor` vacía `#visor-id` al cerrar (probado: vacío tras `Escape`).
- [x] CHK005 `prefers-reduced-motion`: el número no se anima (`animation: none`, transición despreciable) y las fotos aparecen visibles (opacidad 1).
- [x] CHK006 Sin JavaScript: no aparecen etiquetas vacías (0 `.pieza-id`, `#visor-id` oculto).
- [x] CHK007 Tamaño de archivos: `app.js` 121, `visor.js` 118, `lib.js` 95, `verificar.js` 174 líneas (límite 200).
- [x] CHK008 Sin errores en consola a 390 y 1440 px.

## `legacy-scan` (Modern Web Guidance, ignorando `_backup-original/` y `specs/`)

5 hallazgos en archivos del proyecto, **los mismos de la línea base** (MEMORY §4, 003); 004 no introduce ninguno nuevo. Las líneas se desplazaron por las ediciones.

| Archivo | Guía | Decisión |
|---|---|---|
| `visor.js:102` | `dialog` (cierre al pulsar fuera con listener manual; `closedby="any"` solo si hay soporte en Safari) | Se mantiene: el listener funciona en todos los navegadores; pasar a `closedby` queda como deuda futura. |
| `visor.js:78` | `js` (`innerHTML = ''` al limpiar miniaturas) | Se mantiene: vaciar un contenedor propio, sin datos externos; `replaceChildren()` es una mejora menor para otra funcionalidad. |
| `admin.js:9`, `admin.js:10` | `js` (`JSON.parse(JSON.stringify())` → `structuredClone`) | Se mantiene: panel local interno, no se publica. |

(Los otros 3 hallazgos del escaneo están en `_backup-original/`, excluido.)
