# Research: Web informativa SLAC

Decisiones técnicas de la funcionalidad 001. Datos medidos sobre las 75 fotos actuales.

## R1. Composición de la galería

- **Decision**: columnas CSS (`columns`) tipo revista: 2 columnas en móvil, 3 desde 700 px y 4
  desde 1100 px, con huecos finos. Cada foto conserva su proporción natural.
- **Rationale**: las portadas van de 0,50 (012) a 1,07 (007) de ancho/alto y varias fotos son
  composiciones de dos imágenes (002, 006, 017). Recortarlas a una proporción fija cortaría
  cabezas, pies o media composición. Las columnas lo resuelven sin JavaScript de maquetación.
- **Alternatives considered**: rejilla 3:4 con recorte (`object-fit: cover`), descartada por los
  recortes; `grid-template-rows: masonry`, descartada por falta de soporte; maquetación en JS,
  descartada por complejidad.

## R2. Portada

- **Decision**: imágenes estáticas en el HTML desde `public/img/portada/<n>-<ancho>.webp`, que
  genera el optimizador a partir de `PORTADA` en `data/galeria.js`. Móvil: una foto a pantalla
  completa. Escritorio (≥ 900 px): tríptico de tres fotos. Una cuarta foto sirve de fondo del
  bloque de contacto. Elección inicial: 026 #1 (mono marrón, principal), 025 #2 (encaje negro),
  021 #1 (vestido verde) y 001 #1 (mono rojo en escalera iluminada) para el contacto.
- **Rationale**: la foto principal es el LCP; estando en el HTML el navegador la descubre sin
  esperar al JavaScript. Las rutas fijas (`portada/1-…`) no cambian aunque se reordenen las
  fotos de una prenda. Fondos oscuros y cálidos que combinan con el negro y dorado.
- **Alternatives considered**: pintar la portada con JS (retrasa el LCP); apuntar en el HTML a
  `public/img/<id>/<n>-…` (se rompe al reordenar fotos).

## R3. Logo con transparencia y favicon

- **Decision**: el optimizador genera desde `public/fotos/logo.jpeg` un logo recortado con
  transparencia (alfa = luminosidad, color "des-premultiplicado") en `public/img/logo-<ancho>.webp`
  (280 y 560 px) y un favicon cuadrado (`favicon-48.png`, `apple-touch-icon.png` 180 px).
- **Rationale**: el JPEG tiene fondo negro opaco y se vería como un rectángulo sobre las fotos.
  El logo es dorado sobre negro puro, así que la luminosidad separa trazo y fondo limpiamente.
- **Alternatives considered**: vectorizar el logo (más fiel pero manual); mezclarlo con
  `mix-blend-mode: screen` (aclara la foto de debajo y depende del fondo).

## R4. Tipografías

- **Decision**: Cormorant Garamond 500 (número de teléfono, cifras grandes) y Manrope variable
  (etiquetas pequeñas y el aviso legal), subconjunto latino en `woff2`, desde los paquetes de
  Fontsource (licencia SIL OFL 1.1, que permite autoalojarlas). `font-display: swap`; se
  precarga la de la portada.
- **Rationale**: son las tipografías actuales (continuidad de marca) y alojarlas en el propio
  servidor elimina la petición a Google (privacidad, sin cookies, CSP `'self'`).
- **Alternatives considered**: fuentes del sistema (pierden el carácter del logo); Google Fonts
  (tercero, prohibido por IV).

## R5. Iconos

- **Decision**: sprite SVG al principio del `<body>` con 6 símbolos de Phosphor en peso "light"
  (licencia MIT): teléfono, WhatsApp, cerrar, anterior, siguiente y "varias fotos". Uso con
  `<svg><use href="#i-…"></use></svg>`.
- **Rationale**: se usaban ~8 iconos de una hoja de 1 600 iconos servida por unpkg. El sprite
  pesa < 4 KB, no hace peticiones y la CSP lo permite.
- **Alternatives considered**: hoja de iconos local completa (pesa más de lo necesario); un SVG
  por archivo (más peticiones).

## R6. Datos

