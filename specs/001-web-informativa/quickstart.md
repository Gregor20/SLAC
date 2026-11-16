# Quickstart: validar la funcionalidad 001

## Requisitos
Node.js ≥ 18.17 y dependencias instaladas (`npm install`).

## 1. Generar fotos y comprobar
```powershell
npm run optimizar     # fotos, portada, logo, favicon y data/fotos-optimizadas.js
npm run verificar     # debe terminar con 0 errores (aviso esperado: teléfono provisional)
```

## 2. Ver la web
```powershell
npm run dev           # http://localhost:3000
```

| Escenario | Resultado esperado |
|---|---|
| Abrir la web en 390 px de ancho | Portada con una foto a pantalla completa, logo dorado y número; ningún otro texto |
| Abrir la web en 1440 px | Tríptico de tres fotos con el logo y el número |
| Bajar por la galería | 26 piezas en columnas, sin textos; las de varias fotos con un indicador discreto |
| Tocar una pieza con varias fotos | Visor con contador, flechas, miniaturas; deslizar y teclado funcionan |
| Cerrar con Escape o tocando fuera | Vuelve a la misma posición de la galería |
| Tocar el número de la cabecera | Enlace `tel:` |
| Tocar WhatsApp (botón flotante o bloque final) | `https://wa.me/<número>` sin `?text=` |
| Pulsar "Aviso legal" en el pie | Página neutra, sin términos comerciales |
| Consola del navegador | Sin errores ni violaciones de CSP |
| Red (F12) | Ninguna petición a otro dominio |
| Movimiento reducido activado | Sin animaciones de entrada |

## 3. Capturas automáticas (agente)
Edge sin ventana mediante `puppeteer-core` (fuera del proyecto, en el scratchpad): capturas a
390×844 y 1440×900, visor abierto y aviso legal, registrando errores de consola.
