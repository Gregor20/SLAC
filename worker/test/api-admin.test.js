// Contrato de la interfaz de administración (contracts/api-admin.md): estado, cambios y miniaturas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearD1 } from '../test-ayudas/d1.js';
import { crearEnrutador } from '../src/enrutador.js';
import { crearAlmacen } from '../src/estado.js';
import { manejarAdmin } from '../src/api-admin.js';
import { manejarPanel } from '../src/panel-estatico.js';

const HOST = 'https://slac-official.com';
const PERSONA = 'ana@correo.com';
const galeria = {
  prendas: [
    { id: '001', descripcion: 'Mono rojo', fotos: [[1, 1], [1, 1], [1, 1]] },
    { id: '012', descripcion: 'Conjunto negro', fotos: [[1, 1]] }
  ],
  portada: ['012']
};

function montar() {
  const db = crearD1();
  const reloj = { t: 1_800_000_000_000 };
  const almacen = crearAlmacen({ ahora: () => reloj.t });
  const r2 = new Map([['f/001/2-160.webp', 'miniatura-2']]);
  const FOTOS = { get: async clave => (r2.has(clave) ? { body: r2.get(clave) } : null) };
  const activos = [];
  const ASSETS = { fetch: async p => { activos.push(new URL(p.url).pathname); return new Response('estatico', { headers: { 'Content-Type': 'text/html' } }); } };
  const env = { DB: db, FOTOS, ASSETS, LIMITE_CAMBIOS: { limit: async () => ({ success: true }) } };
  const enrutador = crearEnrutador({ galeria, almacen, validar: async () => PERSONA, manejadores: { admin: manejarAdmin, panel: manejarPanel } });
  const pedir = (ruta, init = {}) => enrutador(new Request(`${HOST}${ruta}`, init), env);
  const poner = (ruta, cuerpo, cabeceras = {}) => pedir(ruta, {
    method: 'PUT', body: typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo),
    headers: { Origin: HOST, 'Content-Type': 'application/json', ...cabeceras }
  });
  return { db, reloj, pedir, poner, activos, env };
}

test('GET /api/admin/estado: forma del contrato; prendas sin fila ocultas', async () => {
  const { pedir } = montar();
  const r = await pedir('/api/admin/estado');
  assert.equal(r.status, 200);
  assert.match(r.headers.get('Content-Type'), /application\/json/);
  const cuerpo = await r.json();
  assert.deepEqual(Object.keys(cuerpo).sort(), ['persona', 'prendas', 'version']);
  assert.equal(cuerpo.persona, PERSONA);
  assert.equal(cuerpo.version, 0);
  assert.deepEqual(cuerpo.prendas[1], {
    id: '012', numero: '12', descripcion: 'Conjunto negro', visible: false, efectiva: false, enPortada: true, cambio: null,
    fotos: [{ n: 1, visible: true, efectiva: false, cambio: null }]
  });
  assert.equal(cuerpo.prendas[0].enPortada, false);
  assert.equal(cuerpo.prendas[0].numero, '1');
  assert.equal(cuerpo.prendas[0].fotos.length, 3);
});

test('activar una prenda: 200, estado, cambio y versión; el estado lo refleja', async () => {
  const { pedir, poner, reloj } = montar();
  const r = await poner('/api/admin/prendas/001', { visible: true });
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { id: '001', visible: true, cambio: { por: PERSONA, en: reloj.t }, version: 1 });
  const estado = await (await pedir('/api/admin/estado')).json();
  assert.deepEqual([estado.version, estado.prendas[0].visible, estado.prendas[0].efectiva], [1, true, true]);
  assert.deepEqual(estado.prendas[0].cambio, { por: PERSONA, en: reloj.t });
});

test('foto individual: la prenda sigue visible, la foto no es efectiva y las demás sí', async () => {
  const { pedir, poner } = montar();
  await poner('/api/admin/prendas/001', { visible: true });
  const r = await poner('/api/admin/prendas/001/fotos/2', { visible: false });
  assert.equal(r.status, 200);
  const cuerpo = await r.json();
  assert.deepEqual([cuerpo.id, cuerpo.n, cuerpo.visible, cuerpo.version], ['001', 2, false, 2]);
  const p = (await (await pedir('/api/admin/estado')).json()).prendas[0];
  assert.deepEqual(p.fotos.map(f => [f.visible, f.efectiva]), [[true, true], [false, false], [true, true]]);
});

test('desactivar y reactivar la prenda conserva la foto oculta (US1.6)', async () => {
  const { pedir, poner } = montar();
  await poner('/api/admin/prendas/001', { visible: true });
  await poner('/api/admin/prendas/001/fotos/2', { visible: false });
  await poner('/api/admin/prendas/001', { visible: false });
  assert.equal((await (await pedir('/api/admin/estado')).json()).prendas[0].fotos[0].efectiva, false);
  await poner('/api/admin/prendas/001', { visible: true });
  const p = (await (await pedir('/api/admin/estado')).json()).prendas[0];
  assert.deepEqual(p.fotos.map(f => f.efectiva), [true, false, true]);
});

test('prenda visible con todas las fotos desactivadas: no efectiva (no se muestra)', async () => {
  const { pedir, poner } = montar();
  await poner('/api/admin/prendas/012', { visible: true });
  await poner('/api/admin/prendas/012/fotos/1', { visible: false });
  const p = (await (await pedir('/api/admin/estado')).json()).prendas[1];
  assert.deepEqual([p.visible, p.efectiva], [true, false]);
});

