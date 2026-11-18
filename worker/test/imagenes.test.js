// GET /f/<id>/<n>-<ancho>.<ext> (contracts/api-publica.md): solo fotos visibles; 404 uniforme.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearD1 } from '../test-ayudas/d1.js';
import { crearEnrutador } from '../src/enrutador.js';
import { crearAlmacen } from '../src/estado.js';
import { manejarImagen } from '../src/imagenes.js';

const HOST = 'https://slac-official.com';
const PERSONA = 'ana@correo.com';
const galeria = {
  anchos: [160, 480, 800, 1200], anchosAvif: [480, 800, 1200], portada: [],
  prendas: [
    { id: '001', descripcion: 'a', fotos: [[1, 1], [1, 1], [1, 1]] },
    { id: '012', descripcion: 'b', fotos: [[1, 1]] }
  ]
};

function montar({ fallaR2 = false } = {}) {
  const db = crearD1();
  const almacen = crearAlmacen();
  const lecturas = [];
  const FOTOS = {
    get: async clave => {
      lecturas.push(clave);
      if (fallaR2) throw new Error('R2 caído');
      return { body: `contenido-${clave}`, httpEtag: '"abc123"' };
    }
  };
  const env = { DB: db, FOTOS };
  const r = crearEnrutador({ galeria, almacen, validar: async () => null, manejadores: { imagen: manejarImagen } });
  const pedir = (ruta, cabeceras = {}, metodo = 'GET') => r(new Request(`${HOST}${ruta}`, { method: metodo, headers: cabeceras }), env);
  return { db, almacen, pedir, lecturas, activar: (id, v = true) => almacen.cambiarPrenda(db, id, v, PERSONA), foto: (id, n, v) => almacen.cambiarFoto(db, id, n, v, PERSONA) };
}

async function firma(respuesta) {
  const cabeceras = [...respuesta.headers].sort(([a], [b]) => a.localeCompare(b));
  return JSON.stringify([respuesta.status, cabeceras, await respuesta.text()]);
}

test('foto visible: 200 con el tipo correcto, caché de 30 s (sin immutable) y ETag', async () => {
  const { pedir, activar, lecturas } = montar();
  await activar('001');
  const webp = await pedir('/f/001/2-800.webp');
  assert.equal(webp.status, 200);
  assert.equal(webp.headers.get('Content-Type'), 'image/webp');
  assert.equal(webp.headers.get('Cache-Control'), 'public, max-age=30');
  assert.doesNotMatch(webp.headers.get('Cache-Control'), /immutable/);
  assert.equal(webp.headers.get('ETag'), '"abc123"');
  assert.equal(webp.headers.get('X-Content-Type-Options'), 'nosniff');
  assert.equal(await webp.text(), 'contenido-f/001/2-800.webp');
  const avif = await pedir('/f/001/1-1200.avif');
  assert.equal(avif.headers.get('Content-Type'), 'image/avif');
  assert.deepEqual(lecturas, ['f/001/2-800.webp', 'f/001/1-1200.avif']);
});

test('If-None-Match con el ETag vigente: 304 sin cuerpo', async () => {
  const { pedir, activar } = montar();
  await activar('001');
  const r = await pedir('/f/001/1-800.webp', { 'If-None-Match': '"abc123"' });
  assert.equal(r.status, 304);
  assert.equal(await r.text(), '');
});

test('patrón estricto: 160 solo webp, anchos y extensiones válidos, n sin ceros', async () => {
  const { pedir, activar } = montar();
  await activar('001');
  assert.equal((await pedir('/f/001/1-160.webp')).status, 200);
  for (const ruta of ['/f/001/1-160.avif', '/f/001/1-300.webp', '/f/001/1-800.jpg', '/f/001/01-800.webp', '/f/001/0-800.webp',
    '/f/001/100-800.webp', '/f/001/1-800.webp/', '/f/001/1-800.webp.js', '/f/001/x-800.webp', '/f/001', '/f/', '/f/001/1-800',
    '/f/001/../012/1-800.webp', '/f/%30%30%31/1-800.webp', '/f/a%2Fb/1-800.webp', '/f/' + 'a'.repeat(17) + '/1-800.webp']) {
    assert.equal((await pedir(ruta)).status, 404, ruta);
  }
});

test('foto fuera de rango o de una prenda inexistente: 404', async () => {
  const { pedir, activar } = montar();
  await activar('001');
  assert.equal((await pedir('/f/001/4-800.webp')).status, 404);
  assert.equal((await pedir('/f/999/1-800.webp')).status, 404);
});

test('prenda oculta (o sin estado) → 404 y ni siquiera se lee R2', async () => {
  const { pedir, activar, lecturas } = montar();
  assert.equal((await pedir('/f/001/1-800.webp')).status, 404);          // sin fila = oculta
  await activar('001');
  assert.equal((await pedir('/f/001/1-800.webp')).status, 200);
  await new Promise(r => setTimeout(r, 0));
  await activar('001', false);
  assert.equal((await pedir('/f/001/1-800.webp')).status, 404);
  assert.deepEqual(lecturas, ['f/001/1-800.webp']);
});

test('foto oculta con su prenda visible: 404; las demás siguen; reactivar la prenda no la rescata', async () => {
  const { pedir, activar, foto } = montar();
  await activar('001');
  await foto('001', 2, false);
  assert.equal((await pedir('/f/001/2-800.webp')).status, 404);
  assert.equal((await pedir('/f/001/1-800.webp')).status, 200);
  assert.equal((await pedir('/f/001/3-800.webp')).status, 200);
  await activar('001', false);
  await activar('001', true);
  assert.equal((await pedir('/f/001/2-800.webp')).status, 404);
});

test('el 404 es idéntico (estado, cabeceras y cuerpo) para ruta mala, inexistente, oculta y error', async () => {
  const sano = montar();
  await sano.activar('001');
  await sano.foto('001', 2, false);
  const casos = [
    await sano.pedir('/f/001/x-800.webp'),         // mal formada
    await sano.pedir('/f/999/1-800.webp'),         // no existe
    await sano.pedir('/f/001/2-800.webp'),         // oculta
    await sano.pedir('/f/012/1-800.webp')          // prenda sin estado
  ];
  const caido = montar({ fallaR2: true });
  await caido.activar('001');
  casos.push(await caido.pedir('/f/001/1-800.webp'));   // error de R2
  const rota = montar();
  await rota.activar('001');
  rota.db.caer();
  casos.push(await rota.pedir('/f/001/1-800.webp'));    // error de D1 (aunque la caché dijera visible, el estado no existe aún)
  const firmas = await Promise.all(casos.map(firma));
  assert.equal(new Set(firmas).size, 1, 'todos los 404 deben ser indistinguibles');
  assert.equal(casos[0].status, 404);
  assert.equal(casos[0].headers.get('Cache-Control'), 'no-store');
  assert.equal(await casos[0].clone().text(), '');
});

test('HEAD funciona y otros métodos son 405', async () => {
  const { pedir, activar } = montar();
  await activar('001');
  assert.equal((await pedir('/f/001/1-800.webp', {}, 'HEAD')).status, 200);
  assert.equal((await pedir('/f/001/1-800.webp', {}, 'DELETE')).status, 405);
});
