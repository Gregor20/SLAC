# Contrato: interfaz del panel (`panel/`)

Responsable: `@Agent-UI-UX`. Archivos: `panel/index.html`, `panel/panel.css`, `panel/panel.js` (≤ 200 líneas cada uno; si crece, dividir). Sin código en línea (CSP `default-src 'self'` en `<meta>` y en cabecera), sin recursos de terceros, `lang="es"`, `<meta name="robots" content="noindex,nofollow">`, `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`.

## Texto permitido en el panel
Se publica en `dist/panel/`, así que `verificar` lo revisa con la lista de palabras prohibidas (constitución I). Vocabulario: prenda, foto, visible, oculta, número, cambio, guardado, error. **Prohibido**: catálogo, colección, stock, disponible, tienda, venta, precio, empresa…

## Estructura (móvil primero)
```
<header>   «Fotos de la web»          · correo de la persona · enlace «Salir» (/cdn-cgi/access/logout)
<main>
  <section aria-labelledby="t-prendas">
    <h1>Fotos de la web</h1>
    <p id="resumen">12 prendas visibles · 3 ocultas</p>
    <ul id="lista">
      <li class="prenda">                       ← una por prenda, <details> para las fotos
        miniatura · nº · descripción
        [interruptor: Prenda 12 visible]   «Visible · por ana@… · hoy 18:32»
        <details><summary>Fotos (4)</summary>
          rejilla de fotos: miniatura + [interruptor] por foto
        </details>
        «En portada» (etiqueta) si procede
  <section aria-labelledby="t-registro"> <h2>Últimos cambios</h2> <ol> … </ol>
<p id="estado" role="status" aria-live="polite">   ← «Guardado», «No se pudo guardar. Inténtalo de nuevo.»
```

## Comportamiento
- Carga: `GET /api/admin/estado` (`AbortController` 8 s). Error → mensaje con botón «Reintentar»; nunca se muestra un estado inventado.
- Interruptor: `<input type="checkbox" role="switch">` dentro de `<label>` con el nombre accesible completo («Prenda 12», «Foto 2 de la prenda 12»). Al cambiar: se bloquea, `PUT`, y con la respuesta se actualizan estado y registro. Si falla: el interruptor vuelve a su valor anterior y `#estado` lo dice (`role="status"`).
- Ocultar una prenda **marcada «En portada»** (usada en una imagen fija): `<dialog>` de confirmación («Una foto de esta prenda se usa en una imagen fija de la web (fondo del contacto o vista previa al compartir) y seguirá viéndose allí. Esas imágenes se cambian desde el panel local. ¿Ocultar sus fotos de la galería?»). Cancelar deja el interruptor como estaba.
- Si todas las fotos de una prenda visible están desactivadas: etiqueta «Sin fotos visibles: no se muestra» (la prenda no aparece en la web).
- Refresco: botón «Actualizar»; no hay sondeo automático (ahorra peticiones, batería y cuota).
- Concurrencia: tras cada `PUT` se muestra el estado devuelto por el servidor; si otra persona cambió lo mismo, gana el último y se ve al actualizar.

## Diseño
- Tokens de `styles.css` (negro cálido, dorado, texto `#eae6df`, secundario `#a29d95`), tipografías autoalojadas. Contraste AA.
- Zonas táctiles ≥ 44 px (`@media (pointer: coarse)`), ≥ 24 px en puntero fino; separación suficiente entre interruptores.
- Rejilla de fotos con contenedor (`container-type: inline-size`): 2 columnas en 360 px, más a mayor ancho. Sin desplazamiento horizontal hasta 320 px (WCAG 1.4.10).
- Barra inferior fija con «Actualizar» solo si hace falta, con `env(safe-area-inset-bottom)` y `scroll-padding-bottom`.
- Foco visible con contraste ≥ 3:1; navegación completa con teclado; `prefers-reduced-motion` anula las transiciones; el estado nunca se indica solo con color.
- Miniaturas con `width`/`height` y `loading="lazy"`; las ocultas se atenúan y llevan el texto «Oculta».

## Aceptación (de la spec)
- US1: 6 escenarios de `spec.md` desde 360 px con pantalla táctil.
- SC-001: «entrar, ocultar una prenda y comprobarlo» < 2 min.
- SC-007: 360–1920 px sin desplazamiento horizontal.
- FR-014: contraste AA, teclado, movimiento reducido.
