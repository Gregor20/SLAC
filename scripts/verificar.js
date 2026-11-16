#!/usr/bin/env node
/* ============================================================
   verificar.js — puerta de calidad de la constitución (npm run verificar)
   Sin dependencias. Código de salida 1 si hay algún error.
   ============================================================ */

'use strict';

const fs   = require('fs');
const path = require('path');
const vm   = require('vm');
const { RAIZ, cargarDatos, cargarFotosOpt, imagenesDe, numeroPrenda, rutaAbsoluta } = require('./datos');
const { comprobarSeo } = require('./comprobar-seo');

const PUBLICABLES = ['index.html', 'aviso-legal.html', 'styles.css', 'visor.css', 'legal.css',
  'lib.js', 'app.js', 'visor.js', 'data/galeria.js', 'data/fotos-optimizadas.js', 'robots.txt'];
const REVISADOS = PUBLICABLES.concat(['sitemap.xml']);   // el sitemap solo existe cuando hay dominio
const HTML = PUBLICABLES.filter(f => f.endsWith('.html'));
const JS   = PUBLICABLES.filter(f => f.endsWith('.js'));
const LIMITE_LINEAS = 200;
const ANCHOS = [160, 480, 800, 1200];
const ANCHOS_AVIF = [480, 800, 1200];
const HOSTS_PERMITIDOS = ['wa.me', 'schema.org', 'www.w3.org', 'www.sitemaps.org'];
const HOSTS_SOLO_AVISO_LEGAL = ['www.instagram.com'];   // enmienda 1.3.0 de la constitución (principio IV)

// Principio I: términos que sugieren negocio o venta (se comparan sin tildes ni mayúsculas)
const PROHIBIDAS = [
  /\bventas?\b/, /\bvend(er|o|e|en|emos|ido|ida)\b/, /\bcompr(a|as|ar|amos|ado|ada)\b/, /\bprecios?\b/,
  /\btiendas?\b/, /\bpedidos?\b/, /\bencargos?\b/, /\bencargar\b/, /\bdisponib\w*/, /\bstock\b/,
  /\bagotad[oa]s?\b/, /\btallas?\b/, /\benvios?\b/, /\bofertas?\b/, /\bdescuentos?\b/, /\brebajas?\b/,
  /\bclientes?\b/, /\bcoleccion(es)?\b/, /\bcatalogos?\b/, /\blookbook\b/, /\batelier\b/, /\bempresas?\b/,
  /\bnegocios?\b/, /\bcomerci\w*/, /\bmercantil\w*/, /€/, /\bshop\b/, /\bstore\b/, /\blocalbusiness\b/,
  /\bproduct\b/, /\boffer\b/
];

const errores = [], avisos = [];
const leer = f => fs.readFileSync(path.join(RAIZ, f), 'utf8');
const existe = f => fs.existsSync(path.join(RAIZ, f));
const normalizar = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function seccion(nombre, fn) {
  const antes = errores.length;
  try { fn(); } catch (e) { errores.push(`${nombre}: ${e.message}`); }
  const n = errores.length - antes;
  console.log(` ${n ? '✗' : '✓'} ${nombre}${n ? ` (${n})` : ''}`);
  errores.slice(antes).forEach(e => console.log(`     - ${e}`));
}

/* ── Comprobaciones ──────────────────────────────────────── */
function archivos() {
  for (const f of PUBLICABLES) if (!existe(f)) errores.push(`falta ${f}`);
}

function sintaxis() {
  for (const f of JS.filter(existe)) {
    try { new vm.Script(leer(f), { filename: f }); } catch (e) { errores.push(`${f}: ${e.message}`); }
  }
  const todos = [...JS, ...fs.readdirSync(path.join(RAIZ, 'scripts')).map(f => `scripts/${f}`)];
  for (const f of todos.filter(f => f.endsWith('.js') && existe(f) && !f.startsWith('data/'))) {
    const n = leer(f).split('\n').length;
    if (n > LIMITE_LINEAS + 1) errores.push(`${f}: ${n} líneas (máximo ${LIMITE_LINEAS})`);
  }
}

