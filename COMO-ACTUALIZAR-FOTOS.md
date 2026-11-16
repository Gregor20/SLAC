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

## 4. Panel de gestión: `admin.html`

1. Ábrelo con el servidor local: `http://localhost:3000/admin.html`.
2. Añade prendas, corrige descripciones, marca **Oculta** o elimina.
3. **Descargar galeria.js** → reemplaza `data/galeria.js` → `npm run optimizar`.
4. **Descargar copia completa (.json)** → guárdala en tu ordenador. Incluye las ocultas: **no la subas**.

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

- No subas al servidor fotos de prendas que no se muestran (ni ocultas).
- **No subas los originales** (`public/fotos/`): la web solo usa `public/img/` (máx. 1200 px).
- No se puede impedir que alguien guarde una imagen visible.

---

## 7. Qué subir al servidor

**Subir:** `index.html`, `aviso-legal.html`, `styles.css`, `visor.css`, `legal.css`, `lib.js`,
`app.js`, `visor.js`, `robots.txt`, `data/galeria.js`, `data/fotos-optimizadas.js`,
`public/img/` (sin `.cache.json`) y `public/fonts/`.

**NO subir:** `public/fotos/`, `admin.*`, `revision-por-modelo.html`, `contact-sheet.html`,
`scripts/`, `node_modules/`, `package*.json`, `*.bat`, `specs/`, `.specify/`, `.claude/`, los `.md`
y las copias `.json` privadas.

---

## 8. Pendientes antes de publicar

- [ ] Teléfono real en `CONTACTO` (`data/galeria.js`).
- [ ] Completar los datos **[COMPLETAR: …]** de `aviso-legal.html` y revisarlo con la gestoría.
- [ ] Revisar en `revision-por-modelo.html` que cada fila es una sola prenda y las fotos repetidas.
- [ ] Cuando haya dominio: canonical, imagen para compartir y `sitemap.xml`.
