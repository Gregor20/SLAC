/* ============================================================
   app.js — SLAC Lookbook
   Lógica principal: catálogo, filtros, lightbox, admin, scroll
   ============================================================ */

'use strict';

/* ── Estado de la aplicación ─────────────────────────────── */
let catalogoActivo = JSON.parse(JSON.stringify(PRENDAS));  // copia mutable
let filtroActivo   = 'Todo';
let adminAbierto   = false;

/* ── Utilidades ──────────────────────────────────────────── */
function buildWaLink(nombre, id) {
  const msg = encodeURIComponent(
    `${CONTACTO.mensajeBase}${nombre} - Ref: ${id}`
  );
  return `https://wa.me/${CONTACTO.whatsapp}?text=${msg}`;
}

function sanitize(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Compatibilidad: admite tanto {imagenes:[]} como {imagen:""}
function getImagenes(p) {
  if (Array.isArray(p.imagenes) && p.imagenes.length) return p.imagenes;
  if (p.imagen) return [p.imagen];
  return [];
}

function getPortada(p) {
  return getImagenes(p)[0] || '';
}

/* ── Renderizar grid de prendas ──────────────────────────── */
function renderGrid() {
  const grid = document.getElementById('prendas-grid');
  if (!grid) return;

  const prendas = catalogoActivo.filter(p => {
    if (p.estado === 'oculto') return false;
    if (filtroActivo === 'Todo') return true;
    return p.categoria === filtroActivo;
  });

  if (prendas.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:var(--space-20) 0;color:var(--clr-text-muted);">
        <i class="ph ph-magnifying-glass" style="font-size:2.5rem;display:block;margin-bottom:var(--space-4);color:var(--clr-gold);"></i>
        No hay prendas en esta categoría todavía.
      </div>`;
    return;
  }

  grid.innerHTML = prendas.map((p, i) => {
    const agotado    = p.estado === 'agotado';
    const cardClass  = `prenda-card${agotado ? ' agotado' : ''}`;
    const badgeHTML  = agotado
      ? `<span class="badge-agotado">Agotado / Bajo pedido</span>` : '';
    const btnHTML    = agotado
      ? `<button class="btn-wa-card agotado-btn" disabled aria-disabled="true">
           <i class="ph ph-package" aria-hidden="true"></i> Bajo pedido — Consultar
         </button>`
      : `<a href="${buildWaLink(p.nombre, p.id)}"
            class="btn-wa-card"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Consultar ${sanitize(p.nombre)} por WhatsApp">
           <i class="ph ph-whatsapp-logo" aria-hidden="true"></i>
           Consultar por WhatsApp
         </a>`;

    return `
      <article
        class="${cardClass}"
        role="listitem"
        style="--card-delay: ${(i % 3) * 0.1}s; transition-delay: var(--card-delay)"
        data-id="${p.id}"
        aria-label="${sanitize(p.nombre)}, ${p.categoria}${agotado ? ', agotado' : ''}">

        <div class="prenda-img-wrap"
             role="button"
             tabindex="0"
             aria-label="Ver ${sanitize(p.nombre)} en detalle"
             data-lightbox="${p.id}">
          <img
            src="${sanitize(getPortada(p))}"
            alt="${sanitize(p.nombre)} — alta costura femenina"
            loading="lazy"
            width="600"
            height="800"
            style="aspect-ratio:3/4;"
          />
          ${getImagenes(p).length > 1 ? `<span class="badge-fotos" style="position:absolute;bottom:var(--space-3);right:var(--space-3);padding:2px 8px;background:rgba(7,7,7,0.78);border:1px solid rgba(212,175,55,0.3);border-radius:999px;font-size:0.6rem;font-weight:600;letter-spacing:0.08em;color:var(--clr-gold-light);backdrop-filter:blur(6px);"><i class='ph ph-images' style='font-size:0.7rem;'></i> ${getImagenes(p).length} fotos</span>` : ''}
          ${badgeHTML}
          <div class="prenda-overlay-icon" aria-hidden="true">
            <i class="ph ph-magnifying-glass-plus"></i>
          </div>
        </div>

        <div class="prenda-info">
          <span class="prenda-categoria">${sanitize(p.categoria)}</span>
          <h3 class="prenda-nombre">${sanitize(p.nombre)}</h3>
          <span class="prenda-ref">Ref. ${sanitize(p.id)}</span>
          ${btnHTML}
        </div>
      </article>`;
  }).join('');

  // Activar IntersectionObserver en las nuevas tarjetas
  observeCards();
}

/* ── Filtros de categoría ────────────────────────────────── */
function initFiltros() {
  const btns = document.querySelectorAll('.filter-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      filtroActivo = btn.dataset.filter;
      renderGrid();
    });
  });
}

/* ── Scroll reveal (IntersectionObserver) ────────────────── */
function observeCards() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.prenda-card:not(.visible)').forEach(el => io.observe(el));
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
  const handler = () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
  };
  window.addEventListener('scroll', handler, { passive: true });
  handler();
}

/* ── Menú móvil ──────────────────────────────────────────── */
function initBurger() {
  const btn   = document.getElementById('burger-btn');
  const menu  = document.getElementById('mobile-menu');
  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(isOpen));
    menu.setAttribute('aria-hidden', String(!isOpen));
  });

  // Cerrar al hacer click en un link
  menu.querySelectorAll('.mobile-link').forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-hidden', 'true');
    });
  });
}

/* ── Hero — dispara la animación de zoom out ─────────────── */
function initHero() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  // Pequeño delay para que el browser pinte la imagen antes del zoom
  requestAnimationFrame(() => hero.classList.add('loaded'));
}

/* ── LIGHTBOX (galeria multi-foto) ──────────────────────── */
let lbFotos  = [];   // array de URLs de la prenda activa
let lbIndex  = 0;   // índice de foto visible

function lbGoTo(idx) {
  if (idx < 0 || idx >= lbFotos.length) return;
  lbIndex = idx;

  const img     = document.getElementById('lightbox-img');
  const counter = document.getElementById('lb-counter');
  const prev    = document.getElementById('lb-prev');
  const next    = document.getElementById('lb-next');

  // fade suave
  img.classList.add('fading');
  setTimeout(() => {
    img.src = lbFotos[idx];
    img.alt = `Foto ${idx + 1} de ${lbFotos.length}`;
    img.classList.remove('fading');
  }, 200);

  counter.textContent = `${idx + 1} / ${lbFotos.length}`;
  prev.disabled = idx === 0;
  next.disabled = idx === lbFotos.length - 1;

  // miniaturas activas
  document.querySelectorAll('.lb-thumb').forEach((t, i) => {
    t.classList.toggle('active', i === idx);
  });
}

function openLightbox(id) {
  const prenda = catalogoActivo.find(p => p.id === id);
  if (!prenda) return;

  lbFotos = getImagenes(prenda);
  if (!lbFotos.length) return;

  const lb     = document.getElementById('lightbox');
  const nombre = document.getElementById('lightbox-nombre');
  const ref    = document.getElementById('lightbox-ref');
  const waBtn  = document.getElementById('lightbox-wa-btn');
  const thumbs = document.getElementById('lb-thumbs');

  nombre.textContent = prenda.nombre;
  ref.textContent    = `Ref. ${prenda.id} · ${prenda.categoria}`;

  // construir miniaturas
  thumbs.innerHTML = lbFotos.map((src, i) => `
    <button class="lb-thumb${i === 0 ? ' active' : ''}" data-thumb="${i}"
            role="listitem" aria-label="Ver foto ${i + 1}">
      <img src="${sanitize(src)}" alt="Miniatura ${i + 1}" loading="lazy" />
    </button>`).join('');

  thumbs.querySelectorAll('.lb-thumb').forEach(btn => {
    btn.addEventListener('click', () => lbGoTo(Number(btn.dataset.thumb)));
  });

  if (prenda.estado === 'agotado') {
    waBtn.style.opacity       = '0.5';
    waBtn.style.pointerEvents = 'none';
    waBtn.innerHTML = '<i class="ph ph-package" aria-hidden="true"></i> Agotado / Bajo pedido';
  } else {
    waBtn.style.opacity       = '1';
    waBtn.style.pointerEvents = 'auto';
    waBtn.href = buildWaLink(prenda.nombre, prenda.id);
    waBtn.innerHTML = '<i class="ph ph-whatsapp-logo" aria-hidden="true"></i> Consultar por WhatsApp';
  }

  lb.classList.add('open');
  lb.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  lbGoTo(0);
  document.getElementById('lightbox-close').focus();
}

function closeLightbox() {
  const lb = document.getElementById('lightbox');
  lb.classList.remove('open');
  lb.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  document.getElementById('lightbox-img').src = '';
  document.getElementById('lb-thumbs').innerHTML = '';
  lbFotos = []; lbIndex = 0;
}

function initLightbox() {
  // Delegacion de eventos en el grid
  document.getElementById('prendas-grid').addEventListener('click', e => {
    const trigger = e.target.closest('[data-lightbox]');
    if (trigger) openLightbox(trigger.dataset.lightbox);
  });

  document.getElementById('prendas-grid').addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const trigger = e.target.closest('[data-lightbox]');
    if (trigger) { e.preventDefault(); openLightbox(trigger.dataset.lightbox); }
  });

  document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
  document.getElementById('lightbox-backdrop').addEventListener('click', closeLightbox);
  document.getElementById('lb-prev').addEventListener('click', () => lbGoTo(lbIndex - 1));
  document.getElementById('lb-next').addEventListener('click', () => lbGoTo(lbIndex + 1));

  document.addEventListener('keydown', e => {
    const lb = document.getElementById('lightbox');
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape')      closeLightbox();
    if (e.key === 'ArrowLeft')   lbGoTo(lbIndex - 1);
    if (e.key === 'ArrowRight')  lbGoTo(lbIndex + 1);
  });
}

/* ── PANEL ADMIN ─────────────────────────────────────────── */
function openAdmin() {
  const panel    = document.getElementById('admin-panel');
  const backdrop = document.getElementById('admin-backdrop');
  panel.classList.add('open');
  backdrop.classList.add('open');
  panel.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  adminAbierto = true;
  renderAdminList();
}

function closeAdmin() {
  const panel    = document.getElementById('admin-panel');
  const backdrop = document.getElementById('admin-backdrop');
  panel.classList.remove('open');
  backdrop.classList.remove('open');
  panel.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  adminAbierto = false;
}

function renderAdminList() {
  const list = document.getElementById('admin-list');
  if (!list) return;

  if (catalogoActivo.length === 0) {
    list.innerHTML = `<p style="color:var(--clr-text-muted);font-size:0.875rem;">El catálogo está vacío.</p>`;
    return;
  }

  list.innerHTML = catalogoActivo.map((p, i) => `
    <div class="admin-item" data-admin-id="${p.id}">
      <img class="admin-item-thumb" src="${sanitize(p.imagen)}" alt="${sanitize(p.nombre)}" loading="lazy" width="56" height="56"/>
      <div class="admin-item-info">
        <span class="admin-item-nombre" title="${sanitize(p.nombre)}">${sanitize(p.nombre)}</span>
        <span class="admin-item-cat">${sanitize(p.categoria)} · Ref. ${sanitize(p.id)}</span>
      </div>
      <div class="admin-item-controls">
        <select class="admin-estado-select" data-idx="${i}" aria-label="Estado de ${sanitize(p.nombre)}">
          <option value="disponible" ${p.estado === 'disponible' ? 'selected' : ''}>Disponible</option>
          <option value="agotado"    ${p.estado === 'agotado'    ? 'selected' : ''}>Agotado</option>
          <option value="oculto"     ${p.estado === 'oculto'     ? 'selected' : ''}>Oculto</option>
        </select>
        <button class="admin-del-btn" data-idx="${i}" aria-label="Eliminar ${sanitize(p.nombre)}">
          <i class="ph ph-trash" aria-hidden="true"></i>
        </button>
      </div>
    </div>`).join('');

  // Cambios de estado
  list.querySelectorAll('.admin-estado-select').forEach(sel => {
    sel.addEventListener('change', e => {
      const idx = Number(e.target.dataset.idx);
      catalogoActivo[idx].estado = e.target.value;
      renderGrid();
    });
  });

  // Eliminar prenda
  list.querySelectorAll('.admin-del-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const idx = Number(e.currentTarget.dataset.idx);
      const nombre = catalogoActivo[idx].nombre;
      if (!confirm(`¿Eliminar "${nombre}" del catálogo?`)) return;
      catalogoActivo.splice(idx, 1);
      renderAdminList();
      renderGrid();
    });
  });
}

function initAdmin() {
  // Añadir prenda
  document.getElementById('btn-agregar-prenda').addEventListener('click', () => {
    const nombre    = document.getElementById('nueva-nombre').value.trim();
    const id        = document.getElementById('nueva-ref').value.trim();
    const categoria = document.getElementById('nueva-categoria').value;
    const imagen    = document.getElementById('nueva-imagen').value.trim();

    if (!nombre || !id || !imagen) {
      alert('Rellena al menos el Nombre, la Referencia y la URL de imagen.');
      return;
    }

    if (catalogoActivo.find(p => p.id === id)) {
      alert(`Ya existe una prenda con la referencia "${id}". Usa otra.`);
      return;
    }

    catalogoActivo.push({ id, nombre, categoria, imagen, estado: 'disponible' });
    document.getElementById('nueva-nombre').value  = '';
    document.getElementById('nueva-ref').value     = '';
    document.getElementById('nueva-imagen').value  = '';
    renderAdminList();
    renderGrid();
    showSavedMsg('Prenda añadida. Recuerda descargar el catálogo actualizado.');
  });

  // Cerrar panel
  document.getElementById('admin-close').addEventListener('click', closeAdmin);
  document.getElementById('admin-backdrop').addEventListener('click', closeAdmin);

  // Guardar / descargar catalogo.js
  document.getElementById('btn-guardar-catalogo').addEventListener('click', () => {
    const content = generarCatalogoJS();
    const blob = new Blob([content], { type: 'text/javascript' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), {
      href: url,
      download: 'catalogo.js'
    });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showSavedMsg('✓ catalogo.js descargado. Reemplaza el archivo en data/ y recarga la web.');
  });

  // Detectar modo admin en URL
  checkAdminMode();
}

function showSavedMsg(msg) {
  const el = document.getElementById('admin-saved-msg');
  el.textContent = msg;
  setTimeout(() => { el.textContent = ''; }, 5000);
}

function generarCatalogoJS() {
  const prendasJson = JSON.stringify(catalogoActivo, null, 2);
  const contactoJson = JSON.stringify(CONTACTO, null, 2);
  return `/**
 * ============================================================
 *  CATÁLOGO — Edita aquí para gestionar las prendas
 * ============================================================
 *  estado: "disponible" | "agotado" | "oculto"
 * ============================================================
 */

const CONTACTO = ${contactoJson};

const PRENDAS = ${prendasJson};
`;
}

function checkAdminMode() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('admin') === 'true') {
    // Mostrar indicador discreto
    const badge = document.createElement('button');
    badge.id = 'admin-badge';
    badge.setAttribute('aria-label', 'Abrir panel de gestión');
    badge.style.cssText = `
      position:fixed;bottom:var(--space-8);left:var(--space-6);
      z-index:var(--z-fab);padding:6px 14px;
      background:rgba(212,175,55,0.15);border:1px solid rgba(212,175,55,0.4);
      border-radius:var(--radius-pill);font-family:var(--font-body);
      font-size:0.75rem;font-weight:600;color:var(--clr-gold);
      cursor:pointer;display:flex;align-items:center;gap:6px;
      letter-spacing:0.06em;`;
    badge.innerHTML = '<i class="ph ph-sliders" style="font-size:1rem;"></i> Gestión';
    badge.addEventListener('click', openAdmin);
    document.body.appendChild(badge);
  }
}

/* ── CONTACTO — actualiza links con datos del catálogo ───── */
function applyContactoData() {
  // Teléfonos
  document.querySelectorAll('a[href^="tel:"]').forEach(a => {
    a.href = `tel:${CONTACTO.telefonoRaw}`;
  });

  // WhatsApp links genéricos (sin prenda específica)
  const waGeneric = encodeURIComponent('Hola, me gustaría consultar la colección disponible.');
  document.querySelectorAll(`a[href^="https://wa.me/"]`).forEach(a => {
    if (!a.href.includes(CONTACTO.mensajeBase.substring(0, 10))) {
      a.href = `https://wa.me/${CONTACTO.whatsapp}?text=${waGeneric}`;
    }
  });
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
  initAdmin();
});
