// scripts/subir-imagenes.js: qué archivos van a R2 y qué se sube o se borra en cada ejecución.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import subir from '../../scripts/subir-imagenes.js';

const { archivosDeGaleria, planificar } = subir;

const datos = { PRENDAS: [{ id: '001' }, { id: '002' }] };
const opt = { anchos: [160, 480, 800, 1200], anchosAvif: [480, 800, 1200], prendas: { '001': [[1, 1], [1, 1]], '002': [[1, 1]] } };

test('7 archivos por foto: WebP en 4 anchos y AVIF en 3 (160 px solo WebP)', () => {
  const lista = archivosDeGaleria(datos, opt);
  assert.equal(lista.length, 3 * 7);
  assert.deepEqual(lista.slice(0, 7).map(a => a.clave), [
    'f/001/1-160.webp', 'f/001/1-480.webp', 'f/001/1-800.webp', 'f/001/1-1200.webp',
    'f/001/1-480.avif', 'f/001/1-800.avif', 'f/001/1-1200.avif'
  ]);
  assert.deepEqual(lista[0], { clave: 'f/001/1-160.webp', ruta: 'public/img/001/1-160.webp', tipo: 'image/webp' });
  assert.equal(lista.find(a => a.clave === 'f/002/1-800.avif').tipo, 'image/avif');
  assert.ok(!lista.some(a => a.clave.endsWith('-160.avif')));
});

test('una prenda sin fotos optimizadas no genera archivos', () => {
  assert.deepEqual(archivosDeGaleria({ PRENDAS: [{ id: '009' }] }, opt), []);
});

test('la primera vez se sube todo y no se borra nada', () => {
  const archivos = archivosDeGaleria(datos, opt).map(a => ({ ...a, huella: 'h' }));
  const plan = planificar(archivos, {});
  assert.deepEqual([plan.subir.length, plan.borrar.length], [21, 0]);
});

test('después solo se sube lo nuevo o cambiado y se borra lo que ya no existe', () => {
  const archivos = archivosDeGaleria(datos, opt).map(a => ({ ...a, huella: 'h' }));
  const manifiesto = Object.fromEntries(archivos.map(a => [a.clave, 'h']));
  assert.deepEqual(planificar(archivos, manifiesto), { subir: [], borrar: [] });

  const cambiado = archivos.map(a => (a.clave === 'f/001/2-800.webp' ? { ...a, huella: 'otra' } : a));
  assert.deepEqual(planificar(cambiado, manifiesto).subir.map(a => a.clave), ['f/001/2-800.webp']);

  const sinPrenda2 = archivos.filter(a => !a.clave.startsWith('f/002/'));
  const plan = planificar(sinPrenda2, manifiesto);
  assert.equal(plan.subir.length, 0);
  assert.equal(plan.borrar.length, 7);
  assert.ok(plan.borrar.every(c => c.startsWith('f/002/')));
});

test('--forzar sube todo aunque el manifiesto esté al día', () => {
  const archivos = archivosDeGaleria(datos, opt).map(a => ({ ...a, huella: 'h' }));
  const manifiesto = Object.fromEntries(archivos.map(a => [a.clave, 'h']));
  assert.equal(planificar(archivos, manifiesto, true).subir.length, 21);
});
