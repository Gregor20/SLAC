/**
 * ============================================================
 *  CATÁLOGO SLAC — Colección Haute Couture
 * ============================================================
 *  ESTE ARCHIVO ES LA FUENTE ÚNICA DE DATOS:
 *    - CONTACTO → teléfono y WhatsApp. El HTML NO contiene números:
 *                 los elementos con data-contact="..." se rellenan
 *                 desde aquí (ver applyContactoData() en app.js).
 *    - PRENDAS  → catálogo público. Cada prenda = UN modelo con TODAS sus fotos.
 *
 *  estado: "disponible" | "agotado"
 *    - disponible → se muestra y permite consultar por WhatsApp
 *    - agotado    → se muestra con badge y permite consultar "bajo pedido"
 *
 *  nueva: true   → (opcional) la prenda aparece en el filtro "Novedades"
 *                  y lleva el badge "Nueva". Es una ETIQUETA: la prenda
 *                  conserva su categoría (Vestidos, Conjuntos, Noche).
 *
 *  imagenes: array de fotos (la primera es la portada de la tarjeta;
 *            todas se ven en el visor con flechas y miniaturas).
 *
 *  IMPORTANTE: las prendas ocultas NO deben estar en este archivo, porque
 *  cualquiera puede leerlo desde el navegador. Gestiónalas en admin.html:
 *  al exportar, las ocultas se excluyen de este archivo y se guardan solo
 *  en una copia privada (.json) que NO se sube al servidor.
 * ============================================================
 */

const CONTACTO = {
  // TODO: sustituir por los datos reales antes de publicar
  telefono: "+34 600 000 000",     // texto que se muestra
  telefonoRaw: "+34600000000",     // sin espacios, para el enlace tel:
  whatsapp: "34600000000",         // sin + ni espacios, para wa.me/
  mensajeGeneral: "Hola, me gustaría consultar la colección disponible.",
  mensajeBase: "Hola, me gustaría saber si tenéis disponible la prenda: ",
  mensajeBajoPedido: "Hola, me gustaría consultar para encargar bajo pedido la prenda: "
};

/*
 * Reagrupado por modelo (22/10/2026). Los nombres que dicen "nombre pendiente"
 * son provisionales: cámbialos por el nombre real de la prenda.
 */
