// Enrutado del Worker: qué rutas pasan por él, orden de comprobaciones y cierre en seguro.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearEnrutador } from '../src/enrutador.js';
import { crearValidador } from '../src/acceso.js';

const HOST = 'https://slac-official.com';
const galeria = { prendas: [{ id: '001', descripcion: 'a', fotos: [[1, 1]] }], portada: [] };

/** Entorno cuyo D1 y R2 anotan cualquier uso: las rutas denegadas no deben tocarlos. */
function entorno(extra = {}) {
  const toques = [];
  const espia = nombre => new Proxy({}, { get: (_, p) => { toques.push(`${nombre}.${String(p)}`); throw new Error('uso indebido'); } });
  const activos = [];
  const ASSETS = { fetch: async peticion => { activos.push(new URL(peticion.url).pathname); return new Response('estatico', { headers: { 'Content-Type': 'text/css' } }); } };
  const LIMITE_CAMBIOS = { limit: async () => ({ success: true }) };   // sin binding el respaldo consultaría D1
  return { env: { DB: espia('DB'), FOTOS: espia('FOTOS'), ASSETS, LIMITE_CAMBIOS, HOST_PERMITIDO: 'slac-official.com', ...extra }, toques, activos };
}
const llamadas = [];
const manejador = nombre => async contexto => { llamadas.push([nombre, contexto.persona ?? null]); return new Response(nombre, { status: 200 }); };
const manejadores = { admin: manejador('admin'), panel: manejador('panel'), publica: manejador('publica'), imagen: manejador('imagen') };
const enrutador = (opciones = {}) => crearEnrutador({ galeria, validar: async () => 'ana@correo.com', manejadores, ...opciones });
const pedir = (r, ruta, init = {}) => r(new Request(`${HOST}${ruta}`, init), entorno().env);
const propio = { Origin: HOST, 'Content-Type': 'application/json' };

test('sin identificación, /panel* y /api/admin/* dan 403 vacío sin tocar D1 ni R2', async () => {
  const { env, toques } = entorno();
  const r = enrutador({ validar: async () => null });
  for (const ruta of ['/panel', '/panel/', '/panel/panel.js', '/panel/otra', '/api/admin', '/api/admin/estado',
    '/api/admin/prendas/001', '/api/admin/prendas/001/fotos/1', '/api/admin/registro', '/api/admin/miniaturas/001/1.webp']) {
    for (const metodo of ['GET', 'PUT', 'DELETE']) {
      const resp = await r(new Request(`${HOST}${ruta}`, { method: metodo, body: metodo === 'PUT' ? '{}' : undefined }), env);
      assert.equal(resp.status, 403, `${metodo} ${ruta}`);
      assert.equal(await resp.text(), '', `${metodo} ${ruta} sin cuerpo`);
      assert.equal(resp.headers.get('Cache-Control'), 'no-store');
      assert.equal(resp.headers.get('X-Robots-Tag'), 'noindex, nofollow');
      assert.equal(resp.headers.get('X-Frame-Options'), 'DENY');
    }
  }
  assert.deepEqual(toques, []);
  assert.equal(llamadas.length, 0);
});

test('con el validador real y sin cabecera de Access: 403 sin leer D1 ni R2', async () => {
  const { env, toques } = entorno({ ACCESS_TEAM_DOMAIN: 'https://e.cloudflareaccess.com', ACCESS_AUD: 'x' });
  const r = enrutador({ validar: crearValidador({ cargarClaves: async () => { throw new Error('no se debe pedir'); } }) });
  assert.equal((await r(new Request(`${HOST}/api/admin/estado`), env)).status, 403);
  assert.equal((await r(new Request(`${HOST}/panel/`), env)).status, 403);
  assert.deepEqual(toques, []);
});

test('con identificación, cada ruta llega a su manejador con la persona', async () => {
  llamadas.length = 0;
  const r = enrutador();
  await pedir(r, '/panel/');
  await pedir(r, '/panel/panel.js');
  await pedir(r, '/api/admin/estado');
  assert.deepEqual(llamadas, [['panel', 'ana@correo.com'], ['panel', 'ana@correo.com'], ['admin', 'ana@correo.com']]);
});

