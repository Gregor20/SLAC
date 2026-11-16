/* ============================================================
   admin.js — Panel de gestión del catálogo (admin.html)
   Depende de: data/catalogo.js (CONTACTO, PRENDAS) y lib.js
   Trabaja en memoria: nada se guarda hasta que descargas los archivos.
   ============================================================ */

'use strict';

let catalogoActivo = JSON.parse(JSON.stringify(PRENDAS));   // copia mutable

const ESTADOS = [
  ['disponible', 'Disponible'],
  ['agotado',    'Agotado'],
  ['oculto',     'Oculto (no se publica)']
];

/* ── Mensajes y resumen ──────────────────────────────────── */
let msgTimer = null;

function showMsg(msg, esError = false) {
  const el = document.getElementById('admin-saved-msg');
  el.textContent = msg;
  el.classList.toggle('is-error', esError);
  clearTimeout(msgTimer);
  msgTimer = setTimeout(() => { el.textContent = ''; }, 6000);
}

function actualizarResumen() {
  const total    = catalogoActivo.length;
  const ocultas  = catalogoActivo.filter(p => p.estado === 'oculto').length;
  const nuevas   = catalogoActivo.filter(p => p.nueva).length;
  document.getElementById('admin-resumen').textContent =
    `${total} prendas en total · ${total - ocultas} se publicarán · ${ocultas} ocultas · ${nuevas} marcadas como nuevas`;
}

/* ── Lista de gestión ────────────────────────────────────── */
function renderAdminList() {
  const list = document.getElementById('admin-list');
  actualizarResumen();

  if (catalogoActivo.length === 0) {
    list.innerHTML = '<p class="admin-note">El catálogo está vacío.</p>';
    return;
  }

  list.innerHTML = catalogoActivo.map((p, i) => {
    const nombre = sanitize(p.nombre);
    const nFotos = getImagenes(p).length;
    return `
    <div class="admin-item" data-admin-id="${sanitize(p.id)}">
      <img class="admin-item-thumb" src="${sanitize(getPortada(p))}" alt="" loading="lazy" width="56" height="56" />
      <div class="admin-item-info">
        <span class="admin-item-nombre" title="${nombre}">${nombre}</span>
        <span class="admin-item-cat">${sanitize(p.categoria)} · Ref. ${sanitize(p.id)} · ${nFotos} foto${nFotos === 1 ? '' : 's'}</span>
      </div>
      <div class="admin-item-controls">
        <label class="admin-check">
          <input type="checkbox" data-action="nueva" data-idx="${i}" ${p.nueva ? 'checked' : ''} /> Nueva
        </label>
        <select class="admin-estado-select" data-action="estado" data-idx="${i}" aria-label="Estado de ${nombre}">
          ${ESTADOS.map(([valor, texto]) =>
            `<option value="${valor}"${p.estado === valor ? ' selected' : ''}>${texto}</option>`).join('')}
        </select>
        <button type="button" class="admin-del-btn" data-action="eliminar" data-idx="${i}" aria-label="Eliminar ${nombre}">
          <i class="ph ph-trash" aria-hidden="true"></i>
        </button>
      </div>
    </div>`;
  }).join('');
}

function initLista() {
  const list = document.getElementById('admin-list');

  // Delegación: cambios de estado y de la etiqueta "Nueva"
  list.addEventListener('change', e => {
    const el  = e.target;
    const idx = Number(el.dataset.idx);
    if (!Number.isInteger(idx) || !catalogoActivo[idx]) return;

    if (el.dataset.action === 'estado') {
      catalogoActivo[idx].estado = el.value;
    } else if (el.dataset.action === 'nueva') {
      if (el.checked) catalogoActivo[idx].nueva = true;
      else delete catalogoActivo[idx].nueva;
    }
    actualizarResumen();
  });

  // Delegación: eliminar
  list.addEventListener('click', e => {
    const btn = e.target.closest('[data-action="eliminar"]');
    if (!btn) return;
    const idx = Number(btn.dataset.idx);
    const prenda = catalogoActivo[idx];
    if (!prenda || !confirm(`¿Eliminar "${prenda.nombre}" del catálogo?`)) return;
    catalogoActivo.splice(idx, 1);
    renderAdminList();
  });
}

