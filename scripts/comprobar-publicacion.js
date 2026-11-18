/* ============================================================
   comprobar-publicacion.js — comprobaciones de la publicación del Worker (015)
   · comprobarWrangler(): el despliegue es SIEMPRE explícito (ADR 010): existe wrangler.jsonc, sirve
     solo ./dist y no quedan marcadores `__…__` de la plantilla.
   · comprobarDist(): dist/ no filtra nada de las prendas (FR-005): ni sus fotos ni sus datos.
   Las usan scripts/publicar.js y scripts/verificar.js. Sin dependencias.
   ============================================================ */

'use strict';

const fs   = require('fs');
const path = require('path');
const { RAIZ } = require('./datos');

const RUTA_WRANGLER = path.join(RAIZ, 'wrangler.jsonc');
const DIST = path.join(RAIZ, 'dist');

/** Quita los comentarios de línea y de bloque de un JSONC sin tocar el texto de las cadenas. */
function quitarComentarios(texto) {
  let salida = '', cadena = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i], siguiente = texto[i + 1];
    if (cadena) {
      salida += c;
      if (c === '\\') salida += texto[++i];
      else if (c === '"') cadena = false;
    } else if (c === '"') { cadena = true; salida += c; }
    else if (c === '/' && siguiente === '/') { while (i < texto.length && texto[i] !== '\n') i++; salida += '\n'; }
    else if (c === '/' && siguiente === '*') { i = texto.indexOf('*/', i + 2); if (i < 0) break; i++; }
    else salida += c;
  }
  return salida;
}

/** Errores de wrangler.jsonc (lista vacía = correcto) y su configuración leída. */
function comprobarWrangler(ruta = RUTA_WRANGLER) {
  if (!fs.existsSync(ruta)) {
    return { errores: ['falta wrangler.jsonc: copia wrangler.ejemplo.jsonc a wrangler.jsonc y rellena tus datos (specs/015-panel-admin-online/contracts/despliegue.md)'], config: null };
  }
  const texto = fs.readFileSync(ruta, 'utf8');
  let config;
  try { config = JSON.parse(quitarComentarios(texto).replace(/,(\s*[}\]])/g, '$1')); }
  catch (e) { return { errores: [`wrangler.jsonc no se puede leer: ${e.message}`], config: null }; }

  const errores = [];
  if (config.assets?.directory !== './dist') errores.push('wrangler.jsonc: assets.directory debe ser "./dist" (nunca la carpeta del proyecto)');
  if (config.main !== 'worker/src/index.js') errores.push('wrangler.jsonc: main debe ser "worker/src/index.js"');
  if (config.workers_dev !== false) errores.push('wrangler.jsonc: workers_dev debe ser false (el panel solo debe llegar por el dominio propio)');
  if (!config.vars?.HOST_PERMITIDO) errores.push('wrangler.jsonc: falta vars.HOST_PERMITIDO');
  const marcadores = texto.match(/__[A-Z0-9_]+__/g);
  if (marcadores) errores.push(`wrangler.jsonc: quedan marcadores sin rellenar (${[...new Set(marcadores)].join(', ')})`);
  return { errores, config };
}

/** Errores de dist/: nada de las prendas fuera del Worker. Si dist/ no existe, no hay nada que comprobar. */
function comprobarDist(dist = DIST) {
  if (!fs.existsSync(dist)) return [];
  const errores = [];
  const img = path.join(dist, 'public', 'img');
  if (fs.existsSync(img)) {
    for (const e of fs.readdirSync(img, { withFileTypes: true })) {
      if (e.isDirectory() && !['portada', 'slac'].includes(e.name)) errores.push(`dist/public/img/${e.name}/ no debe publicarse (las fotos de prendas salen del Worker)`);
    }
  }
  const datos = path.join(dist, 'data');
  if (fs.existsSync(path.join(datos, 'fotos-optimizadas.js'))) errores.push('dist/data/fotos-optimizadas.js no debe publicarse (lo genera /api/prendas.js)');
  const galeria = path.join(datos, 'galeria.js');
  if (fs.existsSync(galeria)) {
    const texto = fs.readFileSync(galeria, 'utf8');
    if (!/const PRENDAS = \[\];/.test(texto) || /descripcion|imagenes/.test(texto)) errores.push('dist/data/galeria.js lleva datos de prendas: debe declarar solo `const PRENDAS = [];`');
  }
  return errores;
}

module.exports = { comprobarWrangler, comprobarDist, quitarComentarios };
