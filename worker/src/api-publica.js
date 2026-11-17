// GET /api/prendas.js — las prendas y fotos VISIBLES, como script clásico (contracts/api-publica.md).
// `data/galeria.js` publicado declara `const PRENDAS = [];` y este script añade las visibles y define
// `FOTOS_OPT`. Una prenda oculta no aparece en ningún dato ni en el código (FR-005). Si el estado
// falla, la lista sale vacía y siempre con 200: un script que falla dejaría la página sin datos.

import { fotosVisibles } from './visibilidad.js';

/** JSON seguro para incrustar en un <script>: `<` y los separadores de línea de JS no pueden aparecer. */
const js = valor => JSON.stringify(valor)
  .replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

/** Huella corta (FNV-1a) para el ETag: cambia con el estado y con la galería desplegada. */
function huella(texto) {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) h = Math.imul(h ^ texto.charCodeAt(i), 0x01000193);
  return (h >>> 0).toString(36);
}

export function construirScript(estado, galeria) {
  const visibles = galeria.prendas
    .map(prenda => ({ prenda, numeros: fotosVisibles(estado, prenda) }))
    .filter(({ numeros }) => numeros.length > 0);

  const fotos = {};
  for (const { prenda, numeros } of visibles) {
    fotos[prenda.id] = numeros.map(n => [...prenda.fotos[n - 1], n]);   // [ancho, alto, número original]
  }
  const alta = visibles.map(({ prenda }) => `  ${js({ id: prenda.id, descripcion: prenda.descripcion })}`).join(',\n');
  const opciones = { base: '/f/', anchos: galeria.anchos, anchosAvif: galeria.anchosAvif, prendas: fotos };
  return `${alta ? `PRENDAS.push(\n${alta}\n);\n` : ''}const FOTOS_OPT = ${js(opciones)};\n`;
}

export async function manejarApiPublica({ peticion, env, galeria, almacen }) {
  const estado = await almacen.leer(env.DB);
  const script = construirScript(estado, galeria);
  const cabeceras = { 'Content-Type': 'application/javascript; charset=utf-8' };

  if (estado.degradado) {   // sin estado fiable: lista vacía y nada que cachear
    return new Response(script, { headers: { ...cabeceras, 'Cache-Control': 'no-store' } });
  }
  const etag = `"${estado.version}-${huella(script)}"`;
  const coincide = peticion.headers.get('If-None-Match') === etag;
  return new Response(coincide ? null : script, {
    status: coincide ? 304 : 200, headers: { ...cabeceras, 'Cache-Control': 'no-cache', ETag: etag }
  });
}
