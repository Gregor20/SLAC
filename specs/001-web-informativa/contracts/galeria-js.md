# Contrato: `data/galeria.js`

Archivo JavaScript clásico (sin módulos) que declara tres constantes globales. Lo leen la web
(`lib.js`, `app.js`, `visor.js`), el panel (`admin.js`), el optimizador y el verificador (estos
dos lo evalúan en un contexto aislado con `vm`).

```js
const CONTACTO = {
  telefono: "+34 600 000 000",   // texto visible
  telefonoRaw: "+34600000000",   // para tel:
  whatsapp: "34600000000"        // para https://wa.me/<whatsapp>
};

const PORTADA = [                // exactamente 4: principal, izquierda, derecha, contacto
  { prenda: "026", foto: 1 },
  { prenda: "025", foto: 2 },
  { prenda: "021", foto: 1 },
  { prenda: "001", foto: 1 }
];

const PRENDAS = [
  {
    id: "001",
    descripcion: "Mono largo de cuello halter con la espalda descubierta, en rojo y en negro",
    imagenes: ["public/fotos/image00001.jpeg", "…"]
  }
];
```

Reglas: ver [data-model.md](../data-model.md). Los comentarios del archivo también se publican y
no pueden contener términos prohibidos.

## Salidas del optimizador que dependen de este contrato

| Ruta | Contenido |
|---|---|
| `public/img/<id>/<n>-<ancho>.webp` | Fotos de cada prenda (160, 480, 800, 1200 px) |
| `public/img/portada/<p>-<ancho>.webp` | Fotos de `PORTADA` por posición (480, 800, 1200 px) |
| `public/img/logo-<ancho>.webp` | Logo con transparencia (280, 560 px) |
| `public/img/favicon-48.png`, `public/img/apple-touch-icon.png` | Iconos del sitio |
| `data/fotos-optimizadas.js` | `FOTOS_OPT` con dimensiones |
| `revision-por-modelo.html` | Página local de revisión |
