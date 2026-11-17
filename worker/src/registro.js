// GET /api/admin/registro?limite=<1..100> (contracts/api-admin.md): últimos cambios, el más reciente primero.
// Solo lectura: la API no tiene ninguna ruta que edite o borre el registro (FR-010).

import { errorJson, respuestaJson } from './seguridad.js';

const LIMITE_POR_DEFECTO = 50;

/** Entero 1…100 en decimal estricto (sin ceros a la izquierda raros, signos ni exponentes), o `null`. */
function leerLimite(url) {
  const valores = url.searchParams.getAll('limite');
  if (valores.length === 0) return LIMITE_POR_DEFECTO;
  if (valores.length > 1 || !/^[1-9]\d{0,2}$/.test(valores[0])) return null;
  const n = Number(valores[0]);
  return n <= 100 ? n : null;
}

export async function verRegistro({ env, url, almacen }) {
  const limite = leerLimite(url);
  if (limite === null) return errorJson(400, 'limite_invalido');
  try {
    return respuestaJson({ registro: await almacen.ultimosCambios(env.DB, limite) });
  } catch {
    return errorJson(503, 'estado_no_disponible');   // sin datos fiables no se inventa nada
  }
}
