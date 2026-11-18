/* ============================================================
   panel.js — arranque del panel online (015): carga el estado, guarda los cambios y avisa.
   Regla de oro: el panel nunca muestra un estado inventado. Si un cambio no se guarda, el interruptor
   vuelve a su valor anterior y se dice; el estado mostrado es siempre el que devuelve el servidor.
   ============================================================ */
'use strict';

(() => {
  const el = id => document.getElementById(id);
  const lista = el('lista'), estado = el('estado'), resumen = el('resumen'), errorCarga = el('error');
  const dialogo = el('confirmar');
  let temporizador = null;
  let fallos = 0;   // fallos seguidos: si se repiten, lo más probable es que la sesión (12 h) haya caducado

  /** Con la sesión caducada Access redirige a otro dominio y `fetch` falla sin más pistas: se sugiere recargar. */
  function mensajeDeFallo(error) {
    const sesion = fallos >= 2 || error?.estado === 401 || error?.estado === 403;
    return sesion ? 'No se pudo guardar. Recarga la página: puede que la sesión haya caducado.' : 'No se pudo guardar. Inténtalo de nuevo.';
  }

  function avisar(texto, tipo = 'ok') {
    clearTimeout(temporizador);
    estado.textContent = texto;
    estado.dataset.tipo = tipo;
    if (tipo === 'ok' && texto) temporizador = setTimeout(() => { estado.textContent = ''; }, 5000);
  }

  function resumir(prendas) {
    const visibles = prendas.filter(p => p.efectiva).length;
    resumen.textContent = `${visibles} ${visibles === 1 ? 'prenda visible' : 'prendas visibles'} · ${prendas.length - visibles} ocultas`;
  }

  async function cargar() {
    try {
      const datos = await PanelApi.estado();
      el('persona').textContent = datos.persona;
      errorCarga.hidden = true;
      fallos = 0;
      PanelLista.pintar(lista, datos.prendas, manejadores);
      resumir(datos.prendas);
      PanelRegistro.actualizar(el('registro'), el('registro-vacio'));   // el registro nunca bloquea la lista
      return true;
    } catch {
      fallos += 1;
      errorCarga.hidden = false;   // sin datos fiables: se avisa, no se muestra nada inventado
      return false;
    }
  }

  /** Guarda un cambio y vuelve a pedir el estado: la regla de lo que se ve la calcula el servidor. */
  async function guardar(interruptor, valor, peticion) {
    PanelLista.ocupado(interruptor, true);
    avisar('Guardando…');
    try {
      await peticion();
    } catch (error) {
      fallos += 1;
      interruptor.entrada.checked = !valor;   // vuelve al valor anterior
      avisar(mensajeDeFallo(error), 'error');
      return;
    } finally {
      PanelLista.ocupado(interruptor, false);
    }
    avisar((await cargar()) ? 'Guardado' : 'Guardado, pero no se pudo actualizar la lista. Pulsa «Actualizar».', 'ok');
  }

  function confirmarOcultar(prenda) {
    el('confirmar-numero').textContent = prenda.numero;
    return new Promise(resolver => {
      dialogo.addEventListener('close', () => {
        const eleccion = dialogo.returnValue;
        dialogo.returnValue = '';   // «Esc» no fija valor: no debe heredar el de la vez anterior
        resolver(eleccion === 'ocultar');
      }, { once: true });
      dialogo.showModal();
    });
  }

  const manejadores = {
    async prenda(prenda, entrada, interruptor) {
      const valor = entrada.checked;
      if (!valor && prenda.enPortada) {
        entrada.checked = true;   // hasta que se confirme, sigue visible
        if (!(await confirmarOcultar(prenda))) return;
        entrada.checked = false;
      }
      guardar(interruptor, valor, () => PanelApi.cambiarPrenda(prenda.id, valor));
    },
    foto(prenda, foto, entrada, interruptor) {
      const valor = entrada.checked;
      guardar(interruptor, valor, () => PanelApi.cambiarFoto(prenda.id, foto.n, valor));
    }
  };

  el('actualizar').addEventListener('click', async () => { avisar((await cargar()) ? 'Actualizado' : ''); });
  el('reintentar').addEventListener('click', cargar);
  cargar();
})();