function datos() {
  const { CONTACTO, PORTADA, PRENDAS } = cargarDatos();
  if (!/^\+\d{6,15}$/.test(CONTACTO.telefonoRaw || '')) errores.push('CONTACTO.telefonoRaw debe ser + y dígitos');
  if (!/^\d{6,15}$/.test(CONTACTO.whatsapp || '')) errores.push('CONTACTO.whatsapp debe ser solo dígitos');
  if (!CONTACTO.telefono) errores.push('falta CONTACTO.telefono');

  // El id es el número que se ve sobre la foto: 1 a 4 cifras y sin repetirse por valor ("001" y "1" chocan)
  const numeros = new Set();
  for (const p of PRENDAS) {
    const id = String(p.id || '');
    if (!/^\d{1,4}$/.test(id)) errores.push(`id no válido: "${id}" (debe ser un número de 1 a 4 cifras)`);
    else if (numeros.has(numeroPrenda(p))) errores.push(`número repetido: ${numeroPrenda(p)} (id ${id})`);
    numeros.add(numeroPrenda(p));
    if (!String(p.descripcion || '').trim()) errores.push(`[${id}] falta la descripción`);
    if (!imagenesDe(p).length) errores.push(`[${id}] no tiene fotos`);
    imagenesDe(p).forEach(r => { if (!fs.existsSync(rutaAbsoluta(r))) errores.push(`[${id}] no existe ${r}`); });
    const sobran = Object.keys(p).filter(k => !['id', 'descripcion', 'imagenes'].includes(k));
    if (sobran.length) errores.push(`[${id}] campos que no deben publicarse: ${sobran.join(', ')}`);
  }
  if (!Array.isArray(PORTADA) || PORTADA.length !== 4) errores.push('PORTADA debe tener exactamente 4 entradas');
  (PORTADA || []).forEach((e, i) => {
    const p = PRENDAS.find(x => String(x.id) === String(e.prenda));
    if (!p || !imagenesDe(p)[e.foto - 1]) errores.push(`PORTADA ${i + 1}: no existe la foto ${e.foto} de la prenda ${e.prenda}`);
  });
}

function fotosOptimizadas() {
  const { PRENDAS, PORTADA } = cargarDatos();
  const opt = cargarFotosOpt();
  if (!opt || !opt.prendas) throw new Error('no hay data/fotos-optimizadas.js: ejecuta npm run optimizar');
  if (String(opt.anchosAvif) !== String(ANCHOS_AVIF)) errores.push('data/fotos-optimizadas.js sin versiones AVIF: ejecuta npm run optimizar');
  for (const p of PRENDAS) {
    const dims = opt.prendas[p.id] || [];
    if (dims.length !== imagenesDe(p).length) {
      errores.push(`[${p.id}] ${imagenesDe(p).length} fotos en los datos y ${dims.length} optimizadas: ejecuta npm run optimizar`);
      continue;
    }
    const archivos = dims.flatMap((_, i) => [
      ...ANCHOS.map(w => `public/img/${p.id}/${i + 1}-${w}.webp`),
      ...ANCHOS_AVIF.map(w => `public/img/${p.id}/${i + 1}-${w}.avif`)]);
    archivos.filter(f => !existe(f)).forEach(f => errores.push(`falta ${f}`));
  }
  const sobran = Object.keys(opt.prendas).filter(id => !PRENDAS.some(p => String(p.id) === id));
  if (sobran.length) errores.push(`fotos optimizadas de prendas que ya no existen: ${sobran.join(', ')} (npm run optimizar)`);
  (PORTADA || []).forEach((_, i) => {
    ['webp', 'avif'].forEach(ext => {
      if (!existe(`public/img/portada/${i + 1}-800.${ext}`)) errores.push(`falta la portada ${i + 1} (${ext}): ejecuta npm run optimizar`);
    });
  });
  if (!existe('public/img/og-cover.jpg')) errores.push('falta public/img/og-cover.jpg: ejecuta npm run optimizar');
}

