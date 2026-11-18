// Interfaz de administración /api/admin/* (contracts/api-admin.md). Solo se llega aquí con una
// identificación válida (enrutador): `contexto.persona` es el correo del JWT en minúsculas.

import { fotoActiva, prendaActiva, prendaPorId, prendaVisible, fotoVisible, claveFoto } from './visibilidad.js';
import { errorJson, esIdValido, leerCuerpoVisible, numeroFotoValido, respuestaJson } from './seguridad.js';
import { entregarMiniatura } from './miniaturas.js';
import { verRegistro } from './registro.js';

const RUTA_PRENDA = /^\/api\/admin\/prendas\/([^/]+)(?:\/fotos\/([^/]+))?$/;
const RUTA_MINIATURA = /^\/api\/admin\/miniaturas\/([^/]+)\/([^/.]+)\.webp$/;

/** Número visible de la prenda: su id sin ceros (misma regla que `numeroPrenda` de lib.js). */
const numeroDe = id => (/^\d{1,4}$/.test(id) ? String(Number(id)) : '');

const cambioDe = fila => (fila ? { por: fila.por, en: fila.en } : null);

function describirPrenda(estado, prenda, portada) {
  return {
    id: prenda.id,
    numero: numeroDe(prenda.id),
    descripcion: prenda.descripcion,
    visible: prendaActiva(estado, prenda.id),
    efectiva: prendaVisible(estado, prenda),
    enPortada: portada.includes(prenda.id),
    cambio: cambioDe(estado.prendas[prenda.id]),
    fotos: prenda.fotos.map((_, i) => ({
      n: i + 1,
      visible: fotoActiva(estado, prenda.id, i + 1),
      efectiva: fotoVisible(estado, prenda.id, i + 1),
      cambio: cambioDe(estado.fotos[claveFoto(prenda.id, i + 1)])
    }))
  };
}

async function verEstado({ env, galeria, almacen, persona }) {
  const estado = await almacen.leer(env.DB);
  // Si no se puede leer el estado se avisa: el panel nunca muestra un estado inventado.
  if (estado.degradado) return errorJson(503, 'estado_no_disponible');
  const portada = galeria.portada ?? [];
  return respuestaJson({
    persona, version: estado.version, prendas: galeria.prendas.map(p => describirPrenda(estado, p, portada))
  });
}

/** PUT /api/admin/prendas/<id> y /api/admin/prendas/<id>/fotos/<n> */
async function cambiarEstado(contexto, [, id, foto]) {
  const { peticion, env, galeria, almacen, persona } = contexto;
  if (!esIdValido(id)) return errorJson(400, 'id_invalido');
  const prenda = prendaPorId(galeria, id);
  if (!prenda) return errorJson(404, 'no_encontrada');
  const n = foto === undefined ? null : numeroFotoValido(foto, prenda.fotos.length);
  if (foto !== undefined && n === null) return errorJson(400, 'foto_invalida');

  const cuerpo = await leerCuerpoVisible(peticion);
  if (!cuerpo.ok) return errorJson(cuerpo.status, cuerpo.error);

  const resultado = n === null
    ? await almacen.cambiarPrenda(env.DB, id, cuerpo.visible, persona)
    : await almacen.cambiarFoto(env.DB, id, n, cuerpo.visible, persona);
  const respuesta = { id, ...(n === null ? {} : { n }), visible: cuerpo.visible, cambio: resultado.cambio, version: resultado.version };
  return respuestaJson(respuesta);
}

export async function manejarAdmin(contexto) {
  const { peticion, ruta } = contexto;
  const esPut = peticion.method === 'PUT';

  if (!esPut && ruta === '/api/admin/estado') return verEstado(contexto);
  if (!esPut && ruta === '/api/admin/registro') return verRegistro(contexto);
  const prenda = esPut ? RUTA_PRENDA.exec(ruta) : null;
  if (prenda) return cambiarEstado(contexto, prenda);
  const miniatura = !esPut ? RUTA_MINIATURA.exec(ruta) : null;
  if (miniatura) return entregarMiniatura(contexto, miniatura[1], miniatura[2]);
  return new Response(null, { status: 404 });
}
