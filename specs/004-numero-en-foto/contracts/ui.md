# Contrato de interfaz — número de la prenda

- Galería: `<span class="pieza-id">{n}</span>` dentro de `button.pieza-boton`, antes del `<picture>`;
  contenido = solo cifras.
- Visor: `<span class="visor-id" id="visor-id">{n}</span>` en `.visor-barra`; vacío con el visor
  cerrado. `dialog.visor[aria-label]` = `"{n}. {descripción}"`.
- Ningún otro texto acompaña al número (ni "Nº", ni "ref.", ni "código").
- `numeroPrenda(prenda)` (lib.js y scripts/datos.js) es la única función que convierte `id` en número.
- `npm run verificar` falla si un `id` no cumple `^\d{1,4}$` o dos prendas comparten número.
