// Reglas de visibilidad (FR-002, FR-005, FR-009): prenda × foto → visible. Sin E/S.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fotoVisible, fotosVisibles, prendaVisible, prendaPorId } from '../src/visibilidad.js';

const galeria = {
  prendas: [
    { id: '001', descripcion: 'a', fotos: [[1200, 1600], [1200, 1600], [1200, 1600]] },
    { id: '002', descripcion: 'b', fotos: [[1200, 1500]] }
  ]
};
const [p1, p2] = galeria.prendas;
const estado = (prendas = {}, fotos = {}) => ({ version: 1, prendas, fotos });
const vis = { visible: true, por: 'a@b.c', en: 1 };
const oculta = { visible: false, por: 'a@b.c', en: 1 };

test('una prenda sin estado está oculta (FR-009)', () => {
  const e = estado();
  assert.equal(fotoVisible(e, '001', 1), false);
  assert.equal(prendaVisible(e, p1), false);
  assert.deepEqual(fotosVisibles(e, p1), []);
});

test('una foto sin estado propio está activa si su prenda está visible', () => {
  const e = estado({ '001': vis });
  assert.deepEqual(fotosVisibles(e, p1), [1, 2, 3]);
  assert.equal(prendaVisible(e, p1), true);
});

test('una foto solo se ve si prenda y foto lo están', () => {
  const e = estado({ '001': vis }, { '001:2': oculta });
  assert.equal(fotoVisible(e, '001', 1), true);
  assert.equal(fotoVisible(e, '001', 2), false);
  assert.deepEqual(fotosVisibles(e, p1), [1, 3]);
  // foto activa pero prenda oculta
  const o = estado({ '001': oculta }, { '001:2': vis });
  assert.equal(fotoVisible(o, '001', 2), false);
});

test('una prenda visible sin fotos activas no se muestra (sin hueco ni número suelto)', () => {
  const e = estado({ '002': vis }, { '002:1': oculta });
  assert.equal(prendaVisible(e, p2), false);
  assert.deepEqual(fotosVisibles(e, p2), []);
});

test('desactivar la prenda conserva el estado de cada foto al reactivarla (US1.6)', () => {
  const fotos = { '001:2': oculta };
  assert.deepEqual(fotosVisibles(estado({ '001': oculta }, fotos), p1), []);
  assert.deepEqual(fotosVisibles(estado({ '001': vis }, fotos), p1), [1, 3]);
});

test('estado ausente o corrupto cierra en seguro', () => {
  assert.equal(fotoVisible(null, '001', 1), false);
  assert.equal(fotoVisible({}, '001', 1), false);
  assert.equal(fotoVisible(estado({ '001': { visible: 1 } }), '001', 1), false); // solo `true` estricto
  assert.equal(fotoVisible(estado({ '001': vis }), '__proto__', 1), false);
});

test('prendaPorId solo devuelve prendas de la galería', () => {
  assert.equal(prendaPorId(galeria, '002'), p2);
  assert.equal(prendaPorId(galeria, '999'), null);
  assert.equal(prendaPorId(galeria, '__proto__'), null);
  assert.equal(prendaPorId(null, '001'), null);
});
