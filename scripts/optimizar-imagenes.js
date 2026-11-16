#!/usr/bin/env node
/* ============================================================
   optimizar-imagenes.js — SLAC
   ------------------------------------------------------------
   Lee data/catalogo.js y, para cada prenda PUBLICADA (no oculta):
     · genera versiones WebP optimizadas (160, 480, 800 y 1200 px de ancho)
       en  public/img/<id>/<n>-<ancho>.webp   (una carpeta por modelo)
     · detecta fotos repetidas (entre modelos y dentro de un mismo modelo)
     · escribe data/fotos-optimizadas.js (lo que lee la web)
     · crea revision-por-modelo.html para comprobar a ojo cada grupo
   Los originales NO se tocan. Uso:
     npm run optimizar            (incremental: solo lo nuevo o cambiado)
     npm run optimizar:forzar     (rehace todo)
   ============================================================ */

'use strict';

const fs   = require('fs');
const path = require('path');
const vm   = require('vm');

let sharp;
try {
  sharp = require('sharp');
} catch {
  console.error('\n✗ Falta la librería "sharp". Ejecuta primero:  npm install\n');
  process.exit(1);
}

/* ── Configuración ───────────────────────────────────────── */
const RAIZ      = path.resolve(__dirname, '..');
const SALIDA    = path.join(RAIZ, 'public', 'img');
const CACHE     = path.join(SALIDA, '.cache.json');
const ANCHOS    = [160, 480, 800, 1200];                    // px
const CALIDAD   = { 160: 68, 480: 74, 800: 76, 1200: 76 };  // WebP 0-100
const FORZAR    = process.argv.includes('--forzar');
const UMBRAL_DUP = 5;                                       // distancia máx. entre "huellas" para avisar de repetida
const EXT_IMG   = /\.(jpe?g|png|webp|avif|tiff?)$/i;

/* ── Utilidades ──────────────────────────────────────────── */
const mb  = bytes => (bytes / 1048576).toFixed(1) + ' MB';
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function cargarCatalogo() {
  const ruta = path.join(RAIZ, 'data', 'catalogo.js');
  const codigo = fs.readFileSync(ruta, 'utf8');
  // catalogo.js declara "const PRENDAS / CONTACTO": se evalúa en un contexto aislado
  return vm.runInNewContext(`${codigo}\n;({ CONTACTO, PRENDAS })`, {}, { filename: ruta });
}

function imagenesDe(p) {
  if (Array.isArray(p.imagenes) && p.imagenes.length) return p.imagenes;
  return p.imagen ? [p.imagen] : [];
}

/** "Huella" de 64 bits (dHash): dos fotos casi idénticas tienen huellas casi iguales. */
async function huella(ruta) {
  const px = await sharp(ruta).rotate().greyscale().resize(9, 8, { fit: 'fill' }).raw().toBuffer();
  let bits = '';
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) bits += px[y * 9 + x] > px[y * 9 + x + 1] ? '1' : '0';
  }
  return bits;
}

function distancia(a, b) {
  let d = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++;
  return d;
}

function leerJSON(ruta, defecto) {
  try { return JSON.parse(fs.readFileSync(ruta, 'utf8')); } catch { return defecto; }
}

