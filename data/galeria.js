/**
 * ============================================================
 *  SLAC — datos de la galería (fuente única)
 * ============================================================
 *  CONTACTO  número de teléfono. El HTML no lo lleva escrito: los
 *            elementos con data-contact="tel | tel-texto | wa" se
 *            rellenan desde aquí (app.js). WhatsApp se abre sin texto.
 *
 *  PORTADA   fotos de la primera pantalla y del bloque final, por
 *            posición: 1 principal (móvil y centro), 2 izquierda,
 *            3 derecha, 4 fondo del contacto. { prenda: id, foto: n }
 *            (n empieza en 1). Tras cambiarla: npm run optimizar.
 *
 *  PRENDAS   una entrada por prenda con TODAS sus fotos.
 *    id           identificador interno (no se muestra); nombra la
 *                 carpeta public/img/<id>/
 *    descripcion  texto neutro (tipo, color, detalle) que leen los
 *                 lectores de pantalla y los buscadores
 *    imagenes     fotos en orden; la primera abre la galería
 *
 *  Este archivo es público: no pongas aquí nada que no deba verse.
 * ============================================================
 */

const CONTACTO = {
  // PENDIENTE: número real
  telefono: "+34 600 000 000",     // como se muestra
  telefonoRaw: "+34600000000",     // sin espacios, para tel:
  whatsapp: "34600000000"          // sin + ni espacios, para wa.me/
};

const PORTADA = [
  { prenda: "026", foto: 1 },
  { prenda: "025", foto: 2 },
  { prenda: "021", foto: 1 },
  { prenda: "001", foto: 1 }
];

