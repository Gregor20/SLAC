# Quickstart — validar 004

1. `npm run verificar` → sin errores. Probar el fallo: cambiar temporalmente un `id` a `"A1"` y otro
   a un valor ya existente (`"001"` y `"1"`) → debe avisar; revertir.
2. `npm run dev` y abrir la web a 390 px y a 1440 px:
   - Cada foto de la galería lleva su número arriba a la izquierda; no hay repetidos.
   - Abrir una prenda con varias fotos: el número permanece al pasar de foto y cambia al abrir otra.
3. Contraste: texto dorado sobre la píldora con la foto más clara y más oscura (≥ 4,5:1).
4. Con `prefers-reduced-motion` y sin JS: sin errores en consola ni etiquetas vacías.
5. Lighthouse móvil ≥ 95 y CLS 0.
6. Panel (`admin.html`): un id `A1` o repetido se rechaza.
