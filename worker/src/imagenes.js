// GET /f/<id>/<n>-<ancho>.<ext> — fotos de prendas desde el R2 privado, solo si prenda y foto están
// visibles (contracts/api-publica.md). Cualquier otra cosa (ruta mal formada, prenda o foto
// inexistente, OCULTA, error de lectura) responde el MISMO 404: no se distingue «no existe» de «oculta».

import { fotoVisible, prendaPorId } from './visibilidad.js';

const RUTA = /^\/f\/([0-9A-Za-z_-]{1,16})\/([1-9][0-9]?)-(160|480|800|1200)\.(avif|webp)$/;
const TIPOS = { webp: 'image/webp', avif: 'image/avif' };

/** Un único 404 para todo: sin cuerpo y sin caché, así reactivar una foto se ve al instante. */
const noExiste = () => new Response(null, { status: 404, headers: { 'Cache-Control': 'no-store' } });

/** Interpreta la ruta y la contrasta con la galería publicada; null si no es una foto que exista. */
function resolver(ruta, galeria) {
  const m = RUTA.exec(ruta);
  if (!m) return null;
  const [, id, numero, ancho, ext] = m;
  const prenda = prendaPorId(galeria, id);
  const n = Number(numero);
  if (!prenda || n > prenda.fotos.length) return null;
  const anchos = ext === 'avif' ? galeria.anchosAvif : galeria.anchos;   // 160 px solo existe en WebP
  if (!anchos.includes(Number(ancho))) return null;
  return { id, n, ext, clave: `f/${id}/${n}-${ancho}.${ext}` };
}

export async function manejarImagen({ peticion, env, ruta, galeria, almacen }) {
  try {
    const foto = resolver(ruta, galeria);
    if (!foto) return noExiste();
    const estado = await almacen.leer(env.DB);
    if (!fotoVisible(estado, foto.id, foto.n)) return noExiste();   // incluye «estado no disponible»: todo oculto

    const objeto = await env.FOTOS.get(foto.clave);
    if (!objeto) return noExiste();
    const cabeceras = { 'Content-Type': TIPOS[foto.ext], 'Cache-Control': 'public, max-age=30', ETag: objeto.httpEtag };
    if (peticion.headers.get('If-None-Match') === objeto.httpEtag) {
      return new Response(null, { status: 304, headers: cabeceras });
    }
    return new Response(objeto.body, { headers: cabeceras });
  } catch {
    return noExiste();
  }
}
