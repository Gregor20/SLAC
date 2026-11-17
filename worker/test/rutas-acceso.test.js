// US3 (SC-004, SC-005): cada ruta de administración, con el validador de Access REAL y los manejadores
// REALES, rechaza sin JWT válido o fuera del dominio propio, y en ningún caso toca D1 ni R2.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearClave, firmar } from '../test-ayudas/jwt.js';
import { crearEnrutador } from '../src/enrutador.js';
import { crearValidador } from '../src/acceso.js';
import { manejarAdmin } from '../src/api-admin.js';
import { manejarPanel } from '../src/panel-estatico.js';

const EQUIPO = 'https://equipo-de-prueba.cloudflareaccess.com';
const AUD = 'aud-de-prueba';
const HOST = 'slac-official.com';
const galeria = { prendas: [{ id: '001', descripcion: 'a', fotos: [[1, 1]] }], portada: [] };

/** Rutas protegidas × método; los PUT llevan Origin propio para que solo el acceso decida. */
const RUTAS = [
  ['GET', '/panel'], ['GET', '/panel/'], ['GET', '/panel/panel.js'], ['GET', '/panel/panel.css'],
  ['GET', '/api/admin/estado'], ['GET', '/api/admin/registro'], ['GET', '/api/admin/miniaturas/001/1.webp'],
  ['PUT', '/api/admin/prendas/001'], ['PUT', '/api/admin/prendas/001/fotos/1']
];

function montar() {
  const toques = [];
  const espia = nombre => new Proxy({}, { get: (_, p) => { toques.push(`${nombre}.${String(p)}`); throw new Error('uso indebido'); } });
  const ASSETS = { fetch: async () => { toques.push('ASSETS.fetch'); return new Response('estatico'); } };
  const env = {
    DB: espia('DB'), FOTOS: espia('FOTOS'), ASSETS, LIMITE_CAMBIOS: { limit: async () => ({ success: true }) },
    ACCESS_TEAM_DOMAIN: EQUIPO, ACCESS_AUD: AUD, HOST_PERMITIDO: HOST
  };
  return { env, toques };
}

async function entorno() {
  const clave = await crearClave('k1');
  const validar = crearValidador({ cargarClaves: async () => [clave.publica] });
  const enrutador = crearEnrutador({ galeria, validar, manejadores: { admin: manejarAdmin, panel: manejarPanel } });
  const ahora = Math.floor(Date.now() / 1000);
  const jwt = (extra = {}) => firmar(clave, { iss: EQUIPO, aud: [AUD], email: 'ana@correo.com', iat: ahora - 10, nbf: ahora - 10, exp: ahora + 3600, ...extra });
  const pedir = (env, metodo, ruta, { host = HOST, token } = {}) => enrutador(new Request(`https://${host}${ruta}`, {
    method: metodo,
    headers: { ...(token ? { 'Cf-Access-Jwt-Assertion': token } : {}), ...(metodo === 'PUT' ? { Origin: `https://${host}`, 'Content-Type': 'application/json' } : {}) },
    body: metodo === 'PUT' ? '{"visible":true}' : undefined
  }), env);
  return { clave, jwt, pedir };
}

const esperar403Vacio = async (respuesta, etiqueta) => {
  assert.equal(respuesta.status, 403, etiqueta);
  assert.equal(await respuesta.text(), '', `${etiqueta}: cuerpo vacío`);
  assert.equal(respuesta.headers.get('Cache-Control'), 'no-store', etiqueta);
};

test('sin JWT: 403 de cuerpo vacío en todas las rutas y D1/R2 intactos', async () => {
  const { pedir } = await entorno();
  const { env, toques } = montar();
  for (const [metodo, ruta] of RUTAS) await esperar403Vacio(await pedir(env, metodo, ruta), `${metodo} ${ruta}`);
  assert.deepEqual(toques, []);
});

test('JWT inválido (caducado, aud, iss, firma ajena, basura): 403 en todas las rutas y D1/R2 intactos', async () => {
  const { pedir, jwt } = await entorno();
  const ajena = await crearClave('k1');   // mismo `kid`, otra clave: la firma no verifica
  const ahora = Math.floor(Date.now() / 1000);
  const malos = [
    await jwt({ exp: ahora - 5 }), await jwt({ aud: ['otro'] }), await jwt({ iss: 'https://otro.cloudflareaccess.com' }),
    await firmar(ajena, { iss: EQUIPO, aud: [AUD], email: 'ana@correo.com', exp: ahora + 3600 }), 'no-es-un-jwt'
  ];
  const { env, toques } = montar();
  for (const token of malos) {
    for (const [metodo, ruta] of RUTAS) await esperar403Vacio(await pedir(env, metodo, ruta, { token }), `${metodo} ${ruta}`);
  }
  assert.deepEqual(toques, []);
});

test('JWT válido pero Host distinto de HOST_PERMITIDO (workers.dev, www): 403 y D1/R2 intactos', async () => {
  const { pedir, jwt } = await entorno();
  const token = await jwt();
  const { env, toques } = montar();
  for (const host of ['slac.cuenta.workers.dev', 'www.slac-official.com', 'otro.com']) {
    for (const [metodo, ruta] of RUTAS) await esperar403Vacio(await pedir(env, metodo, ruta, { host, token }), `${host} ${metodo} ${ruta}`);
  }
  assert.deepEqual(toques, []);
});

test('JWT válido en el dominio propio: el panel responde (control positivo de las pruebas anteriores)', async () => {
  const { pedir, jwt } = await entorno();
  const { env, toques } = montar();
  const respuesta = await pedir(env, 'GET', '/panel/', { token: await jwt() });
  assert.equal(respuesta.status, 200);
  assert.deepEqual(toques, ['ASSETS.fetch']);
});

test('sin HOST_PERMITIDO configurado, el panel queda cerrado (fail closed)', async () => {
  const { pedir, jwt } = await entorno();
  const { env, toques } = montar();
  delete env.HOST_PERMITIDO;
  await esperar403Vacio(await pedir(env, 'GET', '/api/admin/estado', { token: await jwt() }), 'sin HOST_PERMITIDO');
  assert.deepEqual(toques, []);
});
