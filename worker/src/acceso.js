// Validación del JWT de Cloudflare Access con Web Crypto (sin dependencias). FR-003, FR-006.
// Devuelve el correo (minúsculas) de la persona o `null`. Nunca explica el motivo del rechazo.

const ESPERA_RECARGA_MS = 30_000;   // un `kid` desconocido no puede forzar recargas continuas
const ALGORITMO = { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' };
const codificador = new TextEncoder();

function decodificarBase64Url(texto) {
  const base64 = texto.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(texto.length / 4) * 4, '=');
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
}

const leerJson = texto => JSON.parse(new TextDecoder().decode(decodificarBase64Url(texto)));
const sinBarraFinal = texto => String(texto ?? '').replace(/\/+$/, '');

/** Descarga las claves públicas del equipo de Access (formato JWKS). */
async function descargarClaves(equipo) {
  const respuesta = await fetch(`${sinBarraFinal(equipo)}/cdn-cgi/access/certs`);
  if (!respuesta.ok) throw new Error('claves no disponibles');
  return (await respuesta.json()).keys ?? [];
}

/**
 * Crea un validador con su propia caché de claves (una por aislado del Worker).
 * `cargarClaves(equipo)` se puede sustituir en las pruebas.
 */
export function crearValidador({ cargarClaves = descargarClaves } = {}) {
  let claves = new Map();      // kid → CryptoKey
  let ultimaCarga = null;      // ms de la última descarga (null = nunca)

  async function recargar(equipo, ahora) {
    ultimaCarga = ahora;
    const nuevas = new Map();
    for (const jwk of await cargarClaves(equipo)) {
      if (jwk.kty !== 'RSA' || !jwk.kid) continue;
      nuevas.set(jwk.kid, await crypto.subtle.importKey('jwk', jwk, ALGORITMO, false, ['verify']));
    }
    claves = nuevas;
  }

  async function claveDe(kid, equipo, ahora) {
    if (!claves.has(kid) && (ultimaCarga === null || ahora - ultimaCarga >= ESPERA_RECARGA_MS)) {
      await recargar(equipo, ahora);
    }
    return claves.get(kid) ?? null;
  }

  async function validarJwt(token, env, ahora) {
    const partes = token.split('.');
    if (partes.length !== 3) return null;
    const cabecera = leerJson(partes[0]);
    if (cabecera.alg !== 'RS256' || typeof cabecera.kid !== 'string') return null;

    const clave = await claveDe(cabecera.kid, env.ACCESS_TEAM_DOMAIN, ahora);
    if (!clave) return null;
    const valida = await crypto.subtle.verify(
      ALGORITMO.name, clave, decodificarBase64Url(partes[2]), codificador.encode(`${partes[0]}.${partes[1]}`));
    if (!valida) return null;

    const datos = leerJson(partes[1]);
    const segundos = ahora / 1000;
    const audiencias = Array.isArray(datos.aud) ? datos.aud : [datos.aud];
    if (sinBarraFinal(datos.iss) !== sinBarraFinal(env.ACCESS_TEAM_DOMAIN)) return null;
    if (!audiencias.includes(env.ACCESS_AUD)) return null;
    if (typeof datos.exp !== 'number' || datos.exp <= segundos) return null;
    if (datos.nbf !== undefined && (typeof datos.nbf !== 'number' || datos.nbf > segundos)) return null;
    if (typeof datos.email !== 'string' || !datos.email.includes('@') || datos.email.length > 254) return null;
    return datos.email.toLowerCase();
  }

  /** persona (correo) o null. `ahora` en ms (inyectable en pruebas). */
  return async function validar(peticion, env, ahora = Date.now()) {
    try {
      const host = new URL(peticion.url).hostname;
      // Solo `wrangler dev`: correo de prueba sin JWT, y únicamente en localhost.
      if (env.ACCESS_DEV_EMAIL && (host === 'localhost' || host === '127.0.0.1')) {
        return env.ACCESS_DEV_EMAIL.toLowerCase();
      }
      // El panel solo existe en el dominio propio, donde Access está delante (revocación efectiva).
      if (!env.HOST_PERMITIDO || host !== env.HOST_PERMITIDO) return null;
      if (!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD) return null;
      const token = peticion.headers.get('Cf-Access-Jwt-Assertion');
      return token ? await validarJwt(token, env, ahora) : null;
    } catch {
      return null;   // cualquier error (JWT roto, claves no disponibles…) cierra en seguro
    }
  };
}

export const validarAcceso = crearValidador();
