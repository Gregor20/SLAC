# Auditoría de seguridad (@Agent-SecOps) — 004 Número en la foto

**Fecha**: 2026-11-16 | **Rama**: `004-numero-en-foto` | **Alcance**: `lib.js`, `app.js`, `visor.js`, `index.html`, `styles.css`, `visor.css`, `admin.*`, `scripts/*`

> Auditoría de la implementación (convención de `AGENTS.md` §5, paso 7): `[x]` = comprobado con la evidencia indicada.

- [x] CHK001 Entradas: el número solo sale de `id`, que `verificar` y el panel limitan a `^\d{1,4}$` (probado: `"A1"` y repetidos fallan). [FR-007, FR-008, FR-011]
- [x] CHK002 XSS: en la galería el número pasa por `sanitize(numeroPrenda(p))`; en el visor se asigna con `textContent` (sin `innerHTML`). [`app.js`, `visor.js`]
- [x] CHK003 CSP intacta: `default-src 'self'`, sin `<script>` ni `<style>` en línea, sin atributos `style` ni manejadores (`verificar`: "Código en línea" ✓). El estilo del número va en clases de `styles.css`/`visor.css`.
- [x] CHK004 Cero recursos de terceros: sin URLs externas nuevas (`verificar`: "URLs externas" ✓); sin dependencias nuevas en `package.json`.
- [x] CHK005 Sin secretos ni variables de entorno añadidos.
- [x] CHK006 Contenido (principio I): solo cifras junto a la foto; sin "Nº", "ref.", "código" ni palabras de negocio (`verificar`: "Palabras prohibidas" ✓).
- [x] CHK007 El panel `admin` sigue siendo local y fuera de lo publicable (sin cambios en `PUBLICABLES`).
- [ ] CHK008 Cabeceras HTTP (HSTS, frame-ancestors, nosniff, Referrer-Policy): sigue pendiente, depende del hosting (MEMORY §5). No es de esta funcionalidad.
