/* ============================================================
   app.js — SLAC Lookbook (web pública)
   Catálogo, filtros, lightbox, menú móvil, scroll y contacto.
   Depende de: data/catalogo.js (CONTACTO, PRENDAS) y lib.js
   La gestión del catálogo vive en admin.html (no en esta web).
   ============================================================ */

'use strict';

/* ── Estado ──────────────────────────────────────────────── */
const catalogo = PRENDAS;
let filtroActivo = 'Todo';

// Tamaños en pantalla aproximados (el navegador elige la imagen del srcset según estos)
const SIZES_CARD     = '(min-width: 900px) 363px, (min-width: 540px) 45vw, 92vw';
const SIZES_LIGHTBOX = '(min-width: 540px) 480px, 92vw';

/* ── Contacto: única fuente de verdad = CONTACTO ─────────── */
// El HTML no contiene números: solo marcas data-contact="tel | tel-text | wa".
function applyContactoData() {
  const telHref = `tel:${CONTACTO.telefonoRaw}`;
  document.querySelectorAll('[data-contact="tel"]').forEach(a => { a.href = telHref; });

  // Texto visible del teléfono (antes solo se actualizaban los href)
  document.querySelectorAll('[data-contact="tel-text"]').forEach(el => {
    el.textContent = CONTACTO.telefono;
  });

  const waHref = buildWaGenericLink();
  document.querySelectorAll('[data-contact="wa"]').forEach(a => { a.href = waHref; });
}

/* ── Grid de prendas ─────────────────────────────────────── */
function coincideFiltro(p) {
  if (filtroActivo === 'Todo') return true;
  if (filtroActivo === 'Novedades') return p.nueva === true;   // etiqueta, no categoría
  return p.categoria === filtroActivo;
}

function cardHTML(p) {
  const id        = sanitize(p.id);
  const nombre    = sanitize(p.nombre);
  const categoria = sanitize(p.categoria);
  const fotos     = getFotos(p);
  const portada   = fotos[0] || { src: '', srcset: '' };
  const agotado   = p.estado === 'agotado';

  const btnLabel = agotado ? 'Bajo pedido — Consultar' : 'Consultar por WhatsApp';
  const btnIcon  = agotado ? 'ph-package' : 'ph-whatsapp-logo';
  const waHref   = sanitize(buildWaLink(p.nombre, p.id, agotado));

  const badges = [
    fotos.length > 1
      ? `<span class="badge-fotos"><i class="ph ph-images" aria-hidden="true"></i> ${fotos.length} fotos</span>` : '',
    p.nueva   ? '<span class="badge-nueva">Nueva</span>' : '',
    agotado   ? '<span class="badge-agotado">Agotado / Bajo pedido</span>' : ''
  ].join('');

  return `
    <article class="prenda-card${agotado ? ' agotado' : ''}" data-id="${id}">
      <button type="button" class="prenda-img-wrap" data-lightbox="${id}"
              aria-label="Ver ${nombre} en detalle">
        <img src="${sanitize(portada.src)}"${portada.srcset ? ` srcset="${sanitize(portada.srcset)}" sizes="${SIZES_CARD}"` : ''}
             alt="${nombre} — alta costura femenina"
             loading="lazy" decoding="async" width="600" height="800" />
        ${badges}
        <span class="prenda-overlay-icon" aria-hidden="true">
          <i class="ph ph-magnifying-glass-plus"></i>
        </span>
      </button>

      <div class="prenda-info">
        <span class="prenda-categoria">${categoria}</span>
        <h3 class="prenda-nombre">${nombre}</h3>
        <span class="prenda-ref">Ref. ${id}</span>
        <a href="${waHref}"
           class="btn-wa-card${agotado ? ' agotado-btn' : ''}"
           target="_blank" rel="noopener noreferrer"
           aria-label="${btnLabel}: ${nombre}">
          <i class="ph ${btnIcon}" aria-hidden="true"></i> ${btnLabel}
        </a>
      </div>
    </article>`;
}

function anunciarResultados(n) {
  const el = document.getElementById('filtro-status');
  if (el) el.textContent = n === 1 ? '1 prenda mostrada' : `${n} prendas mostradas`;
}