test('es idempotente: repetir el estado devuelve 200 sin escribir ni registrar', async () => {
  const { poner, db } = montar();
  await poner('/api/admin/prendas/001', { visible: true });
  const r = await poner('/api/admin/prendas/001', { visible: true });
  assert.equal(r.status, 200);
  assert.equal((await r.json()).version, 1);
  assert.equal(db.consultar('SELECT * FROM registro').length, 1);
});

test('400: cuerpo con campo extra, visible no booleano, vacío o mal formado', async () => {
  const { poner, db } = montar();
  for (const malo of [{ visible: true, otro: 1 }, { visible: 'true' }, { visible: 1 }, {}, [], 'no json', '']) {
    assert.equal((await poner('/api/admin/prendas/001', malo)).status, 400, JSON.stringify(malo));
  }
  assert.equal(db.consultar('SELECT * FROM prenda_estado').length, 0);
});

test('400/404: identificadores y números fuera de rango o de patrón', async () => {
  const { poner, db } = montar();
  assert.equal((await poner('/api/admin/prendas/999', { visible: true })).status, 404);
  assert.equal((await poner('/api/admin/prendas/999/fotos/1', { visible: true })).status, 404);
  assert.equal((await poner('/api/admin/prendas/..%2Fx', { visible: true })).status, 400);
  assert.equal((await poner('/api/admin/prendas/AB%20C', { visible: true })).status, 400);
  assert.equal((await poner('/api/admin/prendas/' + 'a'.repeat(17), { visible: true })).status, 400);
  for (const n of ['0', '4', '01', '-1', 'x', '1.5']) {
    assert.equal((await poner(`/api/admin/prendas/001/fotos/${n}`, { visible: true })).status, 400, `foto ${n}`);
  }
  assert.equal((await poner('/api/admin/prendas/001/fotos/1/extra', { visible: true })).status, 404);
  assert.equal(db.consultar('SELECT * FROM prenda_estado').length + db.consultar('SELECT * FROM foto_estado').length, 0);
});

test('413 cuerpo grande, 415 tipo de contenido, 403 sin Origin: ninguna escritura', async () => {
  const { poner, db } = montar();
  assert.equal((await poner('/api/admin/prendas/001', { visible: true, relleno: 'x'.repeat(100) })).status, 413);
  assert.equal((await poner('/api/admin/prendas/001', '{"visible":true}', { 'Content-Type': 'text/plain' })).status, 415);
  assert.equal((await poner('/api/admin/prendas/001', '{"visible":true}', { Origin: 'https://otro.com' })).status, 403);
  assert.equal(db.consultar('SELECT * FROM prenda_estado').length, 0);
});

test('429 con Retry-After cuando se supera el límite de frecuencia', async () => {
  const { poner, env } = montar();
  env.LIMITE_CAMBIOS = { limit: async () => ({ success: false }) };
  const r = await poner('/api/admin/prendas/001', { visible: true });
  assert.deepEqual([r.status, r.headers.get('Retry-After')], [429, '10']);
});

test('si D1 no responde: estado 503 (nunca un estado inventado) y cambio 500 genérico', async () => {
  const { pedir, poner, db } = montar();
  db.caer();
  const e = await pedir('/api/admin/estado');
  assert.equal(e.status, 503);
  assert.deepEqual(await e.json(), { error: 'estado_no_disponible' });
  const c = await poner('/api/admin/prendas/001', { visible: true });
  assert.equal(c.status, 500);
  assert.deepEqual(await c.json(), { error: 'interno' });
});

test('miniaturas: se entregan aunque la foto esté oculta, sin caché pública', async () => {
  const { pedir } = montar();
  const r = await pedir('/api/admin/miniaturas/001/2.webp');
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('Content-Type'), 'image/webp');
  assert.equal(r.headers.get('Cache-Control'), 'private, no-store');
  assert.equal(await r.text(), 'miniatura-2');
  assert.equal((await pedir('/api/admin/miniaturas/001/1.webp')).status, 404);     // no está en R2
  assert.equal((await pedir('/api/admin/miniaturas/999/1.webp')).status, 404);     // no existe
  assert.equal((await pedir('/api/admin/miniaturas/001/9.webp')).status, 404);     // fuera de rango
  assert.equal((await pedir('/api/admin/miniaturas/001/2.avif')).status, 404);
});

test('rutas desconocidas de administración: 404', async () => {
  const { pedir } = montar();
  for (const ruta of ['/api/admin', '/api/admin/', '/api/admin/otra', '/api/admin/estado/x']) {
    assert.equal((await pedir(ruta)).status, 404, ruta);
  }
});

test('/panel y /panel/ sirven la misma página; solo los archivos del panel; el resto 404', async () => {
  const { pedir, activos } = montar();
  for (const ruta of ['/panel', '/panel/']) assert.equal((await pedir(ruta)).status, 200);
  assert.equal((await pedir('/panel/panel.css')).status, 200);
  assert.equal((await pedir('/panel/panel.js')).status, 200);
  assert.deepEqual(activos, ['/panel/', '/panel/', '/panel/panel.css', '/panel/panel.js']);
  for (const ruta of ['/panel/otra', '/panel/index.html', '/panel/x/panel.js']) {
    assert.equal((await pedir(ruta)).status, 404, ruta);
  }
});
