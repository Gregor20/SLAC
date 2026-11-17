// Estado en D1 (SQLite real con la migración verdadera): caché, versión, fail closed y transacciones.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearD1 } from '../test-ayudas/d1.js';
import { crearAlmacen } from '../src/estado.js';

function entorno() {
  const db = crearD1();
  const reloj = { t: 1_800_000_000_000 };
  const almacen = crearAlmacen({ ahora: () => reloj.t });
  return { db, reloj, almacen };
}
const registros = db => db.consultar('SELECT * FROM registro ORDER BY id');
const version = db => db.consultar('SELECT version FROM meta')[0].version;

test('sin filas: todo oculto y no degradado (estado válido y vacío)', async () => {
  const { db, almacen } = entorno();
  const estado = await almacen.leer(db);
  assert.deepEqual([estado.version, estado.prendas, estado.fotos, estado.degradado], [0, {}, {}, false]);
});

test('cambiarPrenda escribe estado, registro y versión en una transacción', async () => {
  const { db, reloj, almacen } = entorno();
  const r = await almacen.cambiarPrenda(db, '001', true, 'ana@correo.com');
  assert.deepEqual(r, { cambiado: true, cambio: { por: 'ana@correo.com', en: reloj.t }, version: 1 });
  assert.deepEqual(db.consultar('SELECT id, visible, por, en FROM prenda_estado'), [{ id: '001', visible: 1, por: 'ana@correo.com', en: reloj.t }]);
  assert.deepEqual(registros(db).map(({ objeto, prenda, foto, visible, por }) => ({ objeto, prenda, foto, visible, por })),
    [{ objeto: 'prenda', prenda: '001', foto: null, visible: 1, por: 'ana@correo.com' }]);
  assert.equal(version(db), 1);
});

test('cambiarFoto guarda el número original y reutiliza la fila al volver a cambiar', async () => {
  const { db, reloj, almacen } = entorno();
  await almacen.cambiarFoto(db, '001', 2, false, 'ana@correo.com');
  reloj.t += 5000;
  const r = await almacen.cambiarFoto(db, '001', 2, true, 'luis@correo.com');
  assert.deepEqual([r.cambiado, r.version, r.cambio.por], [true, 2, 'luis@correo.com']);
  assert.deepEqual(db.consultar('SELECT prenda, n, visible, por FROM foto_estado'), [{ prenda: '001', n: 2, visible: 1, por: 'luis@correo.com' }]);
  assert.equal(registros(db).length, 2);
  assert.deepEqual(registros(db).map(f => [f.objeto, f.foto, f.visible]), [['foto', 2, 0], ['foto', 2, 1]]);
});

test('repetir un valor no escribe nada (idempotente) y devuelve el estado actual', async () => {
  const { db, reloj, almacen } = entorno();
  await almacen.cambiarPrenda(db, '001', true, 'ana@correo.com');
  const antes = reloj.t;
  reloj.t += 9000;
  const r = await almacen.cambiarPrenda(db, '001', true, 'luis@correo.com');
  assert.deepEqual(r, { cambiado: false, cambio: { por: 'ana@correo.com', en: antes }, version: 1 });
  assert.equal(registros(db).length, 1);
  assert.equal(version(db), 1);
  // sin fila: ocultar una prenda nueva o activar una foto sin estado ya es el valor vigente
  assert.equal((await almacen.cambiarPrenda(db, '002', false, 'ana@correo.com')).cambiado, false);
  assert.equal((await almacen.cambiarFoto(db, '001', 3, true, 'ana@correo.com')).cambiado, false);
  assert.equal(registros(db).length, 1);
});

test('si falla el registro, la transacción no cambia el estado ni la versión', async () => {
  const { db, almacen } = entorno();
  db.sqlite.exec(`CREATE TRIGGER falla BEFORE INSERT ON registro BEGIN SELECT RAISE(ABORT, 'registro caído'); END;`);
  await assert.rejects(almacen.cambiarPrenda(db, '001', true, 'ana@correo.com'));
  assert.deepEqual(db.consultar('SELECT * FROM prenda_estado'), []);
  assert.equal(version(db), 0);
});

