# Auditoría previa a la entrega — 005 Datos reales del titular y del contacto

**Fecha**: 2026-11-16 | **Rama**: `005-datos-reales-contacto` | **Alcance**: `data/galeria.js`, `aviso-legal.html`, `scripts/verificar.js`, `COMO-ACTUALIZAR-FOTOS.md`, `MEMORY.md`

> Auditoría de la implementación (convención de `AGENTS.md` §5, paso 7): `[x]` = comprobado con la evidencia indicada.

## Convergencia spec ↔ plan ↔ tareas ↔ archivos

| Requisito | Evidencia |
|---|---|
| FR-001/002 teléfono único y formas derivadas | `CONTACTO` en `data/galeria.js`; en Edge (390 y 1440 px): 4 enlaces `tel:+34000000000`, 2 `https://wa.me/34000000000` y 3 textos "+34 000 000 000"; 0 errores en consola |
| FR-003 titular SLAC | `aviso-legal.html`: "TITULAR \| SLAC" |
| FR-004 sin NIF/NIE | `grep` en `aviso-legal.html`: 0 resultados |
| FR-005 Instagram como texto | "INSTAGRAM \| [INSTAGRAM]", sin `<a>` |
| FR-006 domicilio y correo pendientes | siguen con `[COMPLETAR]` (2 marcadores, SC-002) |
| FR-007/008 sin provisional y formato validado | `grep` del provisional fuera de `_backup-original/`, `node_modules/` y `specs/`: solo una palabra "provisional" ajena al teléfono (`AGENTS.md`, sobre `legacy-scan`); `verificar` ya no avisa y sigue validando `^\+\d{6,15}$` |
| FR-009 sin texto nuevo en la principal | `git diff --stat`: `index.html` no cambia |

## Seguridad

- [x] Sin enlaces nuevos a terceros: el Instagram es texto; solo `tel:` y `wa.me` (`verificar`: "URLs externas" ✓).
- [x] Sin secretos ni código en línea (`verificar` ✓, CSP intacta).
- [x] El teléfono sigue en un único lugar (constitución VI); el HTML no lo lleva escrito.

## SEO y contenido

- [x] `aviso-legal.html` sigue `noindex`; título y descripción sin cambios; palabras prohibidas ✓.
- [x] Sin cambios en la página principal, metadatos ni imágenes.

## Rendimiento

- [x] Sin cambios de carga (solo texto y datos); no se repitió Lighthouse. Medición de 004 (99/100/100/100, CLS 0) sigue vigente.
- [x] `legacy-scan` (sin `_backup-original/` ni `specs/`): los mismos 4 hallazgos de la línea base (`visor.js:103`, `visor.js:79`, `admin.js:9`, `admin.js:10`); 005 no añade ninguno.

## Pendiente (fuera de esta funcionalidad)

- [ ] Domicilio y correo del titular en `aviso-legal.html` (los facilita el usuario).
- [ ] Dominio y hosting; cabeceras HTTP; JSON-LD y `sitemap.xml`.