test('un PUT sin Origin propio se rechaza (403) antes de llegar al manejador', async () => {
  llamadas.length = 0;
  const r = enrutador();
  for (const cabeceras of [{}, { Origin: 'https://otro.com' }, { ...propio, 'Sec-Fetch-Site': 'cross-site' }]) {
    const resp = await pedir(r, '/api/admin/prendas/001', { method: 'PUT', body: '{"visible":true}', headers: cabeceras });
    assert.equal(resp.status, 403);
  }
  assert.equal(llamadas.length, 0);
  assert.equal((await pedir(r, '/api/admin/prendas/001', { method: 'PUT', body: '{"visible":true}', headers: propio })).status, 200);
});

test('el límite de frecuencia devuelve 429 con Retry-After y no llega al manejador', async () => {
  llamadas.length = 0;
  const { env } = entorno({ LIMITE_CAMBIOS: { limit: async () => ({ success: false }) } });
  const resp = await enrutador()(new Request(`${HOST}/api/admin/prendas/001`, { method: 'PUT', body: '{"visible":true}', headers: propio }), env);
  assert.equal(resp.status, 429);
  assert.equal(resp.headers.get('Retry-After'), '10');
  assert.equal(llamadas.length, 0);
});

test('métodos no permitidos → 405 (tras la identificación en las rutas del panel)', async () => {
  const r = enrutador();
  for (const [metodo, ruta] of [['DELETE', '/api/admin/estado'], ['POST', '/api/admin/estado'], ['PUT', '/panel/'],
    ['POST', '/api/prendas.js'], ['PUT', '/f/001/1-800.webp'], ['DELETE', '/f/001/1-800.webp']]) {
    const resp = await pedir(r, ruta, { method: metodo, headers: propio, body: metodo === 'GET' ? undefined : '{}' });
    assert.equal(resp.status, 405, `${metodo} ${ruta}`);
    assert.ok(resp.headers.get('Allow'));
  }
});

test('las rutas públicas no piden identificación', async () => {
  llamadas.length = 0;
  let consultas = 0;
  const r = enrutador({ validar: async () => { consultas++; return null; } });
  assert.equal((await pedir(r, '/api/prendas.js')).status, 200);
  assert.equal((await pedir(r, '/f/001/1-800.webp')).status, 200);
  assert.equal((await pedir(r, '/f/001/1-800.webp', { method: 'HEAD' })).status, 200);
  assert.deepEqual(llamadas.map(l => l[0]), ['publica', 'imagen', 'imagen']);
  assert.equal(consultas, 0);
});

test('lo demás va a los recursos estáticos, con las cabeceras de seguridad', async () => {
  const { env, activos } = entorno();
  const r = enrutador();
  for (const ruta of ['/', '/styles.css', '/public/img/slac/x.webp', '/panelx', '/panel-x/', '/api/administrador', '/api/otra']) {
    const resp = await r(new Request(`${HOST}${ruta}`), env);
    assert.equal(resp.status, 200, ruta);
    assert.equal(resp.headers.get('X-Content-Type-Options'), 'nosniff');
    assert.equal(resp.headers.get('X-Robots-Tag'), null);
  }
  assert.equal(activos.length, 7);
  assert.equal((await r(new Request(`${HOST}/`), { ...env, ASSETS: undefined })).status, 404);
});

test('rutas sin manejador (aún no implementado) responden 404 y no 5xx', async () => {
  const r = crearEnrutador({ galeria, validar: async () => 'ana@correo.com' });
  assert.equal((await pedir(r, '/api/admin/estado')).status, 404);
  assert.equal((await pedir(r, '/f/001/1-800.webp')).status, 404);
});

test('un error interno responde 500 genérico, sin trazas', async () => {
  const roto = { ...manejadores, imagen: async () => { throw new Error('secreto: clave interna'); }, admin: async () => { throw new Error('otro secreto'); } };
  const r = enrutador({ manejadores: roto });
  for (const ruta of ['/f/001/1-800.webp', '/api/admin/estado']) {
    const resp = await pedir(r, ruta);
    assert.equal(resp.status, 500);
    const texto = await resp.text();
    assert.deepEqual(JSON.parse(texto), { error: 'interno' });
    assert.doesNotMatch(texto, /secreto|Error|at /);
  }
});