/* ── Añadir prenda ───────────────────────────────────────── */
function initFormulario() {
  const form = document.getElementById('form-prenda');

  form.addEventListener('submit', e => {
    e.preventDefault();

    const nombre    = document.getElementById('nueva-nombre').value.trim();
    const id        = document.getElementById('nueva-ref').value.trim();
    const categoria = document.getElementById('nueva-categoria').value;
    const nueva     = document.getElementById('nueva-flag').checked;
    const imagenes  = document.getElementById('nueva-imagenes').value
      .split('\n').map(s => s.trim()).filter(Boolean);

    if (!nombre || !id || imagenes.length === 0) {
      showMsg('Rellena el nombre, la referencia y al menos una foto.', true);
      return;
    }
    if (catalogoActivo.some(p => p.id === id)) {
      showMsg(`Ya existe una prenda con la referencia "${id}". Usa otra.`, true);
      return;
    }

    const prenda = { id, nombre, categoria, imagenes, estado: 'disponible' };
    if (nueva) prenda.nueva = true;
    catalogoActivo.push(prenda);

    form.reset();
    renderAdminList();
    showMsg('Prenda añadida. Recuerda descargar el catalogo.js actualizado.');
  });
}

/* ── Exportar / importar ─────────────────────────────────── */
function descargar(nombreArchivo, contenido, tipo) {
  const blob = new Blob([contenido], { type: tipo });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href: url, download: nombreArchivo });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** catalogo.js PÚBLICO: excluye las prendas ocultas. */
function generarCatalogoJS() {
  const publicas = catalogoActivo.filter(p => p.estado !== 'oculto');
  return `/**
 * ============================================================
 *  CATÁLOGO SLAC — Colección Haute Couture
 * ============================================================
 *  Generado desde admin.html. Fuente única de contacto y prendas.
 *  estado: "disponible" | "agotado"
 *  nueva: true → aparece en el filtro "Novedades" y lleva badge.
 *  Las prendas ocultas NO se incluyen (este archivo es público).
 * ============================================================
 */

const CONTACTO = ${JSON.stringify(CONTACTO, null, 2)};

const PRENDAS = ${JSON.stringify(publicas, null, 2)};
`;
}

function initExportar() {
  document.getElementById('btn-guardar-catalogo').addEventListener('click', () => {
    descargar('catalogo.js', generarCatalogoJS(), 'text/javascript');
    const ocultas = catalogoActivo.filter(p => p.estado === 'oculto').length;
    showMsg(`✓ catalogo.js descargado (${ocultas} ocultas excluidas). Reemplaza data/catalogo.js y vuelve a subir la web.`);
  });

  document.getElementById('btn-copia-completa').addEventListener('click', () => {
    const copia = JSON.stringify({ contacto: CONTACTO, prendas: catalogoActivo }, null, 2);
    descargar('catalogo-completo-PRIVADO.json', copia, 'application/json');
    showMsg('✓ Copia completa descargada. Guárdala en tu ordenador; no la subas al servidor.');
  });

  document.getElementById('input-copia').addEventListener('change', async e => {
    const file = e.target.files[0];
    e.target.value = '';                       // permite volver a cargar el mismo archivo
    if (!file) return;

    try {
      const data = JSON.parse(await file.text());
      if (!Array.isArray(data.prendas)) throw new Error('formato');
      catalogoActivo = data.prendas;
      if (data.contacto && typeof data.contacto === 'object') Object.assign(CONTACTO, data.contacto);
      renderAdminList();
      showMsg(`✓ Copia cargada: ${catalogoActivo.length} prendas.`);
    } catch {
      showMsg('No se pudo leer el archivo: no parece una copia completa válida (.json).', true);
    }
  });
}

/* ── INIT ────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  renderAdminList();
  initLista();
  initFormulario();
  initExportar();
});