/* ── Principal ───────────────────────────────────────────── */
async function main() {
  const t0 = Date.now();
  const { PRENDAS } = cargarCatalogo();
  const publicas = PRENDAS.filter(p => p.estado !== 'oculto');
  const ocultas  = PRENDAS.length - publicas.length;

  fs.mkdirSync(SALIDA, { recursive: true });
  const cache = FORZAR ? {} : leerJSON(CACHE, {});

  const manifiesto = {};   // id -> nº de fotos publicadas
  const fotos      = [];   // { id, n, rel, huella }
  const avisos     = [];
  let bytesOrigen = 0, bytesTotal = 0, bytes800 = 0, nuevas = 0, intactas = 0;

  console.log(`\nSLAC · optimizando imágenes de ${publicas.length} prendas${ocultas ? ` (${ocultas} ocultas: se ignoran)` : ''}...\n`);

  for (const p of publicas) {
    const id  = String(p.id);
    const dir = path.join(SALIDA, id);
    fs.mkdirSync(dir, { recursive: true });
    let n = 0;
    process.stdout.write(`  ${id}  ${String(p.nombre).slice(0, 34).padEnd(34)} `);

    for (const rel of imagenesDe(p)) {
      if (/^https?:/i.test(rel)) { avisos.push(`[${id}] URL externa, no se optimiza: ${rel}`); continue; }
      const origen = path.join(RAIZ, ...rel.split('/'));
      if (!fs.existsSync(origen)) { avisos.push(`[${id}] NO EXISTE el archivo: ${rel}`); process.stdout.write('?'); continue; }

      n++;
      const st = fs.statSync(origen);
      bytesOrigen += st.size;
      const firma = `${rel}|${st.size}|${Math.round(st.mtimeMs)}`;
      const clave = `${id}/${n}`;
      const salidas = ANCHOS.map(w => path.join(dir, `${n}-${w}.webp`));
      const alDia = cache[clave] === firma && salidas.every(f => fs.existsSync(f));

      if (!alDia) {
        const base = sharp(origen).rotate();            // respeta la orientación EXIF
        await Promise.all(ANCHOS.map((w, i) =>
          base.clone()
            .resize({ width: w, withoutEnlargement: true })
            .webp({ quality: CALIDAD[w], effort: 6, smartSubsample: true })
            .toFile(salidas[i])
        ));
        cache[clave] = firma;
        nuevas++;
        process.stdout.write('+');
      } else {
        intactas++;
        process.stdout.write('·');
      }

      salidas.forEach((f, i) => {
        const size = fs.statSync(f).size;
        bytesTotal += size;
        if (ANCHOS[i] === 800) bytes800 += size;
      });

      fotos.push({ id, n, rel, huella: await huella(origen) });
    }

    if (n > 0) manifiesto[id] = n;
    process.stdout.write('\n');
  }

  /* Limpieza: lo que ya no está en el catálogo público NO debe seguir en public/img */
  const podadas = [];
  for (const entrada of fs.readdirSync(SALIDA, { withFileTypes: true })) {
    if (!entrada.isDirectory()) continue;
    const dir = path.join(SALIDA, entrada.name);
    const archivos = fs.readdirSync(dir);
    const generada = archivos.every(f => /^\d+-\d+\.webp$/.test(f));   // solo borra carpetas creadas por este script
    if (!generada) continue;

    if (!(entrada.name in manifiesto)) {
      fs.rmSync(dir, { recursive: true, force: true });
      podadas.push(entrada.name);
      continue;
    }
    for (const f of archivos) {
      const m = /^(\d+)-(\d+)\.webp$/.exec(f);
      if (Number(m[1]) > manifiesto[entrada.name] || !ANCHOS.includes(Number(m[2]))) fs.rmSync(path.join(dir, f));
    }
  }
  for (const clave of Object.keys(cache)) {
    const [id, n] = clave.split('/');
    if (!(id in manifiesto) || Number(n) > manifiesto[id]) delete cache[clave];
  }
  fs.writeFileSync(CACHE, JSON.stringify(cache, null, 1));

  /* Repetidas */
  const repetidas = [];
  for (let i = 0; i < fotos.length; i++) {
    for (let j = i + 1; j < fotos.length; j++) {
      const d = distancia(fotos[i].huella, fotos[j].huella);
      if (d <= UMBRAL_DUP) repetidas.push({ a: fotos[i], b: fotos[j], d });
    }
  }
  const marcadas = new Map();   // "id/n" -> texto con sus parecidas
  for (const { a, b } of repetidas) {
    const ka = `${a.id}/${a.n}`, kb = `${b.id}/${b.n}`;
    marcadas.set(ka, [...(marcadas.get(ka) || []), `${b.id} #${b.n}`]);
    marcadas.set(kb, [...(marcadas.get(kb) || []), `${a.id} #${a.n}`]);
  }

  /* Fotos en disco que no usa ninguna prenda */
  const usadas = new Set();
  PRENDAS.forEach(p => imagenesDe(p).forEach(r => usadas.add(path.basename(r).toLowerCase())));
  const dirFotos = path.join(RAIZ, 'public', 'fotos');
  const huerfanas = fs.existsSync(dirFotos)
    ? fs.readdirSync(dirFotos).filter(f => EXT_IMG.test(f) && !usadas.has(f.toLowerCase()) && !/^logo\./i.test(f))
    : [];

  /* data/fotos-optimizadas.js */
  const filas = Object.entries(manifiesto).map(([id, n]) => `    "${id}": ${n}`).join(',\n');
  fs.writeFileSync(path.join(RAIZ, 'data', 'fotos-optimizadas.js'),
`/**
 * Generado automáticamente por scripts/optimizar-imagenes.js — NO editar a mano.
 * prendas[id] = nº de fotos optimizadas en public/img/<id>/<n>-<ancho>.webp
 */
const FOTOS_OPT = {
  anchos: [${ANCHOS.join(', ')}],
  prendas: {
${filas}
  }
};
`);

  /* revision-por-modelo.html */
  const secciones = publicas.map(p => {
    const id = String(p.id);
    const n = manifiesto[id] || 0;
    const existentes = imagenesDe(p).filter(r => !/^https?:/i.test(r) && fs.existsSync(path.join(RAIZ, ...r.split('/'))));
    const figs = Array.from({ length: n }, (_, i) => {
      const dup = marcadas.get(`${id}/${i + 1}`);
      return `<figure class="${dup ? 'dup' : ''}">
        <img src="public/img/${esc(id)}/${i + 1}-480.webp" alt="" loading="lazy">
        <figcaption>#${i + 1} · ${esc(path.basename(existentes[i] || ''))}${dup ? `<br><b>⚠ Parecida a: ${esc([...new Set(dup)].join(', '))}</b>` : ''}</figcaption>
      </figure>`;
    }).join('');
    return `<section><h2>${esc(id)} · ${esc(p.nombre)} <small>${esc(p.categoria)}${p.nueva ? ' · nueva' : ''} · ${n} foto${n === 1 ? '' : 's'}</small></h2><div class="fila">${figs}</div></section>`;
  }).join('\n');

  fs.writeFileSync(path.join(RAIZ, 'revision-por-modelo.html'), `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>Revisión por modelo — SLAC</title>
<style>
  body{margin:0;padding:24px;background:#0b0b0b;color:#eae6df;font:14px/1.5 system-ui,sans-serif}
  h1{font-weight:500} h2{margin:32px 0 10px;font-size:16px;color:#d4af37} h2 small{color:#9e9a93;font-weight:400;margin-left:8px}
  .fila{display:flex;gap:10px;flex-wrap:wrap} figure{margin:0;width:150px} figure img{width:100%;aspect-ratio:3/4;object-fit:cover;border-radius:6px;display:block;background:#161616}
  figcaption{font-size:11px;color:#9e9a93;margin-top:4px;word-break:break-all} figure.dup img{outline:3px solid #e25c5c} figure.dup figcaption b{color:#e25c5c}
  .aviso{background:#1b1410;border:1px solid #5c3a2a;border-radius:8px;padding:12px 16px;margin:12px 0}
</style></head><body>
<h1>Revisión por modelo</h1>
<p>Una fila por modelo, en el mismo orden que verá el cliente. Las fotos con <span style="color:#e25c5c">borde rojo</span> se parecen mucho a otra: pueden estar repetidas.</p>
${avisos.length ? `<div class="aviso"><b>Avisos (${avisos.length})</b><ul>${avisos.map(a => `<li>${esc(a)}</li>`).join('')}</ul></div>` : ''}
${huerfanas.length ? `<div class="aviso"><b>Fotos en public/fotos que NO usa ninguna prenda (${huerfanas.length})</b><br>${huerfanas.map(esc).join(', ')}</div>` : ''}
${secciones}
</body></html>
`);

  /* Resumen */
  const ahorro = bytesOrigen ? Math.round((1 - bytes800 / bytesOrigen) * 100) : 0;
  console.log(`\n────────────────────────────────────────────────────────`);
  console.log(` Fotos procesadas : ${fotos.length}  (${nuevas} nuevas/cambiadas, ${intactas} sin cambios)`);
  console.log(` Originales       : ${mb(bytesOrigen)}`);
  console.log(` Versión 800 px   : ${mb(bytes800)}   → ahorro aprox. ${ahorro}% por foto vista`);
  console.log(` Todas las medidas: ${mb(bytesTotal)}  (el visitante solo descarga la que necesita)`);
  if (podadas.length) console.log(` Carpetas retiradas de public/img (ya no están publicadas): ${podadas.join(', ')}`);
  if (avisos.length) { console.log(`\n ⚠ AVISOS (${avisos.length}):`); avisos.forEach(a => console.log('   - ' + a)); }
  if (repetidas.length) {
    console.log(`\n ⚠ POSIBLES FOTOS REPETIDAS (${repetidas.length}):`);
    repetidas.forEach(({ a, b }) => console.log(`   - ${a.id} #${a.n} (${path.basename(a.rel)})  ≈  ${b.id} #${b.n} (${path.basename(b.rel)})`));
  }
  if (huerfanas.length) console.log(`\n ℹ ${huerfanas.length} foto(s) en public/fotos no se usan en ninguna prenda (ver revision-por-modelo.html)`);
  console.log(`\n ✓ Listo en ${((Date.now() - t0) / 1000).toFixed(1)} s.  Revisa:  revision-por-modelo.html\n`);
}

main().catch(err => { console.error('\n✗ Error:', err.message, '\n'); process.exit(1); });
