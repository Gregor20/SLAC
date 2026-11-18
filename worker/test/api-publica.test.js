// GET /api/prendas.js (contracts/api-publica.md): solo lo visible, fail closed, sin fugas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { crearD1 } from '../test-ayudas/d1.js';
import { crearEnrutador } from '../src/enrutador.js';
import { crearAlmacen } from '../src/estado.js';
import { manejarApiPublica } from '../src/api-publica.js';

const HOST = 'https://slac-official.com';
const PERSONA = 'ana@correo.com';
const galeria = {
  anchos: [160, 480, 800, 1200], anchosAvif: [480, 800, 1200], portada: [],
  prendas: [
    { id: '001', descripcion: 'Mono rojo </script><script>alert(1)</script>', fotos: [[1200, 1600], [1100, 1500], [1000, 1400]] },
    { id: '002', descripcion: 'Conjunto "negro" \u2028 con comillas', fotos: [[900, 1200]] },
    { id: '012', descripcion: 'Vestido verde', fotos: [[800, 1000], [800, 1000]] }
  ]
};

function montar() {
  const db = crearD1();
  const reloj = { t: 1_800_000_000_000 };
  const almacen = crearAlmacen({ ahora: () => reloj.t });
  const env = { DB: db };
  const r = crearEnrutador({ galeria, almacen, validar: async () => null, manejadores: { publica: manejarApiPublica } });
  const pedir = (cabeceras = {}, metodo = 'GET') => r(new Request(`${HOST}/api/prendas.js`, { method: metodo, headers: cabeceras }), env);
  const cambiar = (id, v) => almacen.cambiarPrenda(db, id, v, PERSONA);
  const cambiarFoto = (id, n, v) => almacen.cambiarFoto(db, id, n, v, PERSONA);
  return { db, reloj, pedir, cambiar, cambiarFoto };
}

/** Ejecuta el script como lo haría el navegador: `PRENDAS` ya existe (data/galeria.js publicado). */
function ejecutar(codigo) {
  const contexto = vm.createContext({ PRENDAS: [] });
  vm.runInContext(`${codigo}\n;this.FOTOS_OPT = FOTOS_OPT;`, contexto);
  // Viaje por JSON: los objetos de `vm` son de otro realm y `deepStrictEqual` los distingue por su prototipo
  return JSON.parse(JSON.stringify({ PRENDAS: contexto.PRENDAS, FOTOS_OPT: contexto.FOTOS_OPT }));
}

test('cabeceras: script clásico, sin caché de navegador sin revalidar y con ETag', async () => {
  const { pedir } = montar();
  const r = await pedir();
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('Content-Type'), 'application/javascript; charset=utf-8');
  assert.equal(r.headers.get('Cache-Control'), 'no-cache');
  assert.match(r.headers.get('ETag'), /^"[^"]+"$/);
  assert.equal(r.headers.get('X-Content-Type-Options'), 'nosniff');
});

test('sin estado: ninguna prenda (todas ocultas) y FOTOS_OPT con la base /f/', async () => {
  const { pedir } = montar();
  const { PRENDAS, FOTOS_OPT } = ejecutar(await (await pedir()).text());
  assert.deepEqual([PRENDAS.length, FOTOS_OPT.prendas], [0, {}]);
  assert.equal(FOTOS_OPT.base, '/f/');
  assert.deepEqual(FOTOS_OPT.anchos, [160, 480, 800, 1200]);
  assert.deepEqual(FOTOS_OPT.anchosAvif, [480, 800, 1200]);
});

test('solo prendas con al menos una foto visible, en el orden de la galería, con el número original', async () => {
  const { pedir, cambiar, cambiarFoto } = montar();
  await cambiar('012', true);
  await cambiar('001', true);
  await cambiarFoto('001', 2, false);          // la foto 2 oculta: quedan 1 y 3
  await cambiar('002', true);
  await cambiarFoto('002', 1, false);          // prenda visible sin fotos activas: no sale
  const { PRENDAS, FOTOS_OPT } = ejecutar(await (await pedir()).text());
  assert.deepEqual(PRENDAS.map(p => p.id), ['001', '012']);
  assert.deepEqual(Object.keys(FOTOS_OPT.prendas), ['001', '012']);
  assert.deepEqual(FOTOS_OPT.prendas['001'], [[1200, 1600, 1], [1000, 1400, 3]]);
  assert.deepEqual(FOTOS_OPT.prendas['012'], [[800, 1000, 1], [800, 1000, 2]]);
  assert.deepEqual(Object.keys(PRENDAS[0]).sort(), ['descripcion', 'id']);
});

test('una prenda oculta no deja rastro: ni id, ni descripción, ni dimensiones', async () => {
  const { pedir, cambiar } = montar();
  await cambiar('012', true);
  const texto = await (await pedir()).text();
  // dimensiones propias de las prendas 001 y 002 (1200 se omite: también es un ancho de la galería)
  assert.doesNotMatch(texto, /"001"|"002"|Mono rojo|Conjunto|\b1600\b|\b1100\b|\b1500\b|\b1400\b|\b900\b/);
  assert.match(texto, /Vestido verde/);
});

test('las descripciones se escapan: no se puede cerrar el <script> ni romper la cadena', async () => {
  const { pedir, cambiar } = montar();
  await cambiar('001', true);
  await cambiar('002', true);
  const texto = await (await pedir()).text();
  assert.doesNotMatch(texto, /<\/script/i);
  assert.doesNotMatch(texto, /\u2028|\u2029/);
  const { PRENDAS } = ejecutar(texto);
  assert.equal(PRENDAS[0].descripcion, 'Mono rojo </script><script>alert(1)</script>');
  assert.equal(PRENDAS[1].descripcion, 'Conjunto "negro" \u2028 con comillas');
});

test('ETag y 304: cambia con el estado y con ningún otro dato; revalida con If-None-Match', async () => {
  const { pedir, cambiar } = montar();
  const a = await pedir();
  const etag = a.headers.get('ETag');
  const b = await pedir({ 'If-None-Match': etag });
  assert.equal(b.status, 304);
  assert.equal(await b.text(), '');
  await cambiar('001', true);
  const c = await pedir({ 'If-None-Match': etag });
  assert.equal(c.status, 200);
  assert.notEqual(c.headers.get('ETag'), etag);
});

test('fallo del estado: último estado correcto si tiene < 60 s; si no, lista vacía con no-store; siempre 200', async () => {
  const { pedir, cambiar, db, reloj } = montar();
  await cambiar('012', true);
  await pedir();
  db.caer();
  reloj.t += 30_000;
  const aun = await pedir();
  assert.equal(aun.status, 200);
  assert.equal(ejecutar(await aun.text()).PRENDAS.length, 1);

  reloj.t += 40_000;                                   // > 60 s desde la última lectura correcta
  const caido = await pedir();
  assert.equal(caido.status, 200);
  assert.equal(caido.headers.get('Cache-Control'), 'no-store');
  assert.equal(caido.headers.get('ETag'), null);
  const { PRENDAS, FOTOS_OPT } = ejecutar(await caido.text());
  assert.deepEqual([PRENDAS.length, FOTOS_OPT.prendas], [0, {}]);
});

test('HEAD funciona y otros métodos son 405', async () => {
  const { pedir } = montar();
  assert.equal((await pedir({}, 'HEAD')).status, 200);
  assert.equal((await pedir({}, 'POST')).status, 405);
});
