# CÓMO ACTUALIZAR EL CATÁLOGO DE PRENDAS

## 3 pasos para añadir una foto nueva o quitar una prenda

---

### PASO 1 — Añadir la foto

Copia la imagen de la prenda dentro de la carpeta:

```
slac/
└── public/
    └── fotos/      ← pon aquí tus fotos (JPG, WebP, PNG)
```

> Usa nombres sin espacios ni tildes, por ejemplo: `vestido-seda-rosa.jpg`

---

### PASO 2 — Añadir o editar la prenda en el catálogo

Abre el archivo `data/catalogo.js` con cualquier editor de texto (Bloc de notas, VS Code, etc.).

Añade un nuevo bloque como este dentro del array `PRENDAS`, justo antes del `]` final:

```js
{
  id: "009",                          // número de referencia único
  nombre: "Vestido Seda Rosa",        // nombre que verá el cliente
  categoria: "Vestidos",              // Vestidos | Conjuntos | Noche | Novedades
  imagen: "/public/fotos/vestido-seda-rosa.jpg", // o URL completa de internet
  estado: "disponible"                // disponible | agotado | oculto
},
```

---

### PASO 3 — Cambiar el estado de una prenda (agotado / oculto)

Busca la prenda en `data/catalogo.js` y cambia el campo `estado`:

| Valor | Efecto en la web |
|---|---|
| `"disponible"` | Se muestra con botón de WhatsApp activo |
| `"agotado"` | Se muestra con badge "Agotado / Bajo pedido" |
| `"oculto"` | **No aparece** en la web (se guarda para reactivar) |

Guarda el archivo y recarga la web. ¡Listo!

---

## Forma alternativa: Panel Visual (sin tocar código)

Entra en la web añadiendo `?admin=true` al final de la URL:

```
http://localhost:3000/?admin=true
```

Aparecerá un botón **"Gestión"** en la esquina inferior izquierda. Desde ese panel puedes:

- ✅ Añadir prendas nuevas
- 🔄 Cambiar estado (Disponible / Agotado / Oculto)
- 🗑️ Eliminar prendas
- 💾 Descargar el `catalogo.js` actualizado para reemplazarlo en `data/`

---

## Cambiar el teléfono o el número de WhatsApp

Edita las primeras líneas de `data/catalogo.js`:

```js
const CONTACTO = {
  telefono: "+34 600 000 000",      // ← número que se muestra
  telefonoRaw: "+34600000000",      // ← sin espacios, para el enlace tel:
  whatsapp: "34600000000",          // ← sin + ni espacios, para wa.me/
  mensajeBase: "Hola, me gustaría saber si tenéis disponible la prenda: "
};
```
