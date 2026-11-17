// Enrutado y orden de comprobaciones del Worker (plan.md, «Orden de comprobaciones»).
// Solo pasan por aquí /api/*, /f/*, /panel y /panel/* (`run_worker_first`); todo lo demás es estático.
//
//   1. /panel* y /api/admin/*  → identificación primero (403 vacío, sin leer D1/R2) → método →
//                                CSRF y límite de frecuencia (PUT) → manejador
//   2. /f/*  y /api/prendas.js → públicas (solo GET/HEAD)
//   3. resto                   → env.ASSETS
//   4. toda respuesta lleva las cabeceras de seguridad; todo error interno es un 500 genérico

import { validarAcceso } from './acceso.js';
import { crearAlmacen } from './estado.js';
import { conCabeceras, comprobarOrigen, errorJson, limitarFrecuencia } from './seguridad.js';

const esPanel = ruta => ruta === '/panel' || ruta.startsWith('/panel/');
const esApiAdmin = ruta => ruta === '/api/admin' || ruta.startsWith('/api/admin/');
const esImagen = ruta => ruta.startsWith('/f/');
const esApiPublica = ruta => ruta === '/api/prendas.js';

const LECTURA = ['GET', 'HEAD'];
const noEncontrado = async () => new Response(null, { status: 404 });
const noPermitido = metodos => new Response(null, { status: 405, headers: { Allow: metodos.join(', ') } });

/**
 * `galeria` (prendas y fotos publicadas), `validar` (identidad), `almacen` (estado en D1) y los
 * `manejadores` de cada familia de rutas se inyectan para poder probar el enrutado sin Cloudflare.
 */
export function crearEnrutador({ galeria, validar = validarAcceso, almacen = crearAlmacen(), manejadores = {} }) {
  const manejador = { admin: noEncontrado, panel: noEncontrado, publica: noEncontrado, imagen: noEncontrado, ...manejadores };

  async function administracion(peticion, env, url, ruta) {
    const persona = await validar(peticion, env);
    if (!persona) return new Response(null, { status: 403 });

    const permitidos = esApiAdmin(ruta) ? [...LECTURA, 'PUT'] : LECTURA;
    if (!permitidos.includes(peticion.method)) return noPermitido(permitidos);

    if (peticion.method === 'PUT') {
      if (!comprobarOrigen(peticion)) return new Response(null, { status: 403 });
      const limite = await limitarFrecuencia(env, persona, (p, desde) => almacen.contarCambios(env.DB, p, desde));
      if (!limite.ok) return errorJson(429, 'demasiadas_peticiones', { 'Retry-After': String(limite.retryAfter) });
    }
    const contexto = { peticion, env, url, ruta, persona, galeria, almacen };
    return esApiAdmin(ruta) ? manejador.admin(contexto) : manejador.panel(contexto);
  }

  async function publica(peticion, env, url, ruta) {
    if (!LECTURA.includes(peticion.method)) return noPermitido(LECTURA);
    const contexto = { peticion, env, url, ruta, persona: null, galeria, almacen };
    return esImagen(ruta) ? manejador.imagen(contexto) : manejador.publica(contexto);
  }

  return async function atender(peticion, env) {
    const url = new URL(peticion.url);
    const ruta = url.pathname;
    const admin = esPanel(ruta) || esApiAdmin(ruta);
    try {
      let respuesta;
      if (admin) respuesta = await administracion(peticion, env, url, ruta);
      else if (esImagen(ruta) || esApiPublica(ruta)) respuesta = await publica(peticion, env, url, ruta);
      else respuesta = env.ASSETS ? await env.ASSETS.fetch(peticion) : new Response(null, { status: 404 });
      return conCabeceras(respuesta, { admin });
    } catch {
      return conCabeceras(errorJson(500, 'interno'), { admin });   // sin trazas ni detalles
    }
  };
}
