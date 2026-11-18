/* ============================================================
   comprobar-worker.js — comprobaciones del Worker y del panel online (015)
   · Sintaxis: los módulos ES de worker/ con `node --check` (worker/package.json los declara módulos;
     `vm.Script` falla con `export`) y los scripts clásicos de panel/ con vm.
   · Tamaño: ≤ 200 líneas por archivo (constitución VI).
   Lo usa scripts/verificar.js. Devuelve una lista de errores. Sin dependencias.
   ============================================================ */

'use strict';

const fs   = require('fs');
const path = require('path');
const vm   = require('vm');
const { spawnSync } = require('child_process');
const { RAIZ } = require('./datos');

const LIMITE_LINEAS = 200;
const GENERADOS = ['worker/src/galeria.generated.js'];   // los escribe `npm run publicar`; no se revisan a mano

/** Archivos .js de una carpeta (no recursivo) como rutas relativas con `/`. */
function jsDe(carpeta) {
  const dir = path.join(RAIZ, ...carpeta.split('/'));
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(n => n.endsWith('.js')).map(n => `${carpeta}/${n}`).filter(f => !GENERADOS.includes(f));
}

function comprobarWorker() {
  const errores = [];
  const modulos = ['worker/src', 'worker/test', 'worker/test-ayudas'].flatMap(jsDe);
  const clasicos = jsDe('panel');

  for (const f of [...modulos, ...clasicos]) {
    const texto = fs.readFileSync(path.join(RAIZ, f), 'utf8');
    const lineas = texto.split('\n').length - 1;
    if (lineas > LIMITE_LINEAS) errores.push(`${f}: ${lineas} líneas (máximo ${LIMITE_LINEAS})`);
    if (clasicos.includes(f)) {
      try { new vm.Script(texto, { filename: f }); } catch (e) { errores.push(`${f}: ${e.message}`); }
    } else {
      const r = spawnSync(process.execPath, ['--check', path.join(RAIZ, f)], { encoding: 'utf8' });
      if (r.status !== 0) errores.push(`${f}: ${(r.stderr || '').split('\n').find(l => /Error/.test(l)) || 'sintaxis no válida'}`);
    }
  }
  return errores;
}

module.exports = { comprobarWorker };
