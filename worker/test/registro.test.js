// US5: registro de cambios (GET /api/admin/registro, contracts/api-admin.md).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HOST, PERSONA, montar } from '../test-ayudas/admin.js';

const registro = async (pedir, consulta = '') => (await pedir(`/api/admin/registro${consulta}`));

test('registro: más reciente primero, con persona en minúsculas y el estado nuevo', async () => {
  const { pedir, poner, reloj } = montar();
  await poner('/api/admin/prendas/001', { visible: true });
  reloj.t += 1000;
  await poner('/api/admin/prendas/001/fotos/2', { visible: false });
  reloj.t += 1000;
  await poner('/api/admin/prendas/001', { visible: false });
  const r = await registro(pedir);
  assert.equal(r.status, 200);
  assert.match(r.headers.get('Content-Type'), /application\/json/);
  assert.deepEqual(await r.json(), { registro: [
    { en: reloj.t, por: PERSONA, objeto: 'prenda', prenda: '001', foto: null, visible: false },
    { en: reloj.t - 1000, por: PERSONA, objeto: 'foto', prenda: '001', foto: 2, visible: false },
    { en: reloj.t - 2000, por: PERSONA, objeto: 'prenda', prenda: '001', foto: null, visible: true }
  ] });
});

test('registro: sin cambios devuelve lista vacía; repetir un estado no añade filas', async () => {
  const { pedir, poner } = montar();
  assert.deepEqual(await (await registro(pedir)).json(), { registro: [] });
  await poner('/api/admin/prendas/001', { visible: true });
  await poner('/api/admin/prendas/001', { visible: true });
  assert.equal((await (await registro(pedir)).json()).registro.length, 1);
});

test('registro: límite por defecto 50 y `limite` entre 1 y 100', async () => {
  const { pedir, poner, reloj } = montar();
  for (let i = 0; i < 60; i++) {
    reloj.t += 1;
    await poner('/api/admin/prendas/001', { visible: i % 2 === 0 });
  }
  assert.equal((await (await registro(pedir)).json()).registro.length, 50);
  assert.equal((await (await registro(pedir, '?limite=3')).json()).registro.length, 3);
  assert.equal((await (await registro(pedir, '?limite=1')).json()).registro[0].en, reloj.t);
  assert.equal((await (await registro(pedir, '?limite=100')).json()).registro.length, 60);
});

test('registro: `limite` inválido → 400 sin tocar nada', async () => {
  const { pedir } = montar();
  for (const malo of ['0', '101', '-1', '1.5', 'x', '', '5e1', '%20', '07x']) {
    const r = await registro(pedir, `?limite=${malo}`);
    assert.equal(r.status, 400, `limite=${malo}`);
    assert.deepEqual(await r.json(), { error: 'limite_invalido' });
  }
  assert.equal((await registro(pedir, '?limite=1&limite=2')).status, 400);
});

test('registro: solo lectura (la API no edita ni borra) y D1 caído → 503', async () => {
  const { pedir, poner, db } = montar();
  await poner('/api/admin/prendas/001', { visible: true });
  for (const metodo of ['PUT', 'DELETE', 'POST']) {
    const r = await pedir('/api/admin/registro', { method: metodo, headers: { Origin: HOST, 'Content-Type': 'application/json' }, body: metodo === 'DELETE' ? undefined : '{"visible":true}' });
    assert.ok([404, 405].includes(r.status), `${metodo} → ${r.status}`);
  }
  assert.equal(db.consultar('SELECT * FROM registro').length, 1);
  db.caer();
  const caido = await registro(pedir);
  assert.equal(caido.status, 503);
  assert.deepEqual(await caido.json(), { error: 'estado_no_disponible' });
});
