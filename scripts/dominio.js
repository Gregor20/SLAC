#!/usr/bin/env node
/* ============================================================
   dominio.js — pone el dominio en la web (npm run dominio -- https://tudominio.com)
   Escribe: sitemap.xml, la línea "Sitemap:" de robots.txt, canonical / og:url / og:image
   entre los marcadores de index.html, twitter:card grande y url / image del JSON-LD.
   Se puede repetir con otro dominio: sustituye todo sin duplicar. Sin dependencias.
   Si el dominio no es válido o falta algún marcador, no modifica nada.
   ============================================================ */

'use strict';

const fs   = require('fs');
const path = require('path');
const { RAIZ } = require('./datos');

const DOMINIO = /^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)+(:\d{1,5})?$/;
const INICIO = /<!-- DOMINIO:INICIO[^>]*-->\n/;
const FIN    = /[ \t]*<!-- DOMINIO:FIN -->/;
const LD_JSON = /(<script type="application\/ld\+json">\n)([\s\S]*?)(\n\s*<\/script>)/;
const IMAGEN = 'public/img/og-cover.jpg';

/** "https://Ejemplo.com/" → "https://ejemplo.com"; null si no es https ni dominio sin ruta. */
function normalizar(entrada) {
  const d = String(entrada || '').trim().toLowerCase().replace(/\/$/, '');
  return DOMINIO.test(d) ? d : null;
}

function bloqueMeta(base) {
  return [
    `<link rel="canonical" href="${base}/">`,
    `<meta property="og:url" content="${base}/">`,
    `<meta property="og:image" content="${base}/${IMAGEN}">`,
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">'
  ].map(l => `  ${l}\n`).join('');
}

function reescribirJsonLd(html, base) {
  const m = html.match(LD_JSON);
  if (!m) throw new Error('index.html no tiene el bloque JSON-LD');
  const datos = JSON.parse(m[2]);
  for (const nodo of datos['@graph']) {
    nodo.url = `${base}/`;
    if (nodo['@type'] === 'ImageGallery') nodo.image = `${base}/${IMAGEN}`;
  }
  const json = JSON.stringify(datos, null, 2);
  return html.replace(LD_JSON, (_, ini, __, fin) => ini + json + fin);
}

function reescribirIndex(html, base) {
  if (!INICIO.test(html) || !FIN.test(html)) throw new Error('index.html no tiene los marcadores DOMINIO:INICIO / DOMINIO:FIN');
  const entre = new RegExp(`(${INICIO.source})[\\s\\S]*?(?=${FIN.source})`);
  let salida = html.replace(entre, (_, ini) => ini + bloqueMeta(base));
  salida = salida.replace(/<meta name="twitter:card" content="[^"]*">/, '<meta name="twitter:card" content="summary_large_image">');
  return reescribirJsonLd(salida, base);
}

function reescribirRobots(texto, base) {
  const lineas = texto.split('\n').filter(l => !/^\s*Sitemap:/i.test(l) && !/^#\s*PENDIENTE/i.test(l));
  return `${lineas.join('\n').replace(/\s+$/, '')}\n\nSitemap: ${base}/sitemap.xml\n`;
}

function sitemap(base, hoy) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`
    + `  <url>\n    <loc>${base}/</loc>\n    <lastmod>${hoy}</lastmod>\n  </url>\n</urlset>\n`;
}

function main(argumento) {
  const base = normalizar(argumento);
  if (!base) {
    console.error('Uso: npm run dominio -- https://tudominio.com   (https, sin ruta ni espacios)');
    process.exit(1);
  }
  const leer = f => fs.readFileSync(path.join(RAIZ, f), 'utf8');
  try {
    // Todo se calcula antes de escribir: si algo falla, no queda nada a medias
    const salidas = {
      'index.html': reescribirIndex(leer('index.html'), base),
      'robots.txt': reescribirRobots(leer('robots.txt'), base),
      'sitemap.xml': sitemap(base, new Date().toISOString().slice(0, 10))
    };
    for (const [f, contenido] of Object.entries(salidas)) fs.writeFileSync(path.join(RAIZ, f), contenido);
  } catch (e) {
    console.error(`✗ ${e.message}. No se ha modificado nada.`);
    process.exit(1);
  }
  console.log(`✓ Dominio ${base}: index.html, robots.txt y sitemap.xml actualizados.\n  Ejecuta npm run verificar y envía ${base}/sitemap.xml a Google Search Console.`);
}

if (require.main === module) main(process.argv[2]);

module.exports = { normalizar, reescribirIndex, reescribirRobots, sitemap };
