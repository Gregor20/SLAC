/* ============================================================
   panel-registro.js — sección «Últimos cambios» (015, US5): los 50 más recientes, con persona y hora.
   Se dibuja con la API del DOM (nunca innerHTML). Si el registro no se puede leer, se deja como estaba:
   el panel no inventa datos y su fallo no impide cambiar el estado.
   ============================================================ */
'use strict';

const PanelRegistro = (() => {
  /** Número visible de la prenda: su id sin ceros (misma regla que `numeroPrenda` de lib.js). */
  const numeroDe = id => (/^\d{1,4}$/.test(id) ? String(Number(id)) : id);

  function describir(cambio) {
    const objeto = cambio.objeto === 'foto' ? `Foto ${cambio.foto} de la prenda ${numeroDe(cambio.prenda)}` : `Prenda ${numeroDe(cambio.prenda)}`;
    return `${objeto} · ${cambio.visible ? 'Visible' : 'Oculta'}`;
  }

  function crearFila(cambio) {
    const fila = document.createElement('li');
    const quien = document.createElement('span');
    quien.className = 'quien';
    quien.textContent = ` · por ${cambio.por} · ${PanelLista.hora(cambio.en)}`;
    fila.append(describir(cambio), quien);
    return fila;
  }

  /** Vuelve a pedir el registro y lo pinta en `lista`; `vacio` es el aviso de «sin cambios». */
  async function actualizar(lista, vacio) {
    try {
      const { registro } = await PanelApi.registro(50);
      lista.replaceChildren(...registro.map(crearFila));
      vacio.hidden = registro.length > 0;
    } catch {
      // se conserva lo que había
    }
  }

  return { actualizar };
})();
