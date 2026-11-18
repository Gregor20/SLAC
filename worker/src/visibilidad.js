// Regla de visibilidad (FR-002, FR-005, FR-009). Funciones puras: sin E/S ni caché.
//
// estado = { version, prendas: { [id]: { visible, por, en } }, fotos: { "<id>:<n>": { visible, por, en } } }
//   · prenda sin fila  → oculta
//   · foto sin fila    → activa
//   · una foto se ve solo si su prenda está visible Y la foto está activa
// Cualquier dato ausente o dudoso se trata como oculto (fail closed).

const tiene = (objeto, clave) => objeto != null && Object.hasOwn(objeto, clave);

export const claveFoto = (id, n) => `${id}:${n}`;

/** Estado propio de la prenda: solo `true` estricto cuenta como visible. */
export function prendaActiva(estado, id) {
  return tiene(estado?.prendas, id) && estado.prendas[id].visible === true;
}

/** Estado propio de la foto (sin fila = activa). */
export function fotoActiva(estado, id, n) {
  const clave = claveFoto(id, n);
  return tiene(estado?.fotos, clave) ? estado.fotos[clave].visible === true : true;
}

/** Lo que ve hoy un visitante: prenda visible y foto activa. */
export function fotoVisible(estado, id, n) {
  return prendaActiva(estado, id) && fotoActiva(estado, id, n);
}

/** Números originales (1…) de las fotos visibles de una prenda de la galería. */
export function fotosVisibles(estado, prenda) {
  const visibles = [];
  for (let n = 1; n <= prenda.fotos.length; n++) {
    if (fotoVisible(estado, prenda.id, n)) visibles.push(n);
  }
  return visibles;
}

/** Una prenda se muestra solo si tiene al menos una foto visible. */
export const prendaVisible = (estado, prenda) => fotosVisibles(estado, prenda).length > 0;

/** Busca una prenda por id en la galería; null si no existe (nunca por herencia de prototipo). */
export function prendaPorId(galeria, id) {
  if (typeof id !== 'string' || !Array.isArray(galeria?.prendas)) return null;
  return galeria.prendas.find(p => p.id === id) ?? null;
}
