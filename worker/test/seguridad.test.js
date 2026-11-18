// Cabeceras, CSRF, validación de entradas y límite de frecuencia (FR-011, FR-012).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  conCabeceras, comprobarOrigen, leerCuerpoVisible, esIdValido, numeroFotoValido, limitarFrecuencia
} from '../src/seguridad.js';

const URL_BASE = 'https://slac-official.com/api/admin/prendas/001';
const put = (cuerpo, cabeceras = {}) => new Request(URL_BASE, {
  method: 'PUT', body: cuerpo,
  headers: { Origin: 'https://slac-official.com', 'Content-Type': 'application/json', ...cabeceras }
});

test('las respuestas llevan las cabeceras de seguridad del proyecto', () => {
  const r = conCabeceras(new Response('x', { headers: { 'Content-Type': 'application/json' } }));
  assert.match(r.headers.get('Strict-Transport-Security'), /max-age=31536000/);
  assert.equal(r.headers.get('X-Content-Type-Options'), 'nosniff');
  assert.equal(r.headers.get('X-Frame-Options'), 'DENY');
  assert.equal(r.headers.get('Referrer-Policy'), 'strict-origin-when-cross-origin');
  assert.ok(r.headers.get('Permissions-Policy'));
  assert.equal(r.headers.get('Cross-Origin-Opener-Policy'), 'same-origin');
  assert.equal(r.headers.get('Content-Security-Policy'), "frame-ancestors 'none'");
});

test('en HTML no se añade la CSP de cabecera (va en el <meta>) y la administración lleva noindex y no-store', () => {
  const html = conCabeceras(new Response('<p>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } }), { admin: true });
  assert.equal(html.headers.get('Content-Security-Policy'), null);
  assert.equal(html.headers.get('Cache-Control'), 'no-store');
  assert.equal(html.headers.get('X-Robots-Tag'), 'noindex, nofollow');
  const publica = conCabeceras(new Response('x'));
  assert.equal(publica.headers.get('X-Robots-Tag'), null);
});

test('conserva el estado y el cuerpo, y acepta respuestas con cabeceras inmutables', async () => {
  const original = Response.redirect('https://slac-official.com/panel/', 308); // cabeceras inmutables
  const r = conCabeceras(original);
  assert.equal(r.status, 308);
  assert.equal(r.headers.get('X-Frame-Options'), 'DENY');
  assert.equal(await conCabeceras(new Response('hola', { status: 201 })).text(), 'hola');
});

test('Origin ausente o ajeno se rechaza; el propio se acepta', () => {
  assert.equal(comprobarOrigen(put('{}', { Origin: 'https://slac-official.com' })), true);
  assert.equal(comprobarOrigen(new Request(URL_BASE, { method: 'PUT', body: '{}' })), false);
  assert.equal(comprobarOrigen(put('{}', { Origin: 'https://otro.com' })), false);
  assert.equal(comprobarOrigen(put('{}', { Origin: 'null' })), false);
  assert.equal(comprobarOrigen(put('{}', { Origin: 'http://slac-official.com' })), false);
});

test('Sec-Fetch-Site distinto de same-origin se rechaza si el navegador lo envía', () => {
  assert.equal(comprobarOrigen(put('{}', { 'Sec-Fetch-Site': 'same-origin' })), true);
  assert.equal(comprobarOrigen(put('{}', { 'Sec-Fetch-Site': 'cross-site' })), false);
  assert.equal(comprobarOrigen(put('{}', { 'Sec-Fetch-Site': 'same-site' })), false);
});

test('cuerpo: {"visible": true|false} estricto', async () => {
  assert.deepEqual(await leerCuerpoVisible(put('{"visible":true}')), { ok: true, visible: true });
  assert.deepEqual(await leerCuerpoVisible(put('{"visible": false}')), { ok: true, visible: false });
  for (const malo of ['{"visible":1}', '{"visible":"true"}', '{"visible":null}', '{}', '[]', '"x"', 'nulo',
    '{"visible":true,"extra":1}', '{"visible":true,"visible":false,"x":0}', '']) {
    const r = await leerCuerpoVisible(put(malo));
    assert.deepEqual([r.ok, r.status], [false, 400], `debe rechazar ${malo}`);
  }
});

test('cuerpo > 64 bytes → 413 y Content-Type no JSON → 415', async () => {
  const grande = JSON.stringify({ visible: true, relleno: 'x'.repeat(100) });
  assert.equal((await leerCuerpoVisible(put(grande))).status, 413);
  assert.equal((await leerCuerpoVisible(put('{"visible":true}', { 'Content-Type': 'text/plain' }))).status, 415);
  assert.equal((await leerCuerpoVisible(put('{"visible":true}', { 'Content-Type': 'application/json; charset=utf-8' }))).ok, true);
});

test('identificadores: patrón ^[0-9A-Za-z_-]{1,16}$ (sin ../, ni espacios, ni vacío)', () => {
  for (const bueno of ['001', 'abc_DEF-9', 'a'.repeat(16)]) assert.equal(esIdValido(bueno), true);
  for (const malo of ['', '../x', 'a/b', 'a b', 'a'.repeat(17), '001\n', 'ñ', 5, null, undefined]) {
    assert.equal(esIdValido(malo), false, `debe rechazar ${String(malo)}`);
  }
});

test('número de foto: entero 1…total', () => {
  assert.equal(numeroFotoValido('1', 5), 1);
  assert.equal(numeroFotoValido('5', 5), 5);
  for (const malo of ['0', '6', '01', '-1', '1.5', 'a', '', ' 1', '100']) {
    assert.equal(numeroFotoValido(malo, 5), null, `debe rechazar ${malo}`);
  }
});

test('límite de frecuencia con el binding de Cloudflare', async () => {
  const llamadas = [];
  const env = { LIMITE_CAMBIOS: { limit: async ({ key }) => { llamadas.push(key); return { success: llamadas.length <= 2 }; } } };
  assert.equal((await limitarFrecuencia(env, 'ana@x.com', null)).ok, true);
  assert.equal((await limitarFrecuencia(env, 'ana@x.com', null)).ok, true);
  const tercera = await limitarFrecuencia(env, 'ana@x.com', null);
  assert.deepEqual([tercera.ok, tercera.retryAfter], [false, 10]);
  assert.deepEqual(llamadas, ['ana@x.com', 'ana@x.com', 'ana@x.com']);
});

test('sin binding: respaldo contando los cambios recientes de la persona', async () => {
  const contar = async (persona, desde) => (assert.equal(persona, 'ana@x.com'), assert.ok(desde > 0), 30);
  assert.equal((await limitarFrecuencia({}, 'ana@x.com', async () => 29)).ok, true);
  const r = await limitarFrecuencia({}, 'ana@x.com', contar);
  assert.deepEqual([r.ok, r.retryAfter], [false, 10]);
});

test('si el límite falla (binding o D1), la operación se rechaza', async () => {
  const roto = { LIMITE_CAMBIOS: { limit: async () => { throw new Error('x'); } } };
  assert.equal((await limitarFrecuencia(roto, 'ana@x.com', null)).ok, false);
  assert.equal((await limitarFrecuencia({}, 'ana@x.com', async () => { throw new Error('x'); })).ok, false);
});