- **Decision**: `data/catalogo.js` pasa a `data/galeria.js` con `CONTACTO` (solo números),
  `PORTADA` y `PRENDAS` (`id`, `descripcion`, `imagenes`). Se eliminan `nombre`, `categoria`,
  `estado`, `nueva` y los mensajes de WhatsApp. Las ocultas solo existen en la copia privada del
  panel (`oculta: true`).
- **Rationale**: lo que no se muestra no debe estar en un archivo público (principio I); el
  nombre del archivo tampoco debe sugerir un catálogo de venta.
- **Alternatives considered**: mantener los campos sin mostrarlos (seguirían siendo legibles
  desde el navegador).

## R7. Dimensiones de las fotos

- **Decision**: el optimizador escribe en `FOTOS_OPT.prendas[id]` una lista `[ancho, alto]` de la
  versión mayor de cada foto; `getFotos` las devuelve y la galería las pone en `width`/`height`.
  Sin datos optimizados, la web sigue funcionando con los originales (sin dimensiones).
- **Rationale**: con proporciones variables (R1) es la única forma de reservar el hueco exacto y
  evitar saltos de maquetación.

## R8. Contacto

- **Decision**: `tel:<telefonoRaw>` y `https://wa.me/<whatsapp>` sin parámetro `text`. Cabecera
  fija con el número (llamar), botón flotante de WhatsApp y bloque final con número, "Llamar" y
  "WhatsApp". El HTML solo lleva marcas `data-contact`; `app.js` rellena enlaces y texto.
- **Rationale**: un toque desde cualquier posición (SC-003) y el número en un solo lugar (FR-008).

## R9. Aviso legal

- **Decision**: una sola página neutra con titular (campos `[COMPLETAR]`), objeto (sitio
  informativo con fotografías), condiciones de uso, propiedad de las fotografías, privacidad
  (no recoge datos ni usa cookies; si alguien llama o escribe, sus datos solo se usan para
  responder; derechos y AEPD) y legislación. Cita "Ley 34/2002 (LSSI)" sin su título completo.
- **Rationale**: cumple el deber de información con un único enlace discreto y sin términos
  comerciales. La redacción final debe revisarla una gestoría.

## R10. CSP y servidor local

- **Decision**: `<meta http-equiv="Content-Security-Policy" content="default-src 'self';
  img-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'none'">` en ambas
  páginas. El servidor local deja de inyectar un `<script>` en línea y sirve `/__recargar.js`.
  Las animaciones de entrada solo se activan si `app.js` añade la clase `js` al `<html>` (sin
  `<noscript><style>`).
- **Rationale**: principio IV; con la recarga en línea la propia CSP rompería el servidor local.
  `frame-ancestors` y el resto de cabeceras van en el servidor (funcionalidad 003).

## R11. Verificador

- **Decision**: `scripts/verificar.js`, sin dependencias, sobre los archivos publicables
  (`index.html`, `aviso-legal.html`, `*.css` públicos, `lib.js`, `app.js`, `visor.js`,
  `data/*.js`, `robots.txt`):
  1. Sintaxis de cada JS (`vm.Script`).
  2. Datos: ids únicos, descripción presente, fotos existentes, `PORTADA` válida.
  3. Fotos optimizadas al día (`FOTOS_OPT` coincide en número de fotos).
  4. Palabras prohibidas (expresiones con límite de palabra, sin distinguir tildes ni
     mayúsculas): venta, vender, comprar, precio, tienda, pedido, encargo, disponible, stock,
     agotado, talla, envío, oferta, descuento, rebaja, cliente, colección, catálogo, lookbook,
     atelier, empresa, negocio, comercial, mercantil, €, y los tipos `Store`, `LocalBusiness`,
     `Product`, `Offer`.
  5. URLs: solo `wa.me` y `schema.org` (y el dominio propio cuando exista).
  6. HTML: ni `<script>` sin `src` (salvo JSON-LD), ni `<style>`, ni `style="`, ni `on…="`.
  7. Aviso (no error) si el teléfono es el provisional.
- **Rationale**: convierte los principios I y IV en una comprobación repetible (puerta 1).
