# Auditoría de la funcionalidad 015 (panel de administración online)

Resultados de las validaciones manuales y automáticas, por historia. Se completa durante la implementación y se cierra con `/speckit-checklist seguridad`, `rendimiento` y `seo`.

## US1 — Activar y desactivar fotos desde el móvil (T027)

Entorno: `wrangler dev --local` (D1 y R2 locales, `ACCESS_DEV_EMAIL`), Edge sin ventana (puppeteer-core), 2026-11-17. Con las miniaturas de 4 prendas subidas al R2 local (el resto da 404 y el panel deja el hueco).

- [X] Sin desplazamiento horizontal a 320, 360, 768 y 1920 px (SC-007), 37 prendas.
- [X] Sin errores de consola al cargar a esos cuatro anchos.
- [X] Activar una prenda desde el móvil (toque) → «Guardado»; interruptor, nota «Visible · por … · fecha» y resumen coinciden con el servidor.
- [X] Desactivar una foto: la prenda sigue visible con las demás (US1.5); sin fotos activas → «Sin fotos visibles: no se muestra».
- [X] Los `<details>` abiertos y el foco no se pierden al guardar (la lista se actualiza en su sitio).
- [X] Prenda «En portada»: ocultar abre la confirmación (foco inicial en «Cancelar»); Esc la cierra y deja prenda y servidor como estaban; «Ocultar» guarda.
- [X] Sin conexión: avisa «No se pudo guardar. Inténtalo de nuevo.», el interruptor vuelve a su valor y el servidor no cambia.
- [X] Teclado: la barra espaciadora activa el interruptor y el foco se mantiene.
- [X] `prefers-reduced-motion` anula las transiciones.
- [X] Zonas táctiles ≥ 44 px (mínimo medido 44).
- [ ] Contraste AA y lector de pantalla: pendiente de la auditoría `/speckit-checklist seguridad|rendimiento` (FR-014).
- [ ] Reflejo en la web pública en < 1 min: lo cierra US2 (T039).

Notas:
- La guía `dialog` de Modern Web Guidance se aplicó tal cual (`showModal()`, `aria-labelledby`, `autofocus` en la acción segura, sin polyfills); `switch` y `form-factor-adaptation`, según `research.md`.
- `/%70anel/index.html` (ruta con la «p» codificada) → pendiente de comprobar en producción (T044): ver nota de T016.
