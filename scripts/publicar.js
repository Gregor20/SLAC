#!/usr/bin/env node
/* ============================================================
   publicar.js — npm run publicar
   Genera dist/ SOLO con lo que se publica (constitución IV): páginas, estilos, scripts,
   portada, fuentes, cabeceras y el panel online (panel/). Las fotos y los datos de las
   prendas NO van en dist/: salen del Worker (015). Escribe worker/src/galeria.generated.js.
   Nunca copia admin.*, scripts/, fotos originales ni copias privadas.
   Antes ejecuta la verificación y se detiene si falla. Sin dependencias.
   ============================================================ */

'use strict';

const fs   = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { RAIZ, cargarDatos } = require('./datos');
const { generarGaleria, contenidoPublico } = require('./galeria-worker');
const { comprobarWrangler, comprobarDist } = require('./comprobar-publicacion');

const DIST = path.join(RAIZ, 'dist');
const ARCHIVOS = ['index.html', 'aviso-legal.html', 'styles.css', 'visor.css', 'legal.css', 'lib.js', 'app.js',
  'visor.js', 'robots.txt', 'sitemap.xml', '_headers'];   // data/galeria.js se genera sin prendas
const EXTENSIONES_IMG = /\.(avif|webp|png|jpe?g)$/i;
const ESTATICAS_IMG = ['portada', 'slac'];               // únicas carpetas de public/img que se publican

const origen = rel => path.join(RAIZ, ...rel.split('/'));
const destino = rel => path.join(DIST, ...rel.split('/'));

function copiar(rel) {
  fs.mkdirSync(path.dirname(destino(rel)), { recursive: true });
  fs.copyFileSync(origen(rel), destino(rel));
}

/** Copia una carpeta (recursiva) quedándose solo con los archivos que acepta `vale`. */
function copiarCarpeta(rel, vale) {
  for (const e of fs.readdirSync(origen(rel), { withFileTypes: true })) {
    const hijo = `${rel}/${e.name}`;
    if (e.isDirectory()) copiarCarpeta(hijo, vale);
    else if (vale(e.name)) copiar(hijo);
  }
}

function salirSi(errores, titulo) {
  if (!errores.length) return;
  console.error(`\n✗ ${titulo}`);
  errores.forEach(e => console.error(`  - ${e}`));
  console.error('');
  process.exit(1);
}

function verificar() {
  const r = spawnSync(process.execPath, [path.join(__dirname, 'verificar.js')], { stdio: 'inherit' });
  if (r.status !== 0) { console.error('\n✗ La verificación falla: no se genera dist/.\n'); process.exit(1); }
}

/** Los datos reales solo existen en la copia local: si quedan marcadores, no se publica (evita subir «000 000 000»). */
function comprobarMarcadores() {
  const marcador = /\[(INSTAGRAM|CORREO|DOMICILIO)\]|\b000 000 000\b|\+34000000000/;
  const con = ['data/galeria.js', 'aviso-legal.html'].filter(f => marcador.test(fs.readFileSync(origen(f), 'utf8')));
  salirSi(con.length ? [
    `${con.join(' y ')} aún lleva marcadores (teléfono, correo, domicilio o Instagram de ejemplo).`,
    'Estás en una copia sin los datos reales: no se publica para no dejar la web con datos falsos.'
  ] : [], 'Datos de ejemplo');
}

function pesoTotal(dir) {
  return fs.readdirSync(dir, { withFileTypes: true })
    .reduce((s, e) => s + (e.isDirectory() ? pesoTotal(path.join(dir, e.name)) : fs.statSync(path.join(dir, e.name)).size), 0);
}

function main() {
  fs.rmSync(DIST, { recursive: true, force: true });   // se reconstruye entero; así `verificar` no revisa un dist/ antiguo
  verificar();
  comprobarMarcadores();
  // El despliegue es siempre explícito (ADR 010): sin un wrangler.jsonc correcto no se genera dist/.
  salirSi(comprobarWrangler().errores, 'La configuración del Worker no es válida:');
  salirSi(ARCHIVOS.filter(f => !fs.existsSync(origen(f))).map(f => `falta ${f} (¿has aplicado el dominio con npm run dominio?)`), 'Faltan archivos:');

  generarGaleria();   // worker/src/galeria.generated.js: lo que el Worker sabe de las prendas

  ARCHIVOS.forEach(copiar);
  copiarCarpeta('public/fonts', n => n.endsWith('.woff2'));
  copiarCarpeta('panel', n => /\.(html|css|js)$/.test(n));   // panel online: solo lo sirve el Worker tras Access
  // data/galeria.js publicado: contacto y portada; las prendas visibles llegan de /api/prendas.js
  fs.mkdirSync(destino('data'), { recursive: true });
  fs.writeFileSync(destino('data/galeria.js'), contenidoPublico(cargarDatos()));
  // Solo imágenes estáticas: portada, fondo y las sueltas (logo, favicon, og-cover). Las de las prendas
  // viven en R2 (npm run subir-imagenes) y solo las entrega el Worker cuando están visibles.
  for (const e of fs.readdirSync(origen('public/img'), { withFileTypes: true })) {
    const rel = `public/img/${e.name}`;
    if (e.isFile() && EXTENSIONES_IMG.test(e.name)) copiar(rel);
    else if (e.isDirectory() && ESTATICAS_IMG.includes(e.name)) copiarCarpeta(rel, n => EXTENSIONES_IMG.test(n));
  }
  salirSi(comprobarDist(), 'dist/ filtraría datos de las prendas:');

  const mb = (pesoTotal(DIST) / 1048576).toFixed(1);
  console.log(`✓ dist/ generado (${mb} MB). Siguiente: npm run subir-imagenes (si hay fotos nuevas) y`);
  console.log('  npx wrangler deploy -c wrangler.jsonc   (nunca sin -c: ADR 010)\n');
}

main();
