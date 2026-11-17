# CÓMO TRABAJAR CON LA WEB SLAC

La web solo muestra **fotos de las prendas y el teléfono de contacto** (llamada y WhatsApp sin
mensaje). No lleva textos de venta, precios, nombres de prendas ni nada que sugiera una tienda:
`npm run verificar` lo comprueba automáticamente.

## 0. Ver la web en local

1. Instala **Node.js (versión LTS)** una sola vez: https://nodejs.org
2. Doble clic en **`INICIAR.bat`**: instala las herramientas la primera vez, optimiza las fotos y
   abre `http://localhost:3000`. La página se recarga sola al guardar cambios.
3. Para pararlo: `Ctrl + C` en la ventana negra.

| Dirección | Para qué |
|---|---|
| `http://localhost:3000` | La web |
| `http://localhost:3000/admin.html` | Panel de gestión de fotos |
| `http://localhost:3000/revision-por-modelo.html` | Revisar las fotos de cada prenda, la portada y las posibles repetidas |

**En el móvil (misma wifi):** `node scripts/servidor.js --red` y abre la dirección `http://192.168.x.x:3000` que muestra.

---

## 1. Teléfono (un solo sitio)

Edita `CONTACTO` al principio de **`data/galeria.js`**. El HTML no contiene el número: se rellena solo.

```js
const CONTACTO = {
  telefono: "+34 000 000 000",   // como se muestra
  telefonoRaw: "+34000000000",   // sin espacios, para llamar
  whatsapp: "34000000000"        // sin + ni espacios, para WhatsApp
};
```

---

## 2. Fotos

Los **originales** viven en `public/fotos/` y nunca se tocan. `OPTIMIZAR-IMAGENES.bat`
(o `npm run optimizar`) genera en `public/img/`:

- una carpeta por prenda con cada foto en WebP (160, 480, 800 y 1200 px) y AVIF (480, 800 y 1200 px);
  la web sirve el AVIF a los navegadores que lo entienden y la WebP al resto;
- `portada/`: las 4 fotos de `PORTADA` (1 principal, 2 izquierda, 3 derecha en escritorio, 4 fondo del contacto);
- el logo con fondo transparente (≈ 30 KB) y el favicon, a partir de `public/fotos/logo.jpeg`;
- `og-cover.jpg` (1200×630): imagen para compartir en WhatsApp y redes, con las fotos de portada y el logo;
- `data/fotos-optimizadas.js` con las medidas de cada foto (evita saltos al cargar).

Es incremental (solo procesa lo nuevo); `npm run optimizar:forzar` lo rehace todo. Al terminar avisa
de fotos repetidas, archivos que no existen y fotos sin usar: todo se ve en `revision-por-modelo.html`.

### Cambiar las fotos de la portada
En `data/galeria.js`, `PORTADA` indica qué foto de qué prenda va en cada posición
(`{ prenda: "026", foto: 1 }`; las fotos se cuentan desde 1). Después, `npm run optimizar`.

---

## 3. Añadir o cambiar una prenda

1. Copia las fotos originales a `public/fotos/` (sin espacios ni tildes en el nombre).
2. Añade la prenda en `admin.html` (apartado 4) o directamente en `PRENDAS` de `data/galeria.js`:

```js
{
  id: "027",                                   // identificador interno, no se muestra (no repetir)
  descripcion: "Vestido largo de satén con escote en V, en azul noche",
  imagenes: [
    "public/fotos/vestido-azul-1.jpg",         // la primera es la que se ve en la galería
    "public/fotos/vestido-azul-2.jpg"
  ]
}
```

3. Ejecuta `OPTIMIZAR-IMAGENES.bat` y revisa `revision-por-modelo.html`.

**La descripción** no se ve en pantalla: la leen los lectores de pantalla (personas ciegas) y los
buscadores. Debe ser **neutra**: tipo de prenda, color y detalle. Nada de precios, tallas,
disponibilidad ni palabras de venta (el verificador las rechaza).

---

## 4. Dos paneles: el local (`admin.html`) y el online (`/panel/`)

**Panel online (el del día a día): mostrar u ocultar fotos sin publicar.**
1. Entra en `https://slac-official.com/panel/` (pide tu correo y un código que te llega por email).
2. Cada prenda tiene un interruptor **Visible / Oculta**. Dentro de «Fotos» está el de cada foto.
3. El cambio se ve en la web en menos de un minuto. No hay que publicar nada.
4. En «Últimos cambios» ves quién cambió qué y cuándo.

Una prenda **nueva** aparece en el panel **oculta**: se activa a mano cuando quieras que se vea.
Una prenda visible cuyas fotos están todas ocultas tampoco se muestra.
Las imágenes fijas de la web (fondo del contacto y vista previa al compartir) no cambian desde el panel online: se cambian en local (apartado 2).