test('la base rechaza correos en mayúsculas e identificadores fuera de patrón', async () => {
  const { db, almacen } = entorno();
  await assert.rejects(almacen.cambiarPrenda(db, '001', true, 'Ana@Correo.com'));
  await assert.rejects(almacen.cambiarPrenda(db, '../etc', true, 'ana@correo.com'));
  assert.deepEqual(db.consultar('SELECT * FROM prenda_estado'), []);
});

test('caché de 10 s: lecturas seguidas no vuelven a consultar D1', async () => {
  const { db, reloj, almacen } = entorno();
  await almacen.leer(db);
  const consultas = db.contadores.consultas;
  reloj.t += 9_999;
  await almacen.leer(db);
  assert.equal(db.contadores.consultas, consultas);
});

test('pasados 10 s lee solo la versión y recarga las tablas únicamente si cambió', async () => {
  const { db, reloj, almacen } = entorno();
  await almacen.cambiarPrenda(db, '001', true, 'ana@correo.com');
  await almacen.leer(db);
  const antes = db.contadores.consultas;
  reloj.t += 10_001;
  await almacen.leer(db);
  assert.equal(db.contadores.consultas - antes, 1, 'una sola fila (meta) si no cambió');

  // otro aislado cambia el estado: sube la versión
  db.sqlite.exec(`INSERT INTO prenda_estado VALUES ('002', 1, 'otra@x.com', 1); UPDATE meta SET version = version + 1`);
  assert.equal((await almacen.leer(db)).prendas['002'], undefined, 'dentro de la caché sigue igual');
  reloj.t += 10_001;
  const nuevo = await almacen.leer(db);
  assert.equal(nuevo.prendas['002'].visible, true);
  assert.equal(nuevo.version, 2);
});

test('un cambio propio invalida la caché y se ve al instante', async () => {
  const { db, almacen } = entorno();
  await almacen.leer(db);
  await almacen.cambiarPrenda(db, '001', true, 'ana@correo.com');
  assert.equal((await almacen.leer(db)).prendas['001'].visible, true);
});

test('error de D1 con un estado de menos de 60 s: sigue sirviendo el último correcto', async () => {
  const { db, reloj, almacen } = entorno();
  await almacen.cambiarPrenda(db, '001', true, 'ana@correo.com');
  await almacen.leer(db);
  db.caer();
  reloj.t += 30_000;
  const estado = await almacen.leer(db);
  assert.equal(estado.prendas['001'].visible, true);
  assert.equal(estado.degradado, false);
});

test('error de D1 con un estado de más de 60 s o sin estado previo: todo oculto (fail closed)', async () => {
  const { db, reloj, almacen } = entorno();
  await almacen.cambiarPrenda(db, '001', true, 'ana@correo.com');
  await almacen.leer(db);
  db.caer();
  reloj.t += 60_001;
  const viejo = await almacen.leer(db);
  assert.deepEqual([viejo.prendas, viejo.fotos, viejo.degradado], [{}, {}, true]);

  const nuevo = entorno();
  nuevo.db.caer();
  assert.equal((await nuevo.almacen.leer(nuevo.db)).degradado, true);
});

test('tras recuperarse D1 vuelve a servir el estado real', async () => {
  const { db, reloj, almacen } = entorno();
  await almacen.cambiarPrenda(db, '001', true, 'ana@correo.com');
  db.caer();
  reloj.t += 70_000;
  assert.equal((await almacen.leer(db)).degradado, true);
  db.caer(false);
  reloj.t += 1;
  const estado = await almacen.leer(db);
  assert.deepEqual([estado.degradado, estado.prendas['001'].visible], [false, true]);
});

test('contarCambios cuenta solo los de la persona dentro de la ventana', async () => {
  const { db, reloj, almacen } = entorno();
  await almacen.cambiarPrenda(db, '001', true, 'ana@correo.com');
  reloj.t += 20_000;
  await almacen.cambiarPrenda(db, '002', true, 'ana@correo.com');
  await almacen.cambiarPrenda(db, '003', true, 'luis@correo.com');
  assert.equal(await almacen.contarCambios(db, 'ana@correo.com', reloj.t - 10_000), 1);
  assert.equal(await almacen.contarCambios(db, 'ana@correo.com', 0), 2);
  assert.equal(await almacen.contarCambios(db, 'nadie@x.com', 0), 0);
});
