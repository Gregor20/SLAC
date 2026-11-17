/* ============================================================
   galeria-worker.js — genera worker/src/galeria.generated.js (015)
   El Worker no lee data/galeria.js (es un script del navegador): recibe
   las prendas, su descripción y las dimensiones de sus fotos ya resueltas.
   Solo lleva lo necesario para decidir qué se ve: sin teléfono ni rutas de
   los originales. Las prendas con «Oculta» en el panel local no están en
   data/galeria.js y por tanto nunca llegan aquí (privadas).
   Lo usa scripts/publicar.js. Sin dependencias.
   ============================================================ */

'use strict';

const fs   = require('fs');
const path = require('path');
const { RAIZ, cargarDatos, cargarFotosOpt, imagenesDe } = require('./datos');

const DESTINO = path.join(RAIZ, 'worker', 'src', 'galeria.generated.js');

/** { anchos, anchosAvif, prendas: [{ id, descripcion, fotos: [[ancho, alto]] }], portada: [id] } */
function construirGaleria({ PRENDAS, PORTADA }, opt) {
  if (!opt) throw new Error('falta data/fotos-optimizadas.js (ejecuta npm run optimizar)');
  const prendas = PRENDAS.map(p => {
    const id = String(p.id);
    const fotos = opt.prendas[id];
    if (!Array.isArray(fotos) || fotos.length !== imagenesDe(p).length) {
      throw new Error(`la prenda ${id} no tiene sus fotos optimizadas al día (ejecuta npm run optimizar)`);
    }
    return { id, descripcion: String(p.descripcion ?? ''), fotos: fotos.map(([ancho, alto]) => [ancho, alto]) };
  });
  return { anchos: opt.anchos, anchosAvif: opt.anchosAvif, prendas, portada: PORTADA.map(x => String(x.prenda)) };
}

const contenido = galeria => `// Generado por scripts/publicar.js desde data/galeria.js — NO editar a mano (está en .gitignore).
export const GALERIA = ${JSON.stringify(galeria, null, 2)};
`;

/** Escribe worker/src/galeria.generated.js y devuelve la galería. */
function generarGaleria() {
  const galeria = construirGaleria(cargarDatos(), cargarFotosOpt());
  fs.mkdirSync(path.dirname(DESTINO), { recursive: true });
  fs.writeFileSync(DESTINO, contenido(galeria));
  return galeria;
}

/** data/galeria.js que se publica: contacto y portada; las prendas visibles llegan de /api/prendas.js. */
const contenidoPublico = ({ CONTACTO, PORTADA }) => `// Generado por npm run publicar. Las prendas visibles llegan de /api/prendas.js (Worker).
const CONTACTO = ${JSON.stringify(CONTACTO, null, 2)};

const PORTADA = ${JSON.stringify(PORTADA, null, 2)};

const PRENDAS = [];
`;

module.exports = { construirGaleria, contenido, contenidoPublico, generarGaleria, DESTINO };