**Panel local (`admin.html`): añadir, corregir y eliminar prendas.**
1. Abre **`INICIAR.bat`** y entra en `http://localhost:3000/admin.html`.
2. Añade prendas, corrige descripciones o elimina. La casilla **Oculta** de este panel significa *privada*: esa prenda **nunca se sube** a Cloudflare (distinto de ocultarla en el panel online, que sí la sube pero no la enseña).
3. Pulsa **Descargar galeria.js** y reemplaza `data/galeria.js` por el archivo descargado.
4. Pulsa **Descargar copia completa (.json)** y guárdala en tu ordenador: incluye las privadas y sirve para recuperarlas (en el panel, «importar»). **No la subas a ningún sitio.**
5. Publica la web (apartado 7).

---

## 5. Comprobar antes de publicar

```
npm run verificar
```

Revisa sintaxis, datos, que las fotos optimizadas estén al día, enlaces rotos, **palabras prohibidas**
(venta, precio, tienda, pedido, talla, envío, colección, catálogo…), recursos de otros dominios y
código incrustado. Debe terminar en **✓ Todo correcto**.

---

## 6. ¿Son públicas las fotos?

**Sí.** Todo lo que el navegador descarga para pintar la web es público. Por eso:

- Las prendas marcadas como privadas en el panel local no se suben. Las que están ocultas en el panel online sí están en Cloudflare, pero el Worker no las entrega mientras estén ocultas (una foto oculta da 404).
- **No subas los originales** (`public/fotos/`): la web solo usa `public/img/` (máx. 1200 px).
- No se puede impedir que alguien guarde una imagen visible.

---

## 7. Publicar la web (Cloudflare)

La web está en **Cloudflare**. Solo hace falta publicar cuando cambian prendas, descripciones o fotos
(**no** para mostrar u ocultar: eso se hace en el panel online). **Doble clic en `PUBLICAR.bat`**. Hace, en orden:

1. Optimiza las fotos nuevas.
2. Verifica la web y genera la carpeta `dist/` (solo con lo publicable: nunca originales, scripts ni documentos; las fotos de las prendas no van en `dist/`).
3. Te pide escribir **SI** (la primera vez abre el navegador para iniciar sesión en Cloudflare).
4. Sube las fotos nuevas al almacén privado de Cloudflare (R2) y despliega la web con `wrangler deploy -c wrangler.jsonc`.

Al terminar, las prendas nuevas están **ocultas**: actívalas en el panel online.
Si algo falla se detiene y no publica nada. Si la copia no tiene los datos reales de contacto (teléfono, correo, domicilio, Instagram) o falta `wrangler.jsonc`, también se detiene.

Manualmente: `npm run publicar`, `npm run subir-imagenes` y `npx wrangler deploy -c wrangler.jsonc`.
**Nunca uses `wrangler deploy` sin `-c wrangler.jsonc` ni `wrangler pages ...`**: suben la carpeta entera del proyecto.

---

## 7 bis. Quién puede entrar en el panel online

El acceso lo gestiona **Cloudflare Access**, no la web: el panel no tiene lista de personas ni forma de dar permisos.

- **Dar acceso:** Cloudflare → Zero Trust → Access controls → Policies → la política de «SLAC panel» → añade el correo en *Include → Emails*.
- **Quitar acceso:** quita el correo de la política y, para cortar una sesión abierta, entra en Applications → «SLAC panel» → Edit → **Revoke existing tokens**. Surte efecto en minutos.
- Como propietaria de la cuenta de Cloudflare siempre puedes volver a darte acceso.
- Los cambios hechos por alguien quedan en «Últimos cambios» con su correo.

---

## 8. Poner el dominio (sitemap, canonical y datos estructurados)

Cuando tengas dominio, un solo comando (con `https://` y sin ruta):

```
npm run dominio -- https://tudominio.com
```

Genera `sitemap.xml` (solo la página principal), añade la línea `Sitemap:` a `robots.txt`, rellena
canonical, `og:url` y `og:image` en `index.html` y añade `url` e `image` a los datos estructurados
(JSON-LD). Se puede repetir con otro dominio: lo sustituye todo sin duplicar. Después ejecuta
`npm run verificar` y envía `https://tudominio.com/sitemap.xml` a Google Search Console.

Los datos estructurados (`WebSite` + `ImageGallery`) ya están en `index.html`; no uses otros tipos
(constitución, principio V).

---

## 9. Estado

- [x] Teléfono, titular, correo, domicilio e Instagram del aviso legal rellenados (solo en la copia local; en el repositorio de GitHub van como marcadores).
- [x] Dominio aplicado y web publicada en Cloudflare.
- [ ] Panel online configurado en Cloudflare (base D1, almacén R2 y Access): pasos en `specs/015-panel-admin-online/contracts/despliegue.md`.
- [ ] Revisar de vez en cuando en `revision-por-modelo.html` que cada fila es una sola prenda y las fotos repetidas.
