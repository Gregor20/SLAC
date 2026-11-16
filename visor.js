/* ============================================================
   visor.js — visor de fotos de una prenda (<dialog> nativo)
   showModal() aporta foco atrapado, cierre con Escape y devolución
   del foco a la foto que lo abrió.
   Depende de: data/galeria.js y lib.js · Lo inicia app.js.
   ============================================================ */

'use strict';

const SIZES_VISOR = '(min-width: 900px) 70vh, 100vw';
const UMBRAL_DESLIZAR = 50;          // px horizontales para cambiar de foto

const estadoVisor = { fotos: [], indice: 0, descripcion: '', turno: 0 };
const $v = id => document.getElementById(id);

function precargar(f) {
  if (!f) return;
  const img = new Image();
  if (f.srcset) { img.sizes = SIZES_VISOR; img.srcset = f.srcset; }
  img.src = f.src;
}

function mostrarFoto(i, inmediato = false) {
  const { fotos } = estadoVisor;
  if (i < 0 || i >= fotos.length) return;
  estadoVisor.indice = i;
  const turno = ++estadoVisor.turno;              // descarta cambios anteriores aún pendientes
  const img = $v('visor-foto');

  const aplicar = () => {
    if (turno !== estadoVisor.turno) return;
    const f = fotos[i];
    if (f.srcset) { img.sizes = SIZES_VISOR; img.srcset = f.srcset; } else { img.removeAttribute('srcset'); }
    img.src = f.src;
    img.alt = fotos.length > 1 ? `${estadoVisor.descripcion} (foto ${i + 1} de ${fotos.length})` : estadoVisor.descripcion;
    img.classList.remove('fundido');
  };
  if (inmediato) aplicar(); else { img.classList.add('fundido'); setTimeout(aplicar, 180); }

  $v('visor-contador').textContent = `${i + 1} / ${fotos.length}`;
  $v('visor-ant').disabled = i === 0;
  $v('visor-sig').disabled = i === fotos.length - 1;
  $v('visor-miniaturas').querySelectorAll('.visor-mini').forEach((b, j) => b.setAttribute('aria-current', String(j === i)));
  precargar(fotos[i - 1]);
  precargar(fotos[i + 1]);
}

function abrirVisor(id) {
  const visor = $v('visor');
  const prenda = PRENDAS.find(p => String(p.id) === String(id));
  if (visor.open || !prenda) return;
  estadoVisor.fotos = getFotos(prenda);
  if (!estadoVisor.fotos.length) return;
  estadoVisor.descripcion = prenda.descripcion;

  const varias = estadoVisor.fotos.length > 1;
  visor.classList.toggle('visor--una', !varias);
  visor.setAttribute('aria-label', prenda.descripcion);
  $v('visor-miniaturas').innerHTML = varias ? estadoVisor.fotos.map((f, i) => `
    <button type="button" class="visor-mini" data-foto="${i}" aria-label="Foto ${i + 1} de ${estadoVisor.fotos.length}">
      <img src="${sanitize(f.thumb)}" alt="" loading="lazy" decoding="async">
    </button>`).join('') : '';

  document.documentElement.classList.add('sin-scroll');
  visor.showModal();
  mostrarFoto(0, true);
}

function limpiarVisor() {
  const img = $v('visor-foto');
  estadoVisor.turno++;
  img.removeAttribute('srcset');
  img.removeAttribute('src');
  img.alt = '';
  $v('visor-miniaturas').innerHTML = '';
  document.documentElement.classList.remove('sin-scroll');
  Object.assign(estadoVisor, { fotos: [], indice: 0, descripcion: '' });
}

function iniciarVisor(rejilla) {
  const visor  = $v('visor');
  const escena = $v('visor-escena');

  rejilla.addEventListener('click', e => {
    const boton = e.target.closest('[data-prenda]');
    if (boton) abrirVisor(boton.dataset.prenda);
  });

  $v('visor-cerrar').addEventListener('click', () => visor.close());
  $v('visor-ant').addEventListener('click', () => mostrarFoto(estadoVisor.indice - 1));
  $v('visor-sig').addEventListener('click', () => mostrarFoto(estadoVisor.indice + 1));
  $v('visor-miniaturas').addEventListener('click', e => {
    const b = e.target.closest('[data-foto]');
    if (b) mostrarFoto(Number(b.dataset.foto));
  });
  visor.addEventListener('close', limpiarVisor);

  // Tocar fuera de la foto (fondo del visor o de la escena) cierra
  visor.addEventListener('click', e => { if (e.target === visor || e.target === escena) visor.close(); });

  visor.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft')  mostrarFoto(estadoVisor.indice - 1);
    if (e.key === 'ArrowRight') mostrarFoto(estadoVisor.indice + 1);
  });

  // Deslizar con el dedo
  let inicioX = null;
  escena.addEventListener('touchstart', e => { inicioX = e.changedTouches[0].clientX; }, { passive: true });
  escena.addEventListener('touchend', e => {
    if (inicioX === null) return;
    const dx = e.changedTouches[0].clientX - inicioX;
    inicioX = null;
    if (Math.abs(dx) > UMBRAL_DESLIZAR) mostrarFoto(estadoVisor.indice + (dx < 0 ? 1 : -1));
  }, { passive: true });
}
