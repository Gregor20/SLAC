#!/usr/bin/env node
/* ============================================================
   optimizar-imagenes.js — SLAC
   ------------------------------------------------------------
   Lee data/galeria.js y genera, sin tocar los originales:
     · public/img/<id>/<n>-<ancho>.webp   (160, 480, 800, 1200 px)
     · public/img/portada/<p>-<ancho>.webp (480, 800, 1200 px) desde PORTADA
     · public/img/logo-*.webp, favicon-48.png, apple-touch-icon.png
     · data/fotos-optimizadas.js (dimensiones que lee la web)
     · revision-por-modelo.html (revisión local, avisa de repetidas)
   Uso:  npm run optimizar          (solo lo nuevo o cambiado)
         npm run optimizar:forzar   (rehace todo)
   ============================================================ */

'use strict';

const fs   = require('fs');
const path = require('path');

let sharp;
try {
  sharp = require('sharp');
} catch {
  console.error('\n✗ Falta la librería "sharp". Ejecuta primero:  npm install\n');
  process.exit(1);
}

const { RAIZ, cargarDatos, imagenesDe, rutaAbsoluta } = require('./datos');
const extra = require('./imagenes-extra');

const SALIDA     = path.join(RAIZ, 'public', 'img');
const CACHE      = path.join(SALIDA, '.cache.json');
const ANCHOS     = [160, 480, 800, 1200];
const ANCHOS_POR = [480, 800, 1200];
const CALIDAD    = { 160: 68, 480: 74, 800: 76, 1200: 76 };
const FORZAR     = process.argv.includes('--forzar');
const UMBRAL_DUP = 5;
const EXT_IMG    = /\.(jpe?g|png|webp|avif|tiff?)$/i;
const mb = bytes => (bytes / 1048576).toFixed(1) + ' MB';

function leerJSON(ruta, defecto) {
  try { return JSON.parse(fs.readFileSync(ruta, 'utf8')); } catch { return defecto; }
}

/** Genera las versiones de una foto si no están al día. Devuelve { dims: [ancho, alto], nueva }. */
async function versiones(origen, base, anchos, previa, cache, clave) {
  const st = fs.statSync(origen);
  const firma = `${path.relative(RAIZ, origen)}|${st.size}|${Math.round(st.mtimeMs)}|${anchos.join(',')}`;
  const salidas = anchos.map(w => `${base}-${w}.webp`);
  const antes = previa[clave];

  if (antes && antes.firma === firma && Array.isArray(antes.dims) && salidas.every(f => fs.existsSync(f))) {
    cache[clave] = antes;
    return { dims: antes.dims, nueva: false };
  }
  const img = sharp(origen).rotate();                  // respeta la orientación EXIF
  const infos = await Promise.all(anchos.map((w, i) => img.clone()
    .resize({ width: w, withoutEnlargement: true })
    .webp({ quality: CALIDAD[w] || 76, effort: 6, smartSubsample: true })
    .toFile(salidas[i])));
  const mayor = infos[infos.length - 1];
  cache[clave] = { firma, dims: [mayor.width, mayor.height] };
  return { dims: cache[clave].dims, nueva: true };
}

