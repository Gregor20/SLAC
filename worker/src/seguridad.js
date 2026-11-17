// Cabeceras de seguridad, protección CSRF, validación de entradas y límite de frecuencia (FR-011).
// Las cabeceras repiten las de `_headers`: las respuestas del Worker no las heredan de ese archivo.

const CABECERAS = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'Cross-Origin-Opener-Policy': 'same-origin'
};
const MAX_CUERPO = 64;                // bytes (contrato de la API de administración)
const VENTANA_MS = 10_000;            // límite de frecuencia: 30 cambios por persona cada 10 s
const MAX_CAMBIOS = 30;
const ID = /^[0-9A-Za-z_-]{1,16}$/;
const NUMERO_FOTO = /^[1-9][0-9]?$/;

/**
 * Devuelve una copia de la respuesta con las cabeceras de seguridad (las de la respuesta original
 * pueden ser inmutables, p. ej. las de `env.ASSETS`). `admin` añade `no-store` y `noindex`.
 */
export function conCabeceras(respuesta, { admin = false } = {}) {
  const copia = new Response(respuesta.body, respuesta);
  for (const [nombre, valor] of Object.entries(CABECERAS)) copia.headers.set(nombre, valor);
  if (!(copia.headers.get('Content-Type') ?? '').startsWith('text/html')) {
    copia.headers.set('Content-Security-Policy', "frame-ancestors 'none'");
  }
  if (admin) {
    if (!copia.headers.has('Cache-Control')) copia.headers.set('Cache-Control', 'no-store');   // las miniaturas fijan 'private, no-store'
    copia.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  return copia;
}

/** Respuesta JSON con el formato de error del contrato: {"error":"<código corto>"}. */
export const errorJson = (estado, codigo, cabeceras = {}) =>
  new Response(JSON.stringify({ error: codigo }), {
    status: estado, headers: { 'Content-Type': 'application/json; charset=utf-8', ...cabeceras }
  });

/** Respuesta JSON de éxito (la administración nunca se guarda en caché: lo añade conCabeceras). */
export const respuestaJson = (datos, estado = 200) =>
  new Response(JSON.stringify(datos), { status: estado, headers: { 'Content-Type': 'application/json; charset=utf-8' } });

/** CSRF: `Origin` debe ser el propio origen (y `Sec-Fetch-Site: same-origin` si el navegador lo envía). */
export function comprobarOrigen(peticion) {
  const origen = peticion.headers.get('Origin');
  if (!origen || origen !== new URL(peticion.url).origin) return false;
  const sitio = peticion.headers.get('Sec-Fetch-Site');
  return sitio === null || sitio === 'same-origin';
}

/** Lee como mucho MAX_CUERPO + 1 bytes: un cuerpo enorme no se descarga entero. */
async function leerTexto(peticion) {
  const lector = peticion.body?.getReader();
  if (!lector) return '';
  const trozos = [];
  let total = 0;
  for (;;) {
    const { done, value } = await lector.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_CUERPO) { await lector.cancel(); return null; }
    trozos.push(value);
  }
  return new TextDecoder().decode(unirTrozos(trozos, total));
}

function unirTrozos(trozos, total) {
  const unido = new Uint8Array(total);
  let desplazamiento = 0;
  for (const t of trozos) { unido.set(t, desplazamiento); desplazamiento += t.byteLength; }
  return unido;
}

/** Cuerpo `{"visible": true|false}` estricto → { ok, visible } o { ok:false, status, error }. */
export async function leerCuerpoVisible(peticion) {
  if (!(peticion.headers.get('Content-Type') ?? '').toLowerCase().startsWith('application/json')) {
    return { ok: false, status: 415, error: 'tipo_no_admitido' };
  }
  const texto = await leerTexto(peticion);
  if (texto === null) return { ok: false, status: 413, error: 'cuerpo_demasiado_grande' };
  let datos;
  try { datos = JSON.parse(texto); } catch { return { ok: false, status: 400, error: 'cuerpo_invalido' }; }
  const claves = datos && typeof datos === 'object' && !Array.isArray(datos) ? Object.keys(datos) : [];
  if (claves.length !== 1 || claves[0] !== 'visible' || typeof datos.visible !== 'boolean') {
    return { ok: false, status: 400, error: 'cuerpo_invalido' };
  }
  return { ok: true, visible: datos.visible };
}

/** Identificador de prenda: ^[0-9A-Za-z_-]{1,16}$ (solo texto; nunca se usa para construir rutas sin contrastarlo con la galería). */
export const esIdValido = id => typeof id === 'string' && ID.test(id);

/** Número de foto 1…total (sin ceros a la izquierda) o null. */
export function numeroFotoValido(texto, total) {
  if (typeof texto !== 'string' || !NUMERO_FOTO.test(texto)) return null;
  const n = Number(texto);
  return n >= 1 && n <= total ? n : null;
}

/**
 * Límite de frecuencia por persona: binding `LIMITE_CAMBIOS` de Cloudflare o, si no está disponible,
 * respaldo contando los cambios recientes de la persona (`contarCambios(persona, desdeMs)`).
 * Cualquier fallo rechaza la operación (cierra en seguro).
 */
export async function limitarFrecuencia(env, persona, contarCambios, ahora = Date.now()) {
  const rechazo = { ok: false, retryAfter: VENTANA_MS / 1000 };
  try {
    if (typeof env.LIMITE_CAMBIOS?.limit === 'function') {
      const { success } = await env.LIMITE_CAMBIOS.limit({ key: persona });
      return success ? { ok: true } : rechazo;
    }
    const recientes = await contarCambios(persona, ahora - VENTANA_MS);
    return recientes >= MAX_CAMBIOS ? rechazo : { ok: true };
  } catch {
    return rechazo;
  }
}
