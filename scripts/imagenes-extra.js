/* ============================================================
   imagenes-extra.js — piezas del optimizador:
     · logo con transparencia y favicon a partir de logo.jpeg
     · og-cover.jpg (vista previa al compartir) y data/fotos-optimizadas.js
     · "huella" de cada foto para detectar repetidas
     · página local revision-por-modelo.html
   ============================================================ */

'use strict';

const fs   = require('fs');
const path = require('path');

const FONDO = '#0a0908';                 // mismo negro que la web
const SUELO = 12;                        // ruido del negro del JPEG
const GANANCIA = 2.2;                    // a partir de ~45 % de brillo el trazo es opaco

/* ── Logo ────────────────────────────────────────────────── */
/**
 * El logo es dorado sobre negro: la luminosidad separa trazo y fondo.
 * alfa = brillo (con suelo y ganancia); color = original / alfa, de modo
 * que sobre negro se ve idéntico y sobre una foto no deja un rectángulo.
 * Devuelve true si ha regenerado los archivos.
 */
async function generarLogo(sharp, origen, salida, forzar) {
  const logos  = [280, 560].map(w => path.join(salida, `logo-${w}.webp`));
  const iconos = [[48, 'favicon-48.png'], [180, 'apple-touch-icon.png']].map(([t, f]) => [t, path.join(salida, f)]);
  const mtime  = fs.statSync(origen).mtimeMs;
  const todos  = [...logos, ...iconos.map(i => i[1])];
  if (!forzar && todos.every(f => fs.existsSync(f) && fs.statSync(f).mtimeMs >= mtime)) return false;

  const { data, info } = await sharp(origen).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const rgba = Buffer.alloc(W * H * 4);
  let x0 = W, y0 = H, x1 = 0, y1 = 0;

  for (let i = 0; i < W * H; i++) {
    const [r, g, b] = [data[i * 3], data[i * 3 + 1], data[i * 3 + 2]];
    const a = Math.min(1, Math.max(0, Math.max(r, g, b) - SUELO) * GANANCIA / 255);
    if (a === 0) continue;
    rgba[i * 4]     = Math.min(255, Math.round(r / a));
    rgba[i * 4 + 1] = Math.min(255, Math.round(g / a));
    rgba[i * 4 + 2] = Math.min(255, Math.round(b / a));
    rgba[i * 4 + 3] = Math.round(a * 255);
    if (a > 0.08) {
      const x = i % W, y = (i - x) / W;
      x0 = Math.min(x0, x); x1 = Math.max(x1, x);
      y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    }
  }

  const margen = 6;
  const recorte = {
    left: Math.max(0, x0 - margen), top: Math.max(0, y0 - margen),
    width: Math.min(W, x1 + margen) - Math.max(0, x0 - margen),
    height: Math.min(H, y1 + margen) - Math.max(0, y0 - margen)
  };
  const transparente = await sharp(rgba, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
  const logo = await sharp(transparente).extract(recorte).png().toBuffer();
  await Promise.all(logos.map((f, i) =>
    sharp(logo).resize({ width: [280, 560][i] }).webp({ quality: 78, alphaQuality: 60, effort: 6 }).toFile(f)));

  // Favicon: la "S" inicial (zona izquierda del logo) sobre el negro de la web
  const lado = Math.round(recorte.width * 0.31);             // la "S" ocupa ~el primer tercio
  const s = await sharp(transparente)
    .extract({ left: recorte.left + Math.round(recorte.width * 0.05), top: recorte.top, width: lado, height: Math.min(lado, recorte.height) })
    .png().toBuffer();
  await Promise.all(iconos.map(async ([t, f]) => {
    const lado = Math.round(t * 0.84);
    const letra = await sharp(s).resize(lado, lado, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
    await sharp({ create: { width: t, height: t, channels: 4, background: FONDO } })
      .composite([{ input: letra, gravity: 'center' }]).png().toFile(f);
  }));
  return true;
}

/* ── Vista previa al compartir (1200×630, sin texto) ───── */
/** Tríptico con las fotos de portada 2 | 1 | 3 y el logo sobre un degradado oscuro. */
async function generarOgCover(sharp, salida) {
  const W = 1200, H = 630, col = W / 3;
  const columnas = await Promise.all([2, 1, 3].map(p =>
    sharp(path.join(salida, 'portada', `${p}-800.webp`)).resize(col, H, { fit: 'cover', position: 'top' }).toBuffer()));
  const degradado = Buffer.from(`<svg width="${W}" height="${H}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0.45" stop-color="${FONDO}" stop-opacity="0"/><stop offset="1" stop-color="${FONDO}" stop-opacity="0.92"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/></svg>`);
  const logo = await sharp(path.join(salida, 'logo-560.webp')).resize({ width: 440 }).toBuffer();
  const { height: altoLogo } = await sharp(logo).metadata();
  await sharp({ create: { width: W, height: H, channels: 3, background: FONDO } })
    .composite([
      ...columnas.map((input, i) => ({ input, left: i * col, top: 0 })),
      { input: degradado, left: 0, top: 0 },
      { input: logo, left: (W - 440) / 2, top: H - altoLogo - 36 }
    ])
    .jpeg({ quality: 80, mozjpeg: true }).toFile(path.join(salida, 'og-cover.jpg'));
}

/** Contenido de data/fotos-optimizadas.js */
function textoManifiesto(manifiesto, anchos, anchosAvif) {
  const filas = Object.entries(manifiesto).map(([id, d]) => `    "${id}": ${JSON.stringify(d)}`).join(',\n');
  return `/**
 * Generado por scripts/optimizar-imagenes.js — NO editar a mano.
 * prendas[id] = [ancho, alto] de cada foto en public/img/<id>/<n>-<ancho>.<formato>
 */
const FOTOS_OPT = {
  anchos: [${anchos.join(', ')}],
  anchosAvif: [${anchosAvif.join(', ')}],
  prendas: {
${filas}
  }
};
`;
}

/* ── Fotos repetidas ─────────────────────────────────────── */
/** "Huella" de 64 bits (dHash): dos fotos casi idénticas tienen huellas casi iguales. */
async function huella(sharp, ruta) {
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

/* ── Página de revisión (herramienta local, no se publica) ─ */
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function paginaRevision({ prendas, manifiesto, marcadas, avisos, huerfanas, portada }) {
  const figura = (src, pie, dup) => `<figure class="${dup ? 'dup' : ''}"><img src="${esc(src)}" alt="" loading="lazy">
        <figcaption>${pie}${dup ? `<br><b>⚠ Parecida a: ${esc([...new Set(dup)].join(', '))}</b>` : ''}</figcaption></figure>`;

  const filaPortada = portada.map(p => figura(`public/img/portada/${p.pos}-480.webp`,
    `Posición ${p.pos} · prenda ${esc(p.prenda)} #${p.foto}`)).join('');

  const secciones = prendas.map(p => {
    const id = String(p.id);
    const n = (manifiesto[id] || []).length;
    const figs = Array.from({ length: n }, (_, i) => figura(`public/img/${id}/${i + 1}-480.webp`,
      `#${i + 1} · ${esc(path.basename(p.imagenes[i] || ''))}`, marcadas.get(`${id}/${i + 1}`))).join('');
    return `<section><h2>${esc(id)} <small>${esc(p.descripcion || '— sin descripción —')} · ${n} foto${n === 1 ? '' : 's'}</small></h2><div class="fila">${figs}</div></section>`;
  }).join('\n');

  return `<!DOCTYPE html>
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
<p>Una fila por prenda, en el mismo orden que la galería. Las fotos con <span style="color:#e25c5c">borde rojo</span> se parecen mucho a otra: pueden estar repetidas.</p>
${avisos.length ? `<div class="aviso"><b>Avisos (${avisos.length})</b><ul>${avisos.map(a => `<li>${esc(a)}</li>`).join('')}</ul></div>` : ''}
${huerfanas.length ? `<div class="aviso"><b>Fotos en public/fotos que no usa ninguna prenda (${huerfanas.length})</b><br>${huerfanas.map(esc).join(', ')}</div>` : ''}
<section><h2>Portada <small>1 principal · 2 izquierda · 3 derecha · 4 fondo del contacto</small></h2><div class="fila">${filaPortada}</div></section>
${secciones}
</body></html>
`;
}

module.exports = { generarLogo, generarOgCover, textoManifiesto, huella, distancia, paginaRevision };