const PRENDAS = [
  {
    id: "001",
    descripcion: "Mono largo de cuello halter con la espalda descubierta, en rojo y en negro",
    imagenes: [
      "public/fotos/image00001.jpeg",
      "public/fotos/image00002.jpeg",
      "public/fotos/image00003.jpeg",
      "public/fotos/image00004.jpeg",
      "public/fotos/image00005.jpeg"
    ]
  },
  {
    id: "002",
    descripcion: "Conjunto de top blanco cruzado de manga larga y pantalón negro acampanado efecto piel",
    imagenes: [
      "public/fotos/image00006.jpeg"
    ]
  },
  {
    id: "003",
    descripcion: "Mono de cuello halter con escote drapeado y pernera acampanada, en negro y en rojo",
    imagenes: [
      "public/fotos/image00007.jpeg",
      "public/fotos/image00008.jpeg"
    ]
  },
  {
    id: "004",
    descripcion: "Conjunto de top corto con hombreras y pantalón acampanado de talle alto, en negro y en blanco",
    imagenes: [
      "public/fotos/image00009.png",
      "public/fotos/image00010.png"
    ]
  },
  {
    id: "005",
    descripcion: "Mono de escote cruzado profundo con cinturón y pantalón acampanado, en negro, rojo y blanco",
    imagenes: [
      "public/fotos/image00011.png",
      "public/fotos/image00012.png",
      "public/fotos/image00013.png"
    ]
  },
  {
    id: "006",
    descripcion: "Mono de cuello halter con escote profundo y pantalón acampanado, en negro y en rojo",
    imagenes: [
      "public/fotos/image00014.png",
      "public/fotos/image00015.png"
    ]
  },
  {
    id: "007",
    descripcion: "Mono de cuello alto con la espalda descubierta y pantalón acampanado, en rojo y en negro",
    imagenes: [
      "public/fotos/image00016.jpeg",
      "public/fotos/image00017.jpeg",
      "public/fotos/image00018.png"
    ]
  },
  {
    id: "008",
    descripcion: "Minivestido negro drapeado de manga larga con escote profundo",
    imagenes: [
      "public/fotos/image00019.png"
    ]
  },
  {
    id: "009",
    descripcion: "Minivestido fruncido de manga larga con escote drapeado, en granate, negro y blanco",
    imagenes: [
      "public/fotos/image00020.png",
      "public/fotos/image00021.png",
      "public/fotos/image00022.jpeg"
    ]
  },
  {
    id: "010",
    descripcion: "Mono de cuello halter drapeado con pantalón acampanado, en negro, marrón y rojo",
    imagenes: [
      "public/fotos/image00023.png",
      "public/fotos/image00024.png",
      "public/fotos/image00026.jpeg"
    ]
  },
  {
    id: "011",
    descripcion: "Mono negro asimétrico de un hombro con manga de encaje y abertura en la cintura",
    imagenes: [
      "public/fotos/image00025.jpeg"
    ]
  },
  {
    id: "012",
    descripcion: "Mono negro de escote drapeado con perneras acampanadas de transparencia",
    imagenes: [
      "public/fotos/image00027.jpeg"
    ]
  },
  {
    id: "013",
    descripcion: "Mono de hombros descubiertos con escote en pico y pantalón acampanado, en marrón y en negro",
    imagenes: [
      "public/fotos/image00028.jpeg",
      "public/fotos/image00029.png"
    ]
  },
  {
    id: "014",
    descripcion: "Mono de encaje de manga larga con pantalón acampanado, en rojo y en negro",
    imagenes: [
      "public/fotos/image00030.png",
      "public/fotos/image00031.jpeg"
    ]
  },
  {
    id: "015",
    descripcion: "Mono de tirantes con perneras de tul transparente, en blanco y en negro",
    imagenes: [
      "public/fotos/image00032.jpeg",
      "public/fotos/image00033.jpeg",
      "public/fotos/image00034.png"
    ]
  },
  {
    id: "016",
    descripcion: "Mono de manga larga con aberturas en la cintura y pantalón acampanado, en negro, rojo y blanco",
    imagenes: [
      "public/fotos/image00035.jpeg",
      "public/fotos/image00036.png",
      "public/fotos/image00037.png"
    ]
  },
  {
    id: "017",
    descripcion: "Mono de manga larga con escote profundo y pantalón acampanado, en rojo, blanco y negro",
    imagenes: [
      "public/fotos/image00038.png",
      "public/fotos/image00039.png",
      "public/fotos/image00040.jpeg",
      "public/fotos/image00041.jpeg",
      "public/fotos/image00042.jpeg"
    ]
  },
  {
    id: "018",
    descripcion: "Vestido largo de sirena con cuello halter y fruncido lateral, en rosa, verde y blanco",
    imagenes: [
      "public/fotos/image00043.png",
      "public/fotos/image00044.jpeg",
      "public/fotos/image00065.jpeg",
      "public/fotos/image00071.jpeg",
      "public/fotos/image00072.jpeg",
      "public/fotos/image00073.jpeg",
      "public/fotos/image00074.jpeg",
      "public/fotos/image00075.jpeg"
    ]
  },
  {
    id: "019",
    descripcion: "Mono negro de hombros descubiertos con cuerpo de transparencia y pantalón acampanado",
    imagenes: [
      "public/fotos/image00045.jpeg"
    ]
  },
  {
    id: "020",
    descripcion: "Conjunto blanco de top corto con mangas amplias y minifalda",
    imagenes: [
      "public/fotos/image00046.jpeg"
    ]
  },
  {
    id: "021",
    descripcion: "Vestido largo verde de sirena con cuello halter cruzado y aberturas en la cintura",
    imagenes: [
      "public/fotos/image00047.jpeg"
    ]
  },
  {
    id: "022",
    descripcion: "Mono negro de cuello halter con la espalda descubierta y pantalón ancho",
    imagenes: [
      "public/fotos/image00048.jpeg",
      "public/fotos/image00049.jpeg"
    ]
  },
  {
    id: "023",
    descripcion: "Conjunto de top de hombros descubiertos con aro y falda larga, en blanco, negro y granate",
    imagenes: [
      "public/fotos/image00050.jpeg",
      "public/fotos/image00051.jpeg",
      "public/fotos/image00052.png",
      "public/fotos/image00053.png"
    ]
  },
  {
    id: "024",
    descripcion: "Conjunto de top corto con mangas amplias y minifalda fruncida, en negro, blanco y amarillo",
    imagenes: [
      "public/fotos/image00054.png",
      "public/fotos/image00055.png",
      "public/fotos/image00056.png",
      "public/fotos/image00057.png",
      "public/fotos/image00058.jpeg",
      "public/fotos/image00059.jpeg"
    ]
  },
  {
    id: "025",
    descripcion: "Mono de manga larga con cuerpo de encaje y pantalón acampanado, en negro y en blanco",
    imagenes: [
      "public/fotos/image00060.jpeg",
      "public/fotos/image00061.jpeg",
      "public/fotos/image00062.jpeg",
      "public/fotos/image00063.jpeg",
      "public/fotos/image00064.jpeg",
      "public/fotos/image00066.jpeg"
    ]
  },
  {
    id: "026",
    descripcion: "Mono palabra de honor de pernera ancha con lazo en la espalda, en marrón y en blanco",
    imagenes: [
      "public/fotos/image00067.jpeg",
      "public/fotos/image00068.jpeg",
      "public/fotos/image00069.jpeg",
      "public/fotos/image00070.jpeg"
    ]
  }
];
