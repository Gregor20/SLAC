/* ============================================================
   panel-lista.js — dibuja la lista de prendas y sus fotos con la API del DOM (nunca innerHTML).
   El panel solo MUESTRA lo que el servidor calcula (`visible`, `efectiva`): no replica la regla.
   `pintar` crea la lista una vez y después la actualiza en su sitio, para no perder el foco del teclado.
   ============================================================ */
'use strict';

const PanelLista = (() => {
  const formatoHora = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const formatoSoloHora = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' });

  /** «hoy 18:32» si es de hoy; si no, «16 nov, 18:32» (hora local del dispositivo). */
  function hora(milisegundos) {
    const fecha = new Date(milisegundos);
    return fecha.toDateString() === new Date().toDateString() ? `hoy ${formatoSoloHora.format(fecha)}` : formatoHora.format(fecha);
  }

  function el(etiqueta, clase, texto) {
    const nodo = document.createElement(etiqueta);
    if (clase) nodo.className = clase;
    if (texto !== undefined) nodo.textContent = texto;
    return nodo;
  }

  /** Interruptor accesible: <input type="checkbox" role="switch"> con su nombre completo. */
  function crearInterruptor(nombre, alCambiar) {
    const etiqueta = el('label', 'interruptor');
    const entrada = document.createElement('input');
    entrada.type = 'checkbox';
    entrada.setAttribute('role', 'switch');
    entrada.setAttribute('aria-label', nombre);
    const texto = el('span', 'texto');
    texto.setAttribute('aria-hidden', 'true');   // repite el estado con texto; el estado real lo anuncia el interruptor
    etiqueta.append(entrada, el('span', 'pista'), texto);
    entrada.addEventListener('change', () => {
      if (etiqueta.getAttribute('aria-busy') === 'true') { entrada.checked = !entrada.checked; return; }
      alCambiar(entrada);
    });
    return { etiqueta, entrada, texto };
  }

  /** Si la miniatura no está en el almacén, queda un hueco limpio (nunca el icono de imagen rota). */
  const sinImagenSiFalla = img => img.addEventListener('error', () => img.classList.add('sin-imagen'));

  const cuando = cambio => (cambio ? `por ${cambio.por} · ${hora(cambio.en)}` : 'sin cambios todavía');

  function crearFoto(prenda, foto, manejadores) {
    const item = el('li', 'foto');
    const img = el('img');
    img.src = PanelApi.miniatura(prenda.id, foto.n);
    img.alt = '';
    img.width = 160; img.height = 213; img.loading = 'lazy';
    sinImagenSiFalla(img);
    const interruptor = crearInterruptor(`Foto ${foto.n} de la prenda ${prenda.numero}`, e => manejadores.foto(prenda, foto, e, interruptor));
    const nota = el('p', 'nota');
    item.append(img, interruptor.etiqueta, nota);
    return { item, interruptor, nota };
  }

  function crearPrenda(prenda, manejadores) {
    const item = el('li', 'prenda');
    item.dataset.id = prenda.id;
    const cabecera = el('div', 'prenda-cab');
    const img = el('img', 'miniatura');
    img.src = PanelApi.miniatura(prenda.id, 1);
    img.alt = ''; img.width = 56; img.height = 72; img.loading = 'lazy';
    sinImagenSiFalla(img);
    const datos = el('div', 'prenda-datos');
    const etiqueta = el('span', 'etiqueta', 'En portada');
    datos.append(el('p', 'numero', `Prenda ${prenda.numero}`), el('p', 'descripcion', prenda.descripcion));
    if (prenda.enPortada) datos.append(etiqueta);
    const interruptor = crearInterruptor(`Prenda ${prenda.numero}`, e => manejadores.prenda(prenda, e, interruptor));
    cabecera.append(img, datos, interruptor.etiqueta);

    const nota = el('p', 'nota');
    const detalle = el('details', 'fotos');
    detalle.append(el('summary', '', `Fotos (${prenda.fotos.length})`));
    const rejilla = el('ul', 'rejilla');
    const fotos = prenda.fotos.map(f => crearFoto(prenda, f, manejadores));
    rejilla.append(...fotos.map(f => f.item));
    detalle.append(rejilla);
    item.append(cabecera, nota, detalle);
    return { item, interruptor, nota, fotos, prenda };
  }

  function actualizarPrenda(ref, prenda) {
    ref.prenda = prenda;
    const { item, interruptor, nota, fotos } = ref;
    interruptor.entrada.checked = prenda.visible;
    interruptor.texto.textContent = prenda.visible ? 'Visible' : 'Oculta';
    if (prenda.visible && !prenda.efectiva) nota.textContent = 'Sin fotos visibles: no se muestra';
    else nota.textContent = `${prenda.visible ? 'Visible' : 'Oculta'} · ${cuando(prenda.cambio)}`;
    item.toggleAttribute('data-oculta', !prenda.efectiva);
    prenda.fotos.forEach((foto, i) => {
      const f = fotos[i];
      f.interruptor.entrada.checked = foto.visible;
      f.interruptor.texto.textContent = foto.visible ? 'Visible' : 'Oculta';
      f.nota.textContent = foto.cambio ? cuando(foto.cambio) : '';
      f.item.toggleAttribute('data-oculta', !foto.efectiva);
    });
  }

  let refs = new Map();

  /** Dibuja o actualiza la lista. Reconstruye solo si cambió el conjunto de prendas o de fotos. */
  function pintar(contenedor, prendas, manejadores) {
    const igual = prendas.length === refs.size && prendas.every(p => refs.get(p.id)?.prenda.fotos.length === p.fotos.length);
    if (!igual) {
      refs = new Map(prendas.map(p => [p.id, crearPrenda(p, manejadores)]));
      contenedor.replaceChildren(...[...refs.values()].map(r => r.item));
    }
    prendas.forEach(p => actualizarPrenda(refs.get(p.id), p));
  }

  /** Marca un interruptor como ocupado mientras se guarda (sin desactivarlo: el foco no se pierde). */
  const ocupado = (interruptor, valor) => interruptor.etiqueta.setAttribute('aria-busy', String(valor));

  return { pintar, ocupado, hora };
})();
