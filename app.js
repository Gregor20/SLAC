/* ============================================================
   app.js — SLAC: contacto, galería, cabecera y animaciones
   Depende de: data/galeria.js, data/fotos-optimizadas.js, lib.js, visor.js
   ============================================================ */

'use strict';

// Ancho aproximado de cada foto en pantalla (el navegador elige del srcset)
const SIZES_GALERIA = '(min-width: 1100px) 360px, (min-width: 700px) 32vw, 48vw';
const PUNTERO_FINO  = window.matchMedia('(hover: hover) and (pointer: fine)');
const MOVIMIENTO_REDUCIDO = window.matchMedia('(prefers-reduced-motion: reduce)');

/* ── Contacto: el número solo está en CONTACTO ───────────── */
function rellenarContacto() {
  const tel = enlaceTel();
  const wa  = enlaceWhatsApp();
  document.querySelectorAll('[data-contact="tel"]').forEach(a => { a.href = tel; });
  document.querySelectorAll('[data-contact="wa"]').forEach(a => { a.href = wa; });
  document.querySelectorAll('[data-contact="tel-texto"]').forEach(el => { el.textContent = CONTACTO.telefono; });
}

/* ── Fotos de portada y contacto: descripción de su prenda ── */
// Mismo orden en el HTML que en PORTADA: principal, izquierda, derecha, contacto
function describirPortada() {
  document.querySelectorAll('.portada-foto, .contacto-fondo').forEach((img, k) => {
    const e = PORTADA[k];
    const prenda = e && PRENDAS.find(p => String(p.id) === String(e.prenda));
    if (prenda) img.alt = prenda.descripcion;
  });
}

/* ── Galería ─────────────────────────────────────────────── */
function piezaHTML(p) {
  const fotos = getFotos(p);
  if (!fotos.length) return '';
  const varias = fotos.length > 1
    ? `<span class="pieza-num" aria-hidden="true"><svg class="icono"><use href="#i-fotos"></use></svg>${fotos.length}</span>`
    : '';
  return `
    <li class="pieza">
      <button type="button" class="pieza-boton" data-prenda="${sanitize(p.id)}">
        <span class="pieza-id">${sanitize(numeroPrenda(p))}</span>
        ${fotoHTML(fotos[0], { clase: 'pieza-foto', sizes: SIZES_GALERIA, alt: p.descripcion, extra: 'loading="lazy" decoding="async"' })}
        ${varias}
      </button>
    </li>`;
}

function pintarGaleria() {
  const rejilla = document.getElementById('galeria-rejilla');
  rejilla.innerHTML = PRENDAS.map(piezaHTML).join('');
  return rejilla;
}

/** Con ratón: al pasar por encima se muestra la segunda foto (se descarga solo entonces). */
function iniciarSegundaFoto(rejilla) {
  rejilla.addEventListener('pointerover', e => {
    if (!PUNTERO_FINO.matches) return;
    const boton = e.target.closest('.pieza-boton');
    if (!boton || boton.dataset.alt) return;
    boton.dataset.alt = '1';
    const prenda = PRENDAS.find(p => String(p.id) === boton.dataset.prenda);
    const segunda = prenda && getFotos(prenda)[1];
    if (!segunda) return;
    const picture = fotoElemento(segunda, { clase: 'pieza-foto pieza-foto--alt', sizes: SIZES_GALERIA });
    const img = picture.querySelector('img');
    img.addEventListener('load', () => img.classList.add('lista'), { once: true });
    boton.insertBefore(picture, boton.querySelector('.pieza-num'));
  });
}

/* ── Animación de entrada de cada foto ───────────────────── */
function iniciarEntradas(rejilla) {
  const piezas = rejilla.querySelectorAll('.pieza');
  if (MOVIMIENTO_REDUCIDO.matches || !('IntersectionObserver' in window)) {
    piezas.forEach(p => p.classList.add('visible'));
    return;
  }
  const io = new IntersectionObserver(entradas => {
    entradas.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add('visible');
      io.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  piezas.forEach(p => io.observe(p));
}

/* ── Cabecera y botón flotante según la zona visible ─────── */
function iniciarCabecera() {
  const cabecera = document.getElementById('cabecera');
  const flotante = document.getElementById('flotante');
  const portada  = document.getElementById('inicio');
  const contacto = document.getElementById('contacto');
  if (!('IntersectionObserver' in window)) {
    cabecera.classList.add('cabecera--visible');
    return;
  }
  // La cabecera aparece cuando queda menos del 15 % de la portada a la vista
  new IntersectionObserver(([en]) => {
    cabecera.classList.toggle('cabecera--visible', en.intersectionRatio < 0.15);
  }, { threshold: [0, 0.15] }).observe(portada);

  // En el bloque de contacto el botón flotante sobra
  new IntersectionObserver(([en]) => {
    flotante.classList.toggle('flotante--oculto', en.isIntersecting);
  }, { threshold: 0.35 }).observe(contacto);
}

/* ── Inicio ──────────────────────────────────────────────── */
document.documentElement.classList.replace('sin-js', 'js');

document.addEventListener('DOMContentLoaded', () => {
  rellenarContacto();
  describirPortada();
  const rejilla = pintarGaleria();
  iniciarEntradas(rejilla);
  iniciarSegundaFoto(rejilla);
  iniciarCabecera();
  iniciarVisor(rejilla);
});