const PRENDAS = [
  {
    id: "001",
    nombre: "Vestido Aura Dorada",
    categoria: "Noche",
    imagenes: ["public/fotos/image00001.jpeg", "public/fotos/image00002.jpeg", "public/fotos/image00003.jpeg", "public/fotos/image00004.jpeg", "public/fotos/image00005.jpeg"],
    estado: "disponible"
  },
  {
    id: "002",
    nombre: "Conjunto Charol & Marfil",
    categoria: "Conjuntos",
    imagenes: ["public/fotos/image00006.jpeg"],
    estado: "disponible"
  },
  {
    id: "003",
    nombre: "Conjunto Atelier Siena",
    categoria: "Conjuntos",
    imagenes: ["public/fotos/image00007.jpeg", "public/fotos/image00008.jpeg"],
    estado: "disponible"
  },
  {
    id: "004",
    nombre: "Conjunto Fruncido Azabache",
    categoria: "Conjuntos",
    imagenes: ["public/fotos/image00009.png", "public/fotos/image00010.png"],
    estado: "disponible"
  },
  {
    id: "005",
    nombre: "Vestido Silueta Champagne",
    categoria: "Vestidos",
    imagenes: ["public/fotos/image00011.png", "public/fotos/image00012.png", "public/fotos/image00013.png"],
    estado: "disponible"
  },
  {
    id: "006",
    nombre: "Blazer & Falda Rosa Empolvado",
    categoria: "Conjuntos",
    imagenes: ["public/fotos/image00014.png", "public/fotos/image00015.png"],
    estado: "disponible"
  },
  {
    id: "007",
    nombre: "Vestido Midi Carmín Suave",
    categoria: "Vestidos",
    imagenes: ["public/fotos/image00016.jpeg", "public/fotos/image00017.jpeg", "public/fotos/image00018.png"],
    estado: "disponible"
  },
  {
    id: "008",
    nombre: "Minivestido Drapeado Medianoche",
    categoria: "Noche",
    imagenes: ["public/fotos/image00019.png"],
    estado: "disponible"
  },
  {
    id: "009",
    nombre: "Vestido Noche Ébano",
    categoria: "Noche",
    imagenes: ["public/fotos/image00020.png", "public/fotos/image00021.png", "public/fotos/image00022.jpeg"],
    estado: "disponible"
  },
  {
    id: "010",
    nombre: "Conjunto Perla Imperial",
    categoria: "Conjuntos",
    imagenes: ["public/fotos/image00023.png", "public/fotos/image00024.png", "public/fotos/image00026.jpeg"],
    estado: "disponible"
  },
  {
    id: "011",
    nombre: "Vestido Escultura Bronce",
    categoria: "Vestidos",
    nueva: true,
    imagenes: ["public/fotos/image00025.jpeg"],
    estado: "disponible"
  },
  {
    id: "012",
    nombre: "Vestido Gala Platino",
    categoria: "Noche",
    imagenes: ["public/fotos/image00027.jpeg"],
    estado: "disponible"
  },
  {
    id: "013",
    nombre: "Vestido Asimétrico Duna",
    categoria: "Vestidos",
    imagenes: ["public/fotos/image00028.jpeg", "public/fotos/image00029.png"],
    estado: "disponible"
  },
  {
    id: "014",
    nombre: "Mono Encaje Rubí",
    categoria: "Vestidos",
    imagenes: ["public/fotos/image00030.png", "public/fotos/image00031.jpeg"],
    estado: "disponible"
  },
  {
    id: "015",
    nombre: "Conjunto Lino & Seda Sahara",
    categoria: "Conjuntos",
    imagenes: ["public/fotos/image00032.jpeg", "public/fotos/image00033.jpeg", "public/fotos/image00034.png"],
    estado: "disponible"
  },
  {
    id: "016",
    nombre: "Vestido Sirena Cuarzo Rosa",
    categoria: "Noche",
    imagenes: ["public/fotos/image00035.jpeg", "public/fotos/image00036.png", "public/fotos/image00037.png"],
    estado: "disponible"
  },
  {
    id: "017",
    nombre: "Vestido Drapeado Mercurio",   // TODO: unión de los antiguos 013 (Conjunto Dúo Alabastro) y 014; confirma nombre y categoría
    categoria: "Vestidos",
    imagenes: ["public/fotos/image00038.png", "public/fotos/image00039.png", "public/fotos/image00040.jpeg", "public/fotos/image00041.jpeg", "public/fotos/image00042.jpeg"],
    estado: "disponible"
  },
  {
    id: "018",
    nombre: "Vestido Escote Espalda Aurora",   // TODO: unión de los antiguos 015 (Cóctel Melocotón) y 024; confirma nombre
    categoria: "Vestidos",
    nueva: true,
    imagenes: ["public/fotos/image00043.png", "public/fotos/image00044.jpeg", "public/fotos/image00065.jpeg", "public/fotos/image00071.jpeg", "public/fotos/image00072.jpeg", "public/fotos/image00073.jpeg", "public/fotos/image00074.jpeg", "public/fotos/image00075.jpeg"],
    estado: "disponible"
  },
  {
    id: "019",
    nombre: "Mono Hombros Descubiertos Obsidiana",
    categoria: "Vestidos",
    nueva: true,
    imagenes: ["public/fotos/image00045.jpeg"],
    estado: "disponible"
  },
  {
    id: "020",
    nombre: "Conjunto Tul Blanco Riviera",
    categoria: "Conjuntos",
    imagenes: ["public/fotos/image00046.jpeg"],
    estado: "disponible"
  },
  {
    id: "021",
    nombre: "Conjunto Halter Esmeralda",
    categoria: "Conjuntos",
    imagenes: ["public/fotos/image00047.jpeg"],
    estado: "disponible"
  },
  {
    id: "022",
    nombre: "Conjunto Sastrería Ámbar",
    categoria: "Conjuntos",
    imagenes: ["public/fotos/image00048.jpeg", "public/fotos/image00049.jpeg"],
    estado: "disponible"
  },
  {
    id: "023",
    nombre: "Vestido Novia & Noche Marfil Puro",
    categoria: "Noche",
    imagenes: ["public/fotos/image00050.jpeg", "public/fotos/image00051.jpeg", "public/fotos/image00052.png", "public/fotos/image00053.png"],
    estado: "disponible"
  },
  {
    id: "024",
    nombre: "Vestido Estructurado Cacao",   // TODO: unión de los antiguos 018, 019 (Satén Vainilla) y 020 (Sol de Otoño); confirma nombre
    categoria: "Vestidos",
    imagenes: ["public/fotos/image00054.png", "public/fotos/image00055.png", "public/fotos/image00056.png", "public/fotos/image00057.png", "public/fotos/image00058.jpeg", "public/fotos/image00059.jpeg"],
    estado: "disponible"
  },
  {
    id: "025",
    nombre: "Vestido Gala Ópalo Negro",
    categoria: "Noche",
    imagenes: ["public/fotos/image00060.jpeg", "public/fotos/image00061.jpeg", "public/fotos/image00062.jpeg", "public/fotos/image00063.jpeg", "public/fotos/image00064.jpeg", "public/fotos/image00066.jpeg"],
    estado: "disponible"
  },
  {
    id: "026",
    nombre: "Conjunto Capa & Pantalón Moca",
    categoria: "Conjuntos",
    imagenes: ["public/fotos/image00067.jpeg", "public/fotos/image00068.jpeg", "public/fotos/image00069.jpeg", "public/fotos/image00070.jpeg"],
    estado: "disponible"
  }
];
