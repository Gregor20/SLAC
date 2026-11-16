#!/usr/bin/env node
/* ============================================================
   publicar.js — npm run publicar
   Genera dist/ SOLO con lo que se publica (constitución IV): páginas, estilos,
   scripts, datos, imágenes optimizadas de las prendas visibles, fuentes y
   cabeceras. Nunca copia admin.*, scripts/, fotos originales ni copias privadas.
   Antes ejecuta la verificación y se detiene si falla. Sin dependencias.
   ============================================================ */

'use strict';

const fs   = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { RAIZ, cargarDatos } = require('./datos');

const DIST = path.join(RAIZ, 'dist');
const ARCHIVOS = ['index.html', 'aviso-legal.html', 'styles.css', 'visor.css', 'legal.css', 'lib.js', 'app.js',
  'visor.js', 'data/galeria.js', 'data/fotos-optimizadas.js', 'robots.txt', 'sitemap.xml', '_headers'];
const EXTENSIONES_IMG = /\.(avif|webp|png|jpe?g)$/i;

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

function verificar() {
  const r = spawnSync(process.execPath, [path.join(__dirname, 'verificar.js')], { stdio: 'inherit' });
  if (r.status !== 0) { console.error('\n✗ La verificación falla: no se genera dist/.\n'); process.exit(1); }
}

function pesoTotal(dir) {
  return fs.readdirSync(dir, { withFileTypes: true })
    .reduce((s, e) => s + (e.isDirectory() ? pesoTotal(path.join(dir, e.name)) : fs.statSync(path.join(dir, e.name)).size), 0);
}

function main() {
  verificar();
  const faltan = ARCHIVOS.filter(f => !fs.existsSync(origen(f)));
  if (faltan.length) {
    console.error(`✗ Faltan archivos: ${faltan.join(', ')} (¿has aplicado el dominio con npm run dominio?)`);
    process.exit(1);
  }
  const { PRENDAS } = cargarDatos();
  fs.rmSync(DIST, { recursive: true, force: true });

  ARCHIVOS.forEach(copiar);
  copiarCarpeta('public/fonts', n => n.endsWith('.woff2'));
  // Solo las imágenes de portada, de las prendas visibles y las sueltas (logo, favicon, og-cover)
  for (const e of fs.readdirSync(origen('public/img'), { withFileTypes: true })) {
    const rel = `public/img/${e.name}`;
    if (e.isFile() && EXTENSIONES_IMG.test(e.name)) copiar(rel);
    else if (e.isDirectory() && (e.name === 'portada' || PRENDAS.some(p => String(p.id) === e.name))) {
      copiarCarpeta(rel, n => EXTENSIONES_IMG.test(n));
    }
  }
  const mb = (pesoTotal(DIST) / 1048576).toFixed(1);
  console.log(`✓ dist/ generado (${mb} MB). Súbelo con: npx wrangler pages deploy dist --project-name slac\n`);
}

main();
