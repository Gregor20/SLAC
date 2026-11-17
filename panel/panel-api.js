/* ============================================================
   panel-api.js — llamadas a /api/admin/* (contracts/api-admin.md).
   La identificación la pone Cloudflare Access (cookie de sesión); aquí solo se piden y envían datos.
   Cada petición tiene un límite de 8 s; si falla, lanza un error y el panel avisa (nunca inventa estado).
   ============================================================ */
'use strict';

const PanelApi = (() => {
  const LIMITE_MS = 8000;

  async function pedir(ruta, opciones = {}) {
    const control = new AbortController();
    const plazo = setTimeout(() => control.abort(), LIMITE_MS);
    try {
      const respuesta = await fetch(ruta, { credentials: 'same-origin', ...opciones, signal: control.signal });
      if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
      return await respuesta.json();
    } finally {
      clearTimeout(plazo);
    }
  }

  const poner = (ruta, visible) => pedir(ruta, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ visible })
  });

  const prenda = id => `/api/admin/prendas/${encodeURIComponent(id)}`;

  return {
    estado: () => pedir('/api/admin/estado'),
    cambiarPrenda: (id, visible) => poner(prenda(id), visible),
    cambiarFoto: (id, n, visible) => poner(`${prenda(id)}/fotos/${n}`, visible),
    miniatura: (id, n) => `/api/admin/miniaturas/${encodeURIComponent(id)}/${n}.webp`
  };
})();
