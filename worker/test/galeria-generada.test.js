// scripts/galeria-worker.js: lo que recibe el Worker de la galería (T013).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import generador from '../../scripts/galeria-worker.js';

const { construirGaleria, contenido } = generador;

const datos = {
  PORTADA: [{ prenda: '002', foto: 1 }, { prenda: '001', foto: 2 }],
  PRENDAS: [
    { id: '001', descripcion: 'Mono rojo', imagenes: ['public/fotos/a.jpeg', 'public/fotos/b.jpeg'] },
    { id: '002', descripcion: 'Conjunto negro', imagenes: ['public/fotos/c.jpeg'] }
  ]
};
const opt = { anchos: [160, 480], anchosAvif: [480], prendas: { '001': [[1200, 1600], [1000, 1500]], '002': [[900, 1200]] } };

test('construye prendas, fotos y portada en el formato del modelo de datos', () => {
  assert.deepEqual(construirGaleria(datos, opt), {
    anchos: [160, 480], anchosAvif: [480],
    prendas: [
      { id: '001', descripcion: 'Mono rojo', fotos: [[1200, 1600], [1000, 1500]] },
      { id: '002', descripcion: 'Conjunto negro', fotos: [[900, 1200]] }
    ],
    portada: ['002', '001']
  });
});

test('no arrastra rutas de originales ni datos de contacto', () => {
  const texto = JSON.stringify(construirGaleria({ ...datos, CONTACTO: { telefono: '+34 600 000 000' } }, opt));
  assert.doesNotMatch(texto, /public\/fotos|telefono|\+34/);
});

test('falla si faltan las fotos optimizadas o no coinciden con las de la prenda', () => {
  assert.throws(() => construirGaleria(datos, null), /optimizar/);
  assert.throws(() => construirGaleria(datos, { ...opt, prendas: { '001': [[1, 1]], '002': [[1, 1]] } }), /prenda 001/);
});

test('el archivo generado es un módulo ES con GALERIA', async () => {
  const modulo = await import(`data:text/javascript,${encodeURIComponent(contenido(construirGaleria(datos, opt)))}`);
  assert.equal(modulo.GALERIA.prendas.length, 2);
});