function renderGrid(anunciar = false) {
  const grid = document.getElementById('prendas-grid');
  if (!grid) return;

  const prendas = catalogo.filter(coincideFiltro);
  if (anunciar) anunciarResultados(prendas.length);

  if (prendas.length === 0) {
    grid.innerHTML = `
      <div class="grid-empty">
        <i class="ph ph-magnifying-glass" aria-hidden="true"></i>
        <p>No hay prendas en esta categoría todavía.</p>
      </div>`;
    return;
  }

  grid.innerHTML = prendas.map(cardHTML).join('');
  observeCards();
}

/* ── Filtros (botones con aria-pressed) ──────────────────── */
function initFiltros() {
  const btns = document.querySelectorAll('.filter-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
      filtroActivo = btn.dataset.filter;
      renderGrid(true);
    });
  });
}

/* ── Scroll reveal (IntersectionObserver) ────────────────── */
const cardObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      cardObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

function observeCards() {
  cardObserver.disconnect();
  document.querySelectorAll('.prenda-card:not(.visible)').forEach(el => cardObserver.observe(el));
}

function initRevealFade() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

  document.querySelectorAll('.reveal-fade').forEach(el => io.observe(el));
}

/* ── Header sticky con scroll ────────────────────────────── */
function initHeader() {
  const header = document.getElementById('site-header');
  const handler = () => header.classList.toggle('scrolled', window.scrollY > 20);
  window.addEventListener('scroll', handler, { passive: true });
  handler();
}

/* ── Menú móvil (inert cuando está cerrado) ──────────────── */
function initBurger() {
  const btn  = document.getElementById('burger-btn');
  const menu = document.getElementById('mobile-menu');
  if (!btn || !menu) return;

  const setOpen = (open) => {
    menu.classList.toggle('open', open);
    menu.inert = !open;                       // cerrado → sin foco ni lectura
    btn.setAttribute('aria-expanded', String(open));
  };
  setOpen(false);

  btn.addEventListener('click', () => setOpen(!menu.classList.contains('open')));
  menu.querySelectorAll('.mobile-link').forEach(link => {
    link.addEventListener('click', () => setOpen(false));
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu.classList.contains('open')) {
      setOpen(false);
      btn.focus();
    }
  });
}

/* ── Hero — dispara la animación de zoom out ─────────────── */
function initHero() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  requestAnimationFrame(() => hero.classList.add('loaded'));
}

/* ── LIGHTBOX (<dialog> + galería multi-foto) ────────────── */
let lbFotos  = [];     // URLs de la prenda activa
let lbIndex  = 0;      // foto visible
let lbNombre = '';     // nombre de la prenda (para el alt)
let lbToken  = 0;      // invalida fades pendientes (evita carreras al navegar rápido)

function lbGoTo(idx, instant = false) {
  if (idx < 0 || idx >= lbFotos.length) return;
  lbIndex = idx;

  const img     = document.getElementById('lightbox-img');
  const counter = document.getElementById('lb-counter');
  const prev    = document.getElementById('lb-prev');
  const next    = document.getElementById('lb-next');
  const token   = ++lbToken;

  const aplicar = () => {
    if (token !== lbToken) return;            // llegó una navegación más reciente (o se cerró)
    const foto = lbFotos[idx];
    if (foto.srcset) {
      img.sizes  = SIZES_LIGHTBOX;
      img.srcset = foto.srcset;
    } else {
      img.removeAttribute('srcset');
      img.removeAttribute('sizes');
    }
    img.src = foto.src;
    img.alt = `${lbNombre} — foto ${idx + 1} de ${lbFotos.length}`;
    img.classList.remove('fading');
  };

  if (instant) {
    aplicar();
  } else {
    img.classList.add('fading');
    setTimeout(aplicar, 200);
  }

  counter.textContent = `${idx + 1} / ${lbFotos.length}`;
  prev.disabled = idx === 0;
  next.disabled = idx === lbFotos.length - 1;

  document.querySelectorAll('.lb-thumb').forEach((t, i) => {
    t.classList.toggle('active', i === idx);
    t.setAttribute('aria-current', String(i === idx));
  });

  // Precarga de las fotos contiguas para que el cambio sea instantáneo
  [idx - 1, idx + 1].forEach(j => {
    const f = lbFotos[j];
    if (!f) return;
    const pre = new Image();
    if (f.srcset) { pre.sizes = SIZES_LIGHTBOX; pre.srcset = f.srcset; }
    pre.src = f.src;
  });
}

