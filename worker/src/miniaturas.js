// GET /api/admin/miniaturas/<id>/<n>.webp — miniatura de 160 px para el panel, solo con identificación.
// A diferencia de /f/…, se entrega AUNQUE la foto esté oculta: la titular debe ver qué está cambiando.

import { esIdValido, numeroFotoValido } from './seguridad.js';
import { prendaPorId } from './visibilidad.js';

export async function entregarMiniatura({ env, galeria }, id, numero) {
  const noExiste = new Response(null, { status: 404 });
  if (!esIdValido(id)) return noExiste;
  const prenda = prendaPorId(galeria, id);
  const n = prenda ? numeroFotoValido(numero, prenda.fotos.length) : null;
  if (n === null) return noExiste;

  const objeto = await env.FOTOS.get(`f/${id}/${n}-160.webp`);
  if (!objeto) return noExiste;
  return new Response(objeto.body, {
    headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'private, no-store' }
  });
}
