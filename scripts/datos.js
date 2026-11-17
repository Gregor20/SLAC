/* ============================================================
   datos.js — lectura de data/galeria.js y data/fotos-optimizadas.js
   para las herramientas de Node (optimizar, verificar).
   Los archivos de datos son scripts clásicos del navegador: se
   evalúan en un contexto aislado con vm.
   ============================================================ */

'use strict';

const fs   = require('fs');
const path = require('path');
const vm   = require('vm');

const RAIZ = path.resolve(__dirname, '..');
const RUTA_DATOS = path.join(RAIZ, 'data', 'galeria.js');
const RUTA_OPT   = path.join(RAIZ, 'data', 'fotos-optimizadas.js');

/** { CONTACTO, PORTADA, PRENDAS } tal como los ve la web. */
function cargarDatos() {
  const codigo = fs.readFileSync(RUTA_DATOS, 'utf8');
  return vm.runInNewContext(`${codigo}\n;({ CONTACTO, PORTADA, PRENDAS })`, {}, { filename: RUTA_DATOS });
}

/** FOTOS_OPT o null si el archivo no existe o no se puede leer. */
function cargarFotosOpt() {
  if (!fs.existsSync(RUTA_OPT)) return null;
  const codigo = fs.readFileSync(RUTA_OPT, 'utf8');
  return vm.runInNewContext(`${codigo}\n;FOTOS_OPT`, {}, { filename: RUTA_OPT });
}

const imagenesDe = p => (Array.isArray(p.imagenes) ? p.imagenes : []);

/** Número visible de la prenda: su id sin ceros a la izquierda; "" si no son 1 a 4 cifras (misma regla que lib.js). */
const numeroPrenda = p => (/^\d{1,4}$/.test(String(p.id)) ? String(Number(p.id)) : '');

/** Ruta relativa del proyecto ("public/fotos/x.jpg") → ruta absoluta del sistema. */
const rutaAbsoluta = rel => path.join(RAIZ, ...String(rel).split('/'));

module.exports = { RAIZ, cargarDatos, cargarFotosOpt, imagenesDe, numeroPrenda, rutaAbsoluta };
