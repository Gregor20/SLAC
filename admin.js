/* ============================================================
   admin.js — panel local de gestión de fotos (admin.html)
   Depende de: data/galeria.js, data/fotos-optimizadas.js y lib.js
   Trabaja en memoria: nada se guarda hasta descargar los archivos.
   ============================================================ */

'use strict';

let prendasPanel = JSON.parse(JSON.stringify(PRENDAS));      // copia editable
let portadaPanel = JSON.parse(JSON.stringify(PORTADA));
let msgTimer = null;

const $a = id => document.getElementById(id);

function mensaje(texto, esError = false) {
  const el = $a('admin-saved-msg');
  el.textContent = texto;
  el.classList.toggle('is-error', esError);
  clearTimeout(msgTimer);
  msgTimer = setTimeout(() => { el.textContent = ''; }, 7000);
}

function resumen() {
  const ocultas = prendasPanel.filter(p => p.oculta).length;
  $a('admin-resumen').textContent =
    `${prendasPanel.length} prendas · ${prendasPanel.length - ocultas} se publican · ${ocultas} ocultas`;
}

/* ── Lista ───────────────────────────────────────────────── */
function miniatura(p) {
  const f = getFotos(p)[0];
  return f ? f.thumb : '';
}

function pintarLista() {
  resumen();
  const lista = $a('admin-list');
  if (!prendasPanel.length) { lista.innerHTML = '<p class="admin-note">No hay prendas.</p>'; return; }

  lista.innerHTML = prendasPanel.map((p, i) => {
    const n = getImagenes(p).length;
    return `
    <div class="admin-item">
      <img class="admin-item-thumb" src="${sanitize(miniatura(p))}" alt="" loading="lazy" width="56" height="56">
      <div class="admin-item-info">
        <input class="admin-item-nombre" data-accion="descripcion" data-i="${i}" value="${sanitize(p.descripcion)}"
               aria-label="Descripción de ${sanitize(p.id)}">
        <span class="admin-item-cat">${sanitize(p.id)} · ${n} foto${n === 1 ? '' : 's'}</span>
      </div>
      <div class="admin-item-controls">
        <label class="admin-check"><input type="checkbox" data-accion="oculta" data-i="${i}" ${p.oculta ? 'checked' : ''}> Oculta</label>
        <button type="button" class="admin-del-btn" data-accion="eliminar" data-i="${i}" aria-label="Eliminar ${sanitize(p.id)}">✕</button>
      </div>
    </div>`;
  }).join('');
}

function iniciarLista() {
  const lista = $a('admin-list');
  lista.addEventListener('change', e => {
    const p = prendasPanel[Number(e.target.dataset.i)];
    if (!p) return;
    if (e.target.dataset.accion === 'descripcion') p.descripcion = e.target.value.trim();
    if (e.target.dataset.accion === 'oculta') {
      if (e.target.checked) p.oculta = true; else delete p.oculta;
    }
    resumen();
  });
  lista.addEventListener('click', e => {
    const b = e.target.closest('[data-accion="eliminar"]');
    if (!b) return;
    const i = Number(b.dataset.i);
    if (!prendasPanel[i] || !confirm(`¿Eliminar la prenda ${prendasPanel[i].id}?`)) return;
    prendasPanel.splice(i, 1);
    pintarLista();
  });
}

/* ── Añadir ──────────────────────────────────────────────── */
function iniciarFormulario() {
  const form = $a('form-prenda');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const id = $a('nueva-id').value.trim();
    const descripcion = $a('nueva-descripcion').value.trim();
    const imagenes = $a('nueva-imagenes').value.split('\n').map(s => s.trim()).filter(Boolean);

    if (!/^[\w-]+$/.test(id) || !descripcion || !imagenes.length) {
      mensaje('Rellena el identificador (letras, números o guiones), la descripción y al menos una foto.', true);
      return;
    }
    if (prendasPanel.some(p => String(p.id) === id)) {
      mensaje(`Ya existe una prenda con el identificador "${id}".`, true);
      return;
    }
    prendasPanel.push({ id, descripcion, imagenes });
    form.reset();
    pintarLista();
    mensaje('Prenda añadida. Descarga galeria.js y ejecuta npm run optimizar.');
  });
}

/* ── Exportar / importar ─────────────────────────────────── */
function descargar(nombre, contenido, tipo) {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  const a = Object.assign(document.createElement('a'), { href: url, download: nombre });
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** data/galeria.js público: sin prendas ocultas ni la marca "oculta". */
function generarGaleriaJS() {
  const publicas = prendasPanel.filter(p => !p.oculta)
    .map(({ id, descripcion, imagenes }) => ({ id, descripcion, imagenes }));
  return `/**
 * SLAC — datos de la galería (fuente única). Generado desde admin.html.
 *  CONTACTO  número de teléfono (el HTML no lo lleva escrito; WhatsApp sin texto)
 *  PORTADA   1 principal, 2 izquierda, 3 derecha, 4 fondo del contacto { prenda, foto }
 *  PRENDAS   id interno, descripción neutra para lectores de pantalla y fotos en orden
 * Este archivo es público: no pongas aquí nada que no deba verse.
 * Tras reemplazarlo: npm run optimizar
 */

const CONTACTO = ${JSON.stringify(CONTACTO, null, 2)};

const PORTADA = ${JSON.stringify(portadaPanel, null, 2)};

const PRENDAS = ${JSON.stringify(publicas, null, 2)};
`;
}

function iniciarExportar() {
  $a('btn-guardar').addEventListener('click', () => {
    descargar('galeria.js', generarGaleriaJS(), 'text/javascript');
    mensaje('✓ galeria.js descargado. Reemplaza data/galeria.js y ejecuta npm run optimizar.');
  });
  $a('btn-copia').addEventListener('click', () => {
    const copia = { contacto: CONTACTO, portada: portadaPanel, prendas: prendasPanel };
    descargar('galeria-completa-PRIVADO.json', JSON.stringify(copia, null, 2), 'application/json');
    mensaje('✓ Copia completa descargada. Guárdala en tu ordenador; no la subas al servidor.');
  });
  $a('input-copia').addEventListener('change', async e => {
    const archivo = e.target.files[0];
    e.target.value = '';
    if (!archivo) return;
    try {
      const datos = JSON.parse(await archivo.text());
      if (!Array.isArray(datos.prendas)) throw new Error('formato');
      prendasPanel = datos.prendas;
      if (Array.isArray(datos.portada)) portadaPanel = datos.portada;
      if (datos.contacto && typeof datos.contacto === 'object') Object.assign(CONTACTO, datos.contacto);
      pintarLista();
      mensaje(`✓ Copia cargada: ${prendasPanel.length} prendas.`);
    } catch {
      mensaje('No se pudo leer el archivo: no parece una copia completa válida (.json).', true);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  pintarLista();
  iniciarLista();
  iniciarFormulario();
  iniciarExportar();
});