/** Borra lo generado que ya no corresponde a ninguna prenda o posición de portada. */
function podar(manifiesto, nPortada) {
  const podadas = [];
  for (const e of fs.readdirSync(SALIDA, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const dir = path.join(SALIDA, e.name);
    const archivos = fs.readdirSync(dir);
    if (!archivos.every(f => /^\d+-\d+\.webp$/.test(f))) continue;   // solo carpetas creadas por este script
    const maximo = e.name === 'portada' ? nPortada : (manifiesto[e.name] || []).length;
    if (maximo === 0 && e.name !== 'portada') {
      fs.rmSync(dir, { recursive: true, force: true });
      podadas.push(e.name);
      continue;
    }
    const anchos = e.name === 'portada' ? ANCHOS_POR : ANCHOS;
    for (const f of archivos) {
      const [, n, w] = /^(\d+)-(\d+)\.webp$/.exec(f).map(Number);
      if (n > maximo || !anchos.includes(w)) fs.rmSync(path.join(dir, f));
    }
  }
  return podadas;
}

function escribirManifiesto(manifiesto) {
  const filas = Object.entries(manifiesto).map(([id, d]) => `    "${id}": ${JSON.stringify(d)}`).join(',\n');
  fs.writeFileSync(path.join(RAIZ, 'data', 'fotos-optimizadas.js'),
`/**
 * Generado por scripts/optimizar-imagenes.js — NO editar a mano.
 * prendas[id] = [ancho, alto] de cada foto en public/img/<id>/<n>-<ancho>.webp
 */
const FOTOS_OPT = {
  anchos: [${ANCHOS.join(', ')}],
  prendas: {
${filas}
  }
};
`);
}

async function main() {
  const t0 = Date.now();
  const { PRENDAS, PORTADA } = cargarDatos();
  fs.mkdirSync(path.join(SALIDA, 'portada'), { recursive: true });
  const previa = FORZAR ? {} : leerJSON(CACHE, {});
  const cache = {};
  const manifiesto = {}, fotos = [], avisos = [], portada = [];
  let bytesOrigen = 0, bytes800 = 0, nuevas = 0;

  console.log(`\nSLAC · optimizando las fotos de ${PRENDAS.length} prendas...\n`);
  for (const p of PRENDAS) {
    const id = String(p.id);
    fs.mkdirSync(path.join(SALIDA, id), { recursive: true });
    const dims = [];
    process.stdout.write(`  ${id}  `);
    for (const rel of imagenesDe(p)) {
      const origen = rutaAbsoluta(rel);
      if (!fs.existsSync(origen)) { avisos.push(`[${id}] NO EXISTE el archivo: ${rel}`); process.stdout.write('?'); continue; }
      const n = dims.length + 1;
      const r = await versiones(origen, path.join(SALIDA, id, String(n)), ANCHOS, previa, cache, `${id}/${n}`);
      dims.push(r.dims);
      if (r.nueva) nuevas++;
      bytesOrigen += fs.statSync(origen).size;
      bytes800 += fs.statSync(path.join(SALIDA, id, `${n}-800.webp`)).size;
      fotos.push({ id, n, rel, huella: await extra.huella(sharp, origen) });
      process.stdout.write(r.nueva ? '+' : '·');
    }
    if (dims.length) manifiesto[id] = dims;
    process.stdout.write('\n');
  }

  for (const [k, e] of (PORTADA || []).entries()) {
    const p = PRENDAS.find(x => String(x.id) === String(e.prenda));
    const rel = p && imagenesDe(p)[e.foto - 1];
    if (!rel || !fs.existsSync(rutaAbsoluta(rel))) { avisos.push(`[portada ${k + 1}] foto no válida: prenda ${e.prenda}, foto ${e.foto}`); continue; }
    const r = await versiones(rutaAbsoluta(rel), path.join(SALIDA, 'portada', String(k + 1)), ANCHOS_POR, previa, cache, `portada/${k + 1}`);
    portada.push({ pos: k + 1, prenda: p.id, foto: e.foto, dims: r.dims });
  }

  const logo = path.join(RAIZ, 'public', 'fotos', 'logo.jpeg');
  const logoNuevo = fs.existsSync(logo) ? await extra.generarLogo(sharp, logo, SALIDA, FORZAR) : (avisos.push('No existe public/fotos/logo.jpeg'), false);

  const podadas = podar(manifiesto, portada.length);
  fs.writeFileSync(CACHE, JSON.stringify(cache, null, 1));
  escribirManifiesto(manifiesto);

  /* Repetidas y fotos sin usar */
  const repetidas = [];
  for (let i = 0; i < fotos.length; i++) {
    for (let j = i + 1; j < fotos.length; j++) {
      if (extra.distancia(fotos[i].huella, fotos[j].huella) <= UMBRAL_DUP) repetidas.push({ a: fotos[i], b: fotos[j] });
    }
  }
  const marcadas = new Map();
  for (const { a, b } of repetidas) {
    const ka = `${a.id}/${a.n}`, kb = `${b.id}/${b.n}`;
    marcadas.set(ka, [...(marcadas.get(ka) || []), `${b.id} #${b.n}`]);
    marcadas.set(kb, [...(marcadas.get(kb) || []), `${a.id} #${a.n}`]);
  }
  const usadas = new Set(PRENDAS.flatMap(p => imagenesDe(p).map(r => path.basename(r).toLowerCase())));
  const dirFotos = path.join(RAIZ, 'public', 'fotos');
  const huerfanas = fs.existsSync(dirFotos)
    ? fs.readdirSync(dirFotos).filter(f => EXT_IMG.test(f) && !usadas.has(f.toLowerCase()) && !/^logo\./i.test(f))
    : [];

  fs.writeFileSync(path.join(RAIZ, 'revision-por-modelo.html'),
    extra.paginaRevision({ prendas: PRENDAS, manifiesto, marcadas, avisos, huerfanas, portada }));

  /* Resumen */
  const ahorro = bytesOrigen ? Math.round((1 - bytes800 / bytesOrigen) * 100) : 0;
  console.log('\n────────────────────────────────────────────────────────');
  console.log(` Fotos procesadas : ${fotos.length}  (${nuevas} nuevas o cambiadas)`);
  console.log(` Portada          : ${portada.length} fotos · logo y favicon ${logoNuevo ? 'regenerados' : 'al día'}`);
  console.log(` Originales       : ${mb(bytesOrigen)}`);
  console.log(` Versión 800 px   : ${mb(bytes800)}   → ahorro aprox. ${ahorro}% por foto vista`);
  if (podadas.length) console.log(` Carpetas retiradas de public/img: ${podadas.join(', ')}`);
  if (avisos.length) { console.log(`\n ⚠ AVISOS (${avisos.length}):`); avisos.forEach(a => console.log('   - ' + a)); }
  if (repetidas.length) {
    console.log(`\n ⚠ POSIBLES FOTOS REPETIDAS (${repetidas.length}):`);
    repetidas.forEach(({ a, b }) => console.log(`   - ${a.id} #${a.n} (${path.basename(a.rel)})  ≈  ${b.id} #${b.n} (${path.basename(b.rel)})`));
  }
  if (huerfanas.length) console.log(`\n ℹ ${huerfanas.length} foto(s) de public/fotos no se usan (ver revision-por-modelo.html)`);
  console.log(`\n ✓ Listo en ${((Date.now() - t0) / 1000).toFixed(1)} s.  Revisa: revision-por-modelo.html\n`);
}

main().catch(err => { console.error('\n✗ Error:', err.message, '\n'); process.exit(1); });