function openLightbox(id) {
  const lb = document.getElementById('lightbox');
  if (lb.open) return;

  const prenda = catalogo.find(p => p.id === id);
  if (!prenda) return;

  lbFotos = getFotos(prenda);
  if (!lbFotos.length) return;
  lbNombre = prenda.nombre;

  const agotado = prenda.estado === 'agotado';
  const waBtn   = document.getElementById('lightbox-wa-btn');

  document.getElementById('lightbox-nombre').textContent = prenda.nombre;
  document.getElementById('lightbox-ref').textContent    = `Ref. ${prenda.id} · ${prenda.categoria}`;

  document.getElementById('lb-thumbs').innerHTML = lbFotos.map((f, i) => `
    <button type="button" class="lb-thumb${i === 0 ? ' active' : ''}" data-thumb="${i}"
            aria-label="Ver foto ${i + 1} de ${lbFotos.length}">
      <img src="${sanitize(f.thumb)}" alt="" loading="lazy" decoding="async" />
    </button>`).join('');

  // El href se fija SIEMPRE con la prenda actual (y se borra al cerrar).
  // Las prendas agotadas también se pueden consultar "bajo pedido".
  waBtn.href = buildWaLink(prenda.nombre, prenda.id, agotado);
  waBtn.innerHTML = agotado
    ? '<i class="ph ph-package" aria-hidden="true"></i> Bajo pedido — Consultar'
    : '<i class="ph ph-whatsapp-logo" aria-hidden="true"></i> Consultar por WhatsApp';

  document.body.classList.add('no-scroll');
  lb.showModal();
  lbGoTo(0, true);
}

function limpiarLightbox() {
  const waBtn = document.getElementById('lightbox-wa-btn');
  const img   = document.getElementById('lightbox-img');

  lbToken++;                                  // cancela fades pendientes
  img.removeAttribute('srcset');
  img.removeAttribute('sizes');
  img.removeAttribute('src');                 // sin src="" (evita peticiones espurias)
  img.alt = '';
  document.getElementById('lb-thumbs').innerHTML = '';
  waBtn.removeAttribute('href');              // un <a> sin href no recibe foco
  document.body.classList.remove('no-scroll');
  lbFotos = [];
  lbIndex = 0;
  lbNombre = '';
}

function initLightbox() {
  const lb    = document.getElementById('lightbox');
  const grid  = document.getElementById('prendas-grid');
  const thumbs = document.getElementById('lb-thumbs');
  const wrap  = lb.querySelector('.lb-img-wrap');

  // Abrir (delegación; la tarjeta usa un <button> real → teclado gratis)
  grid.addEventListener('click', e => {
    const trigger = e.target.closest('[data-lightbox]');
    if (trigger) openLightbox(trigger.dataset.lightbox);
  });

  // Cerrar: botón, clic en el fondo (el propio <dialog>) y Esc (nativo)
  document.getElementById('lightbox-close').addEventListener('click', () => lb.close());
  lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });
  lb.addEventListener('close', limpiarLightbox);

  // Navegación
  document.getElementById('lb-prev').addEventListener('click', () => lbGoTo(lbIndex - 1));
  document.getElementById('lb-next').addEventListener('click', () => lbGoTo(lbIndex + 1));
  thumbs.addEventListener('click', e => {
    const b = e.target.closest('[data-thumb]');
    if (b) lbGoTo(Number(b.dataset.thumb));
  });
  lb.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft')  lbGoTo(lbIndex - 1);
    if (e.key === 'ArrowRight') lbGoTo(lbIndex + 1);
  });

  // Swipe en móvil (las flechas van superpuestas, la foto ocupa todo el ancho)
  let touchStartX = null;
  wrap.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });
  wrap.addEventListener('touchend', e => {
    if (touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    touchStartX = null;
    if (Math.abs(dx) > 50) lbGoTo(lbIndex + (dx < 0 ? 1 : -1));
  }, { passive: true });
}

/* ── INIT ────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  applyContactoData();
  renderGrid();
  initFiltros();
  initRevealFade();
  initHeader();
  initBurger();
  initHero();
  initLightbox();
});
