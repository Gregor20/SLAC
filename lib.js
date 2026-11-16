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

function getImagenes(p) {
  return Array.isArray(p.imagenes) ? p.imagenes : [];
}

/**
 * Fotos de una prenda listas para pintar: [{ src, srcset, thumb, ancho, alto }]
 * - Con data/fotos-optimizadas.js: WebP de public/img/<id>/<n>-<ancho>.webp y sus
 *   dimensiones reales (el navegador reserva el hueco y elige el tamaño).
 * - Sin él: las fotos originales, sin dimensiones.
 */
function getFotos(p) {
  const opt  = typeof FOTOS_OPT !== 'undefined' ? FOTOS_OPT : null;
  const dims = opt && opt.prendas ? opt.prendas[p.id] : null;

  if (Array.isArray(dims) && dims.length) {
    const anchos = opt.anchos.filter(w => w > 200);               // 160 px: solo miniaturas
    const url = (n, w) => `public/img/${encodeURIComponent(p.id)}/${n}-${w}.webp`;
    // Si el original era más estrecho, varias versiones miden lo mismo: una sola entrada por ancho
    const srcset = (n, ancho) => [...new Map(anchos.map(w => [Math.min(w, ancho), url(n, w)]))]
      .map(([w, u]) => `${u} ${w}w`).join(', ');
    return dims.map(([ancho, alto], i) => ({
      src: url(i + 1, 800),
      srcset: srcset(i + 1, ancho),
      thumb: url(i + 1, 160),
      ancho,
      alto
    }));
  }
  return getImagenes(p).map(src => ({ src, srcset: '', thumb: src, ancho: 0, alto: 0 }));
}

/** Enlace para llamar. */
function enlaceTel() {
  return `tel:${CONTACTO.telefonoRaw}`;
}

/** Enlace de WhatsApp, sin mensaje escrito de antemano. */
function enlaceWhatsApp() {
  return `https://wa.me/${CONTACTO.whatsapp}`;
}
