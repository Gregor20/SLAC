/* ============================================================
   lib.js — utilidades compartidas (web y panel interno)
   Requiere data/galeria.js y, si existe, data/fotos-optimizadas.js
   ============================================================ */

'use strict';

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escapa un valor para insertarlo en HTML (texto o atributo). */
function sanitize(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => HTML_ESCAPES[ch]);
}

/** Número que se muestra sobre las fotos de la prenda: su id sin ceros a la izquierda ("012" → "12"); "" si el id no son 1 a 4 cifras. */
function numeroPrenda(p) {
  return /^\d{1,4}$/.test(String(p.id)) ? String(Number(p.id)) : '';
}

function getImagenes(p) {
  return Array.isArray(p.imagenes) ? p.imagenes : [];
}

/**
 * Fotos de una prenda listas para pintar:
 *   [{ src, srcset, srcsetAvif, thumb, ancho, alto }]
 * - Con FOTOS_OPT (data/fotos-optimizadas.js en local; /api/prendas.js en la web publicada): WebP (y AVIF
 *   si existe) de <base><id>/<n>-<ancho>.<ext> y sus dimensiones reales (el navegador reserva el hueco y
 *   elige formato y tamaño). `base` es `public/img/` en local y `/f/` en la web publicada; cada foto
 *   puede traer su número original (3.er valor) para que ocultar una no renumere las demás.
 * - Sin él: las fotos originales, sin dimensiones.
 */
function getFotos(p) {
  const opt  = typeof FOTOS_OPT !== 'undefined' ? FOTOS_OPT : null;
  const dims = opt && opt.prendas ? opt.prendas[p.id] : null;

  if (Array.isArray(dims) && dims.length) {
    const base = opt.base || 'public/img/';
    const url = (n, w, ext) => `${base}${encodeURIComponent(p.id)}/${n}-${w}.${ext}`;
    // Si el original era más estrecho, varias versiones miden lo mismo: una sola entrada por ancho
    const srcset = (anchos, n, ancho, ext) => [...new Map(anchos.map(w => [Math.min(w, ancho), url(n, w, ext)]))]
      .map(([w, u]) => `${u} ${w}w`).join(', ');
    const webp = opt.anchos.filter(w => w > 200);                  // 160 px: solo miniaturas
    const avif = Array.isArray(opt.anchosAvif) ? opt.anchosAvif : [];
    return dims.map(([ancho, alto, numero], i) => {
      const n = numero || i + 1;                                   // número original de la foto
      return {
        src: url(n, 800, 'webp'),
        srcset: srcset(webp, n, ancho, 'webp'),
        srcsetAvif: avif.length ? srcset(avif, n, ancho, 'avif') : '',
        thumb: url(n, 160, 'webp'),
        ancho,
        alto
      };
    });
  }
  return getImagenes(p).map(src => ({ src, srcset: '', srcsetAvif: '', thumb: src, ancho: 0, alto: 0 }));
}

/**
 * <picture> de una foto: AVIF para quien lo soporte y la WebP como respaldo.
 * opciones: { clase, sizes, alt, extra } — `extra` son atributos fijos del <img> (loading, decoding…).
 */
function fotoHTML(f, { clase = '', sizes = '', alt = '', extra = '' } = {}) {
  const sz     = sizes ? ` sizes="${sanitize(sizes)}"` : '';
  const fuente = f.srcsetAvif ? `<source type="image/avif" srcset="${sanitize(f.srcsetAvif)}"${sz}>` : '';
  const srcset = f.srcset ? ` srcset="${sanitize(f.srcset)}"${sz}` : '';
  const dims   = f.ancho ? ` width="${Number(f.ancho)}" height="${Number(f.alto)}"` : '';
  const cls    = clase ? ` class="${sanitize(clase)}"` : '';
  return `<picture>${fuente}<img${cls} src="${sanitize(f.src)}"${srcset}${dims} alt="${sanitize(alt)}"${extra ? ' ' + extra : ''}></picture>`;
}

/** Igual que fotoHTML pero con la API del DOM: devuelve el <picture> (sin pasar texto por innerHTML). */
function fotoElemento(f, { clase = '', sizes = '', alt = '' } = {}) {
  const picture = document.createElement('picture');
  if (f.srcsetAvif) {
    const fuente = document.createElement('source');
    fuente.type = 'image/avif';
    if (sizes) fuente.sizes = sizes;
    fuente.srcset = f.srcsetAvif;
    picture.append(fuente);
  }
  const img = new Image();
  if (clase) img.className = clase;
  img.alt = alt;
  img.decoding = 'async';
  if (f.srcset) { if (sizes) img.sizes = sizes; img.srcset = f.srcset; }
  img.src = f.src;
  picture.append(img);
  return picture;
}

/** Enlace para llamar. */
function enlaceTel() {
  return `tel:${CONTACTO.telefonoRaw}`;
}

/** Enlace de WhatsApp, sin mensaje escrito de antemano. */
function enlaceWhatsApp() {
  return `https://wa.me/${CONTACTO.whatsapp}`;
}