function referenciasLocales() {
  for (const f of HTML.filter(existe)) {
    const html = leer(f);
    const refs = [...html.matchAll(/\b(?:src|href)="([^"#?]+)/g)].map(m => m[1])
      .concat([...html.matchAll(/\bsrcset="([^"]+)"/g)].flatMap(m => m[1].split(',').map(s => s.trim().split(/\s+/)[0])));
    for (const r of new Set(refs)) {
      if (/^(https?:|tel:|mailto:|data:)/.test(r) || r === '') continue;
      if (!existe(r)) errores.push(`${f}: enlace roto a ${r}`);
    }
  }
}

function palabrasProhibidas() {
  for (const f of REVISADOS.filter(existe)) {
    leer(f).split('\n').forEach((linea, i) => {
      const n = normalizar(linea);
      for (const re of PROHIBIDAS) {
        const m = n.match(re);
        if (m) errores.push(`${f}:${i + 1} «${m[0]}»`);
      }
    });
  }
}

function urlsExternas() {
  const permitidos = [...HOSTS_PERMITIDOS, comprobarSeo().host].filter(Boolean);   // + el dominio de la canonical
  for (const f of REVISADOS.filter(existe)) {
    for (const m of leer(f).matchAll(/https?:\/\/([^/\s"'`)<>]+)[^\s"'`)<>]*/g)) {
      const host = m[1].toLowerCase();
      if (!permitidos.includes(host) && !(f === 'aviso-legal.html' && HOSTS_SOLO_AVISO_LEGAL.includes(host))) errores.push(`${f}: URL externa ${m[0]}`);
    }
  }
}

function codigoEnLinea() {
  for (const f of HTML.filter(existe)) {
    for (const [etiqueta] of leer(f).matchAll(/<[a-z][^>]*>/gi)) {
      if (/^<script\b/i.test(etiqueta) && !/\bsrc=/.test(etiqueta) && !/application\/ld\+json/.test(etiqueta)) errores.push(`${f}: <script> en línea`);
      if (/^<style\b/i.test(etiqueta)) errores.push(`${f}: <style> en línea`);
      if (/\sstyle\s*=/i.test(etiqueta)) errores.push(`${f}: atributo style en ${etiqueta.slice(0, 60)}`);
      if (/\son[a-z]+\s*=/i.test(etiqueta)) errores.push(`${f}: manejador en línea en ${etiqueta.slice(0, 60)}`);
    }
  }
  for (const f of JS.filter(existe)) {
    if (/\bstyle\s*=\s*["'\\]|setAttribute\(\s*['"]style/.test(leer(f))) errores.push(`${f}: genera atributos style (la CSP los bloquea)`);
  }
}

/* ── Ejecución ───────────────────────────────────────────── */
console.log('\nSLAC · verificación\n');
seccion('Archivos publicables', archivos);
seccion('Sintaxis y tamaño de los JS', sintaxis);
seccion('Datos de la galería', datos);
seccion('Fotos optimizadas al día', fotosOptimizadas);
seccion('Enlaces locales del HTML', referenciasLocales);
seccion('Palabras prohibidas (principio I)', palabrasProhibidas);
seccion('SEO técnico: JSON-LD, dominio y sitemap', () => errores.push(...comprobarSeo().errores));
seccion('URLs externas (principio IV)', urlsExternas);
seccion('Código en línea (CSP)', codigoEnLinea);
avisos.forEach(a => console.log(` ⚠ ${a}`));
console.log(errores.length ? `\n✗ ${errores.length} error(es)\n` : '\n✓ Todo correcto\n');
process.exit(errores.length ? 1 : 0);
