#!/usr/bin/env node
/* ============================================================
   subir-imagenes.js — npm run subir-imagenes [-- --local] [-- --simular] [-- --forzar] [-- --solo=001,003]
   Sube a R2 las imágenes optimizadas de las prendas (public/img/<id>/<n>-<ancho>.<ext> →
   f/<id>/<n>-<ancho>.<ext>) y borra las que ya no existen. Solo sube lo nuevo o cambiado:
   guarda una huella (SHA-1) de cada archivo en un manifiesto local (.r2-manifiesto.json), que
   se puede perder sin riesgo (entonces se vuelve a subir todo). Wrangler no tiene subida masiva:
   se sube de una en una: 4 a la vez en remoto y de una en una en --local (el R2 local falla con
   escrituras simultáneas).
     --local     R2 local de `wrangler dev` (pruebas)     --simular  muestra qué haría y no sube nada
     --forzar    ignora el manifiesto y lo sube todo     --solo=ids  solo esas prendas (no borra nada)
   El bucket es privado: solo el Worker entrega las fotos, y solo si están visibles. Sin dependencias.
   ============================================================ */

'use strict';

const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');
const { RAIZ, cargarDatos, cargarFotosOpt, rutaAbsoluta } = require('./datos');
const { comprobarWrangler } = require('./comprobar-publicacion');

const CACHE = 'public, max-age=30';   // 30 s: ocultar una foto debe surtir efecto en menos de 1 minuto
const TIPOS = { webp: 'image/webp', avif: 'image/avif' };
const WRANGLER = path.join(RAIZ, 'node_modules', 'wrangler', 'bin', 'wrangler.js');

const entrada = (id, n, ancho, ext) => ({
  clave: `f/${id}/${n}-${ancho}.${ext}`, ruta: `public/img/${id}/${n}-${ancho}.${ext}`, tipo: TIPOS[ext]
});

/** Todos los archivos que debe haber en R2 según los datos: WebP en todos los anchos y AVIF en los suyos. */
function archivosDeGaleria({ PRENDAS }, opt) {
  const lista = [];
  for (const p of PRENDAS) {
    const fotos = (opt.prendas[p.id] || []).length;
    for (let n = 1; n <= fotos; n++) {
      opt.anchos.forEach(w => lista.push(entrada(p.id, n, w, 'webp')));
      opt.anchosAvif.forEach(w => lista.push(entrada(p.id, n, w, 'avif')));
    }
  }
  return lista;
}

const huellaDe = ruta => crypto.createHash('sha1').update(fs.readFileSync(rutaAbsoluta(ruta))).digest('hex');

/** Qué subir (nuevo o cambiado) y qué borrar (estaba en el manifiesto y ya no existe). */
function planificar(archivos, manifiesto, forzar = false) {
  const claves = new Set(archivos.map(a => a.clave));
  return {
    subir: archivos.filter(a => forzar || manifiesto[a.clave] !== a.huella),
    borrar: Object.keys(manifiesto).filter(c => !claves.has(c))
  };
}

/** Ejecuta wrangler con la configuración explícita (ADR 010); resuelve true si termina bien. */
function wrangler(argumentos) {
  return new Promise(resolver => {
    const hijo = spawn(process.execPath, [WRANGLER, ...argumentos, '-c', 'wrangler.jsonc'], { cwd: RAIZ, stdio: ['ignore', 'ignore', 'pipe'] });
    let error = '';
    hijo.stderr.on('data', d => { error += d; });
    hijo.on('close', codigo => { if (codigo !== 0) console.error(`\n  ✗ wrangler ${argumentos.slice(0, 4).join(' ')}: ${error.split('\n').find(l => /ERROR|Error/.test(l)) || error.trim().slice(-200)}`); resolver(codigo === 0); });
  });
}

/** Ejecuta `tarea` sobre cada elemento con `paralelo` a la vez. */
async function enParalelo(elementos, paralelo, tarea) {
  let siguiente = 0;
  const obreros = Array.from({ length: Math.min(paralelo, elementos.length) }, async () => {
    while (siguiente < elementos.length) await tarea(elementos[siguiente++]);
  });
  await Promise.all(obreros);
}

async function main() {
  const argumentos = process.argv.slice(2);
  const local = argumentos.includes('--local');
  const simular = argumentos.includes('--simular');
  const { errores, config } = comprobarWrangler();
  if (!local && !simular && errores.length) {
    console.error(`\n✗ ${errores.join('\n✗ ')}\n`);
    process.exit(1);
  }
  const bucket = config?.r2_buckets?.[0]?.bucket_name || 'slac-fotos';
  const destino = local ? '--local' : '--remote';
  const rutaManifiesto = path.join(RAIZ, local ? '.r2-manifiesto-local.json' : '.r2-manifiesto.json');
  const manifiesto = fs.existsSync(rutaManifiesto) ? JSON.parse(fs.readFileSync(rutaManifiesto, 'utf8')) : {};

  const opt = cargarFotosOpt();
  if (!opt) { console.error('\n✗ Falta data/fotos-optimizadas.js: ejecuta npm run optimizar\n'); process.exit(1); }
  const solo = (argumentos.find(a => a.startsWith('--solo=')) || '').slice(7).split(',').filter(Boolean);
  const archivos = archivosDeGaleria(cargarDatos(), opt)
    .filter(a => !solo.length || solo.includes(a.clave.split('/')[1]))
    .map(a => ({ ...a, huella: huellaDe(a.ruta) }));
  const plan = planificar(archivos, manifiesto, argumentos.includes('--forzar'));
  const subir = plan.subir, borrar = solo.length ? [] : plan.borrar;   // con --solo nunca se borra
  console.log(`R2 (${local ? 'local' : 'remoto'}, bucket ${bucket}): ${archivos.length} archivos, ${subir.length} por subir, ${borrar.length} por borrar.`);
  if (simular || (!subir.length && !borrar.length)) return;

  let hechos = 0, fallos = 0;
  const guardar = () => fs.writeFileSync(rutaManifiesto, JSON.stringify(manifiesto, null, 1));
  const avanzar = ok => { if (!ok) fallos++; if (++hechos % 20 === 0) { guardar(); process.stdout.write(`  ${hechos}/${subir.length + borrar.length}\r`); } };

  await enParalelo(subir, local ? 1 : 4, async a => {
    const ok = await wrangler(['r2', 'object', 'put', `${bucket}/${a.clave}`, '--file', rutaAbsoluta(a.ruta),
      '--content-type', a.tipo, '--cache-control', CACHE, destino]);
    if (ok) manifiesto[a.clave] = a.huella;
    avanzar(ok);
  });
  await enParalelo(borrar, local ? 1 : 4, async clave => {
    const ok = await wrangler(['r2', 'object', 'delete', `${bucket}/${clave}`, destino]);
    if (ok) delete manifiesto[clave];
    avanzar(ok);
  });
  guardar();
  console.log(fallos ? `\n✗ ${fallos} operaciones fallaron: vuelve a ejecutar el comando (solo repite lo pendiente).\n`
    : `\n✓ R2 al día: ${subir.length} subidos, ${borrar.length} borrados.\n`);
  process.exit(fallos ? 1 : 0);
}

if (require.main === module) main();

module.exports = { archivosDeGaleria, planificar, entrada };
