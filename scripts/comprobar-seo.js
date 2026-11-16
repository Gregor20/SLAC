/* ============================================================
   comprobar-seo.js — comprobaciones de datos estructurados, dominio y sitemap
   Las usa verificar.js. Devuelve { errores, host }: `host` es el dominio de la
   canonical (o null si aún no hay dominio) y es el único externo permitido.
   ============================================================ */

'use strict';

const fs   = require('fs');
const path = require('path');
const { RAIZ } = require('./datos');

const TIPOS_PERMITIDOS = ['WebSite', 'ImageGallery'];     // constitución V: sin tipos comerciales
const leer = f => fs.readFileSync(path.join(RAIZ, f), 'utf8');
const hostDe = url => { try { return new URL(url).host; } catch { return null; } };

function comprobarJsonLd(html, host, errores) {
  const m = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!m) return errores.push('index.html: falta el bloque JSON-LD');
  let datos;
  try { datos = JSON.parse(m[1]); } catch (e) { return errores.push(`JSON-LD no es JSON válido: ${e.message}`); }
  const nodos = Array.isArray(datos['@graph']) ? datos['@graph'] : [];
  for (const tipo of TIPOS_PERMITIDOS) {
    if (!nodos.some(n => n['@type'] === tipo)) errores.push(`JSON-LD: falta el tipo ${tipo}`);
  }
  for (const n of nodos) {
    if (!TIPOS_PERMITIDOS.includes(n['@type'])) errores.push(`JSON-LD: tipo no permitido «${n['@type']}»`);
    for (const url of [n.url, n.image].filter(Boolean)) {
      if (hostDe(url) !== host) errores.push(`JSON-LD: la dirección ${url} no coincide con la canonical`);
    }
  }
}

function comprobarDominio(html, host, errores) {
  const sitemap = fs.existsSync(path.join(RAIZ, 'sitemap.xml')) ? leer('sitemap.xml') : null;
  if (!host) {
    if (sitemap) errores.push('hay sitemap.xml pero index.html no tiene canonical (npm run dominio)');
    return;
  }
  const base = `https://${host}`;
  if (!sitemap) errores.push('falta sitemap.xml (npm run dominio -- <dominio>)');
  else if (!sitemap.includes(`<loc>${base}/</loc>`)) errores.push(`sitemap.xml no apunta a ${base}/`);
  if (!leer('robots.txt').includes(`Sitemap: ${base}/sitemap.xml`)) errores.push('robots.txt no tiene la línea Sitemap: de este dominio');
  for (const prop of ['og:url', 'og:image']) {
    if (!html.includes(`<meta property="${prop}" content="${base}/`)) errores.push(`index.html: falta ${prop} con ${base}`);
  }
}

function comprobarSeo() {
  const errores = [];
  const html = leer('index.html');
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/);
  const host = canonical ? hostDe(canonical[1]) : null;
  if (canonical && (!host || !canonical[1].startsWith('https://'))) errores.push(`canonical no válida: ${canonical[1]}`);
  comprobarJsonLd(html, host, errores);
  comprobarDominio(html, host, errores);
  return { errores, host };
}

module.exports = { comprobarSeo };
