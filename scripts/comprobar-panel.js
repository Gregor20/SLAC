/* ============================================================
   comprobar-panel.js — el panel online (015, US4) no deja rastro en la web pública y cumple la CSP.
   · panel/index.html lleva `noindex`, sin código ni estilos en línea.
   · panel/*.js no generan atributos `style` (la CSP los bloquea).
   · Ningún archivo público (HTML, JS, CSS, robots.txt, sitemap.xml, datos) menciona `/panel` ni
     `/api/admin`, y ningún HTML público enlaza al panel.
   (Las palabras prohibidas y las URL externas del panel las revisa verificar.js junto al resto.)
   Devuelve una lista de errores. Sin dependencias.
   ============================================================ */

'use strict';

const fs   = require('fs');
const path = require('path');
const { RAIZ } = require('./datos');

const PUBLICOS = ['index.html', 'aviso-legal.html', 'styles.css', 'visor.css', 'legal.css', 'lib.js', 'app.js',
  'visor.js', 'robots.txt', 'sitemap.xml', 'data/galeria.js'];
const MENCION = /\/panel\b|api\/admin/i;

const leer = rel => fs.readFileSync(path.join(RAIZ, ...rel.split('/')), 'utf8');
const existe = rel => fs.existsSync(path.join(RAIZ, ...rel.split('/')));

/** Archivos del panel (`panel/…`) con las extensiones dadas. */
function archivosPanel(extensiones) {
  const dir = path.join(RAIZ, 'panel');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(n => extensiones.test(n)).map(n => `panel/${n}`);
}

function comprobarPanelHtml(errores) {
  if (!existe('panel/index.html')) return;
  const html = leer('panel/index.html');
  if (!/<meta\s+name="robots"\s+content="[^"]*\bnoindex\b/i.test(html)) errores.push('panel/index.html: falta <meta name="robots" content="noindex, …">');
  for (const [etiqueta] of html.matchAll(/<[a-z][^>]*>/gi)) {
    if (/^<script\b/i.test(etiqueta) && !/\bsrc=/.test(etiqueta)) errores.push('panel/index.html: <script> en línea');
    if (/^<style\b/i.test(etiqueta)) errores.push('panel/index.html: <style> en línea');
    if (/\sstyle\s*=/i.test(etiqueta)) errores.push(`panel/index.html: atributo style en ${etiqueta.slice(0, 60)}`);
    if (/\son[a-z]+\s*=/i.test(etiqueta)) errores.push(`panel/index.html: manejador en línea en ${etiqueta.slice(0, 60)}`);
  }
}

function comprobarPanel() {
  const errores = [];
  comprobarPanelHtml(errores);
  for (const f of archivosPanel(/\.js$/)) {
    if (/\bstyle\s*=\s*["'\]|setAttribute\(\s*['"]style/.test(leer(f))) errores.push(`${f}: genera atributos style (la CSP los bloquea)`);
  }
  for (const f of PUBLICOS.filter(existe)) {
    leer(f).split('\n').forEach((linea, i) => { if (MENCION.test(linea)) errores.push(`${f}:${i + 1} menciona el panel (la web pública no debe dejar rastro)`); });
  }
  return errores;
}

module.exports = { comprobarPanel, archivosPanel };
