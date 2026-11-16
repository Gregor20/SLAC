/* ============================================================
   lib.js — Utilidades compartidas (web pública y admin.html)
   Requiere que data/catalogo.js se haya cargado antes.
   ============================================================ */

'use strict';

const HTML_ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

/**
 * Escapa un valor para insertarlo de forma segura en HTML,
 * tanto como texto como dentro de atributos (comillas dobles y simples).
 */
function sanitize(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => HTML_ESCAPES[ch]);
}

// Admite tanto {imagenes: []} como {imagen: ""}
function getImagenes(p) {
  if (Array.isArray(p.imagenes) && p.imagenes.length) return p.imagenes;
  if (p.imagen) return [p.imagen];
  return [];
}

function getPortada(p) {
  return getImagenes(p)[0] || '';
}

/**
 * Fotos de una prenda listas para mostrar: [{ src, srcset, thumb }]
 * - Si scripts/optimizar-imagenes.js ya generó las versiones WebP
 *   (data/fotos-optimizadas.js), se usan: public/img/<id>/<n>-<ancho>.webp
 *   y el navegador elige el tamaño según pantalla (srcset).
 * - Si no, se usan las fotos originales: la web funciona igual, solo pesa más.
 */
function getFotos(p) {
  const opt = (typeof FOTOS_OPT !== 'undefined' && FOTOS_OPT.prendas) ? FOTOS_OPT.prendas[p.id] : 0;

  if (opt > 0) {
    const anchos = FOTOS_OPT.anchos.filter(w => w > 200);        // las de 160 px son solo miniaturas
    const url = (n, w) => `public/img/${encodeURIComponent(p.id)}/${n}-${w}.webp`;
    return Array.from({ length: opt }, (_, i) => ({
      src: url(i + 1, 800),
      srcset: anchos.map(w => `${url(i + 1, w)} ${w}w`).join(', '),
      thumb: url(i + 1, 160)
    }));
  }

  return getImagenes(p).map(src => ({ src, srcset: '', thumb: src }));
}

/** Enlace de WhatsApp para consultar una prenda concreta. */
function buildWaLink(nombre, id, bajoPedido = false) {
  const base = bajoPedido ? CONTACTO.mensajeBajoPedido : CONTACTO.mensajeBase;
  const msg = encodeURIComponent(`${base}${nombre} - Ref: ${id}`);
  return `https://wa.me/${CONTACTO.whatsapp}?text=${msg}`;
}

/** Enlace de WhatsApp genérico (sin prenda concreta). */
function buildWaGenericLink() {
  return `https://wa.me/${CONTACTO.whatsapp}?text=${encodeURIComponent(CONTACTO.mensajeGeneral)}`;
}
