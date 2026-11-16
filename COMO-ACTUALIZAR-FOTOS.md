# CÓMO TRABAJAR CON LA WEB SLAC

## 0. Ver la web en local (servidor en directo)

1. Instala **Node.js (versión LTS)** una sola vez: https://nodejs.org
2. Haz **doble clic en `INICIAR.bat`**.
   - La primera vez instala las herramientas y **optimiza las fotos** (unos minutos).
   - Después abre el navegador en `http://localhost:3000` y **se recarga sola** cada vez que guardas un archivo.
3. Para pararlo: `Ctrl + C` en la ventana negra.

Otras direcciones útiles mientras el servidor está activo:

| Dirección | Para qué |
|---|---|
| `http://localhost:3000` | La web |
| `http://localhost:3000/admin.html` | Panel de gestión del catálogo |
| `http://localhost:3000/revision-por-modelo.html` | Revisar las fotos de cada modelo y las posibles repetidas |

**Verla en el móvil (misma wifi):** abre una terminal en esta carpeta y ejecuta
`node scripts/servidor.js --red`. Mostrará una dirección tipo `http://192.168.x.x:3000`.

---

## 1. Fotos: cómo se optimizan y se ordenan por modelo

Las fotos **originales** viven en `public/fotos/` y nunca se tocan.
El optimizador (`OPTIMIZAR-IMAGENES.bat` o `npm run optimizar`) crea, **una carpeta por modelo**:

```
public/img/001/1-160.webp  1-480.webp  1-800.webp  1-1200.webp
public/img/001/2-160.webp  ...
public/img/002/...
```

- El **orden de las fotos de cada modelo** es el orden del array `imagenes` en `data/catalogo.js`
  (la primera es la portada).
- Cada visitante descarga solo el tamaño que necesita su pantalla (móvil, portátil, retina…).
- Es **incremental**: solo procesa lo nuevo o cambiado. `npm run optimizar:forzar` lo rehace todo.
- Al terminar avisa de: **fotos repetidas**, archivos que no existen y fotos de `public/fotos`
  que no usa ningún modelo. Todo se ve en `revision-por-modelo.html`.
- Si una prenda se **oculta o se elimina**, su carpeta desaparece de `public/img`.

Si la web se abre **sin** haber optimizado, sigue funcionando con las originales (solo pesa más).

---

## 2. Datos de contacto (un solo sitio)

Edita el bloque `CONTACTO` al principio de `data/catalogo.js`. El HTML no contiene números:
los elementos con `data-contact="tel"`, `"tel-text"` y `"wa"` se rellenan solos desde ahí.

```js
const CONTACTO = {
  telefono: "+34 600 000 000",     // texto que se muestra   ← PENDIENTE: poner el real
  telefonoRaw: "+34600000000",     // sin espacios, para tel:
  whatsapp: "34600000000",         // sin + ni espacios, para wa.me/
  mensajeGeneral: "...", mensajeBase: "...", mensajeBajoPedido: "..."
};
```

---

## 3. Añadir o cambiar una prenda

**a)** Copia las fotos originales a `public/fotos/` (sin espacios ni tildes en el nombre).

**b)** Añade un bloque en `PRENDAS` (o usa `admin.html`, ver apartado 4):

```js
{
  id: "025",                         // referencia única (no repetir)
  nombre: "Vestido Seda Rosa",
  categoria: "Vestidos",             // Vestidos | Conjuntos | Noche
  nueva: true,                       // opcional: sale en "Novedades" y lleva badge
  imagenes: [
    "public/fotos/vestido-seda-rosa-1.jpg",   // la primera es la portada
    "public/fotos/vestido-seda-rosa-2.jpg"
  ],
  estado: "disponible"               // disponible | agotado
},
```

**c)** Ejecuta `OPTIMIZAR-IMAGENES.bat` y mira `revision-por-modelo.html`.

- **«Novedades» es una etiqueta** (`nueva: true`), no una categoría.
- `agotado` → se muestra con badge y botón **«Bajo pedido — Consultar»** (sigue activo).
- **Prendas ocultas:** no deben estar en `data/catalogo.js` (es un archivo público).
  El panel `admin.html` las excluye al exportar y las guarda en una copia privada `.json`.

---

## 4. Panel de gestión: `admin.html`

1. Ábrelo en local (con el servidor: `http://localhost:3000/admin.html`).
2. Añade prendas (varias fotos), cambia estado, marca «Nueva» o elimina.
3. **Descargar catalogo.js (público)** → reemplaza `data/catalogo.js` → ejecuta el optimizador.
4. **Descargar copia completa (.json)** → guárdala en tu ordenador (incluye las ocultas, **no la subas**).

---

## 5. ¿Son públicas las fotos?

**Sí.** Todo lo que el navegador descarga para pintar la web es público: cualquiera que conozca
la dirección de una foto puede verla y guardarla, aunque no aparezca en el catálogo.

- Los nombres correlativos (`image00001`, `image00002`…) permiten **adivinar** fotos sueltas.
  Por eso **no deben subirse al servidor fotos de prendas sin publicar** (ni de ocultas).
- Las **originales en alta resolución no hay que subirlas**: la web solo necesita `public/img/`
  (máx. 1200 px de ancho, no apto para imprimir) y `public/fotos/logo.jpeg`.
- No se puede impedir que alguien guarde una imagen que está a la vista. Si quieres disuadir
  usos indebidos, se puede añadir una marca de agua en el optimizador.

---

## 6. Qué subir al servidor y qué NO

**Subir:** `index.html`, `aviso-legal.html`, `privacidad.html`, `cookies.html`, `styles.css`,
`legal.css`, `app.js`, `lib.js`, `robots.txt`, `data/` (`catalogo.js` y `fotos-optimizadas.js`),
`public/img/` y `public/fotos/logo.jpeg`.

**NO subir:** `public/fotos/` (originales; solo el logo), `admin.html/.js/.css`,
`revision-por-modelo.html`, `contact-sheet.html`, `scripts/`, `node_modules/`, `package*.json`,
`*.bat`, `_backup-original/`, `.agents/`, este `.md` y las copias `.json` privadas.

---

## 7. Pendientes antes de publicar

- [ ] Teléfono y WhatsApp **reales** en `CONTACTO`.
- [ ] Completar los campos resaltados **«[COMPLETAR: …]»** en `aviso-legal.html` y `privacidad.html`
      (titular, NIF/CIF, domicilio, correo, hosting…) y revisarlos con la gestoría.
- [ ] Revisar `revision-por-modelo.html`: confirmar que cada fila es un único modelo y resolver las repetidas.
- [ ] Comprobar en el navegador (F12 → Aplicación → Cookies) que no se crea ninguna cookie.
- [ ] Cuando haya dominio: descomentar el bloque PENDIENTE de `index.html` (`canonical`, `og:*`,
      `twitter:image`), activar `Sitemap` en `robots.txt` y crear `sitemap.xml`.
- [ ] Crear `public/fotos/og-cover.jpg` (1200×630 px, < 300 KB) para la vista previa al compartir.
