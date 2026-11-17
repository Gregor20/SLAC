// Validación del JWT de Cloudflare Access (FR-003, FR-006, SC-004, SC-005).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearClave, firmar } from '../test-ayudas/jwt.js';
import { crearValidador } from '../src/acceso.js';

const EQUIPO = 'https://equipo-de-prueba.cloudflareaccess.com';
const AUD = 'aud-de-prueba';
const HOST = 'slac-official.com';
const env = { ACCESS_TEAM_DOMAIN: EQUIPO, ACCESS_AUD: AUD, HOST_PERMITIDO: HOST };
const AHORA = 1_800_000_000_000;
const seg = AHORA / 1000;

const peticion = (jwt, host = HOST) =>
  new Request(`https://${host}/api/admin/estado`, { headers: jwt ? { 'Cf-Access-Jwt-Assertion': jwt } : {} });
const payload = (extra = {}) => ({ iss: EQUIPO, aud: [AUD], email: 'Ana@Correo.com', iat: seg - 10, nbf: seg - 10, exp: seg + 3600, ...extra });

async function escenario() {
  const clave = await crearClave('k1');
  let cargas = 0;
  const validador = crearValidador({ cargarClaves: async () => { cargas++; return [clave.publica]; } });
  return { clave, validar: (req, e = env, ahora = AHORA) => validador(req, e, ahora), cargas: () => cargas };
}

test('acepta un JWT válido y devuelve el correo en minúsculas', async () => {
  const { clave, validar } = await escenario();
  assert.equal(await validar(peticion(await firmar(clave, payload()))), 'ana@correo.com');
});

test('rechaza sin cabecera o con un JWT mal formado', async () => {
  const { validar } = await escenario();
  assert.equal(await validar(peticion(null)), null);
  assert.equal(await validar(peticion('no-es-un-jwt')), null);
  assert.equal(await validar(peticion('a.b.c')), null);
});

test('rechaza un JWT caducado o aún no válido', async () => {
  const { clave, validar } = await escenario();
  assert.equal(await validar(peticion(await firmar(clave, payload({ exp: seg - 1 })))), null);
  assert.equal(await validar(peticion(await firmar(clave, payload({ nbf: seg + 60 })))), null);
});

test('rechaza `aud` o `iss` erróneos', async () => {
  const { clave, validar } = await escenario();
  assert.equal(await validar(peticion(await firmar(clave, payload({ aud: ['otro'] })))), null);
  assert.equal(await validar(peticion(await firmar(clave, payload({ iss: 'https://otro.cloudflareaccess.com' })))), null);
  assert.equal(await validar(peticion(await firmar(clave, payload({ aud: AUD })))), 'ana@correo.com'); // aud como texto
});

test('rechaza una firma alterada o un algoritmo distinto', async () => {
  const { clave, validar } = await escenario();
  const [h, p, f] = (await firmar(clave, payload())).split('.');
  const otro = Buffer.from(JSON.stringify(payload({ email: 'intruso@x.com' }))).toString('base64url');
  assert.equal(await validar(peticion(`${h}.${otro}.${f}`)), null);
  assert.equal(await validar(peticion(await firmar(clave, payload(), { alg: 'none' }))), null);
  assert.equal(await validar(peticion(await firmar(clave, payload(), { alg: 'HS256' }))), null);
  assert.ok(p);
});

test('rechaza una firma de otra clave con el mismo kid', async () => {
  const { validar } = await escenario();
  const impostora = await crearClave('k1');
  assert.equal(await validar(peticion(await firmar(impostora, payload()))), null);
});

test('un `kid` desconocido recarga las claves una vez y rechaza; no se recarga en bucle', async () => {
  const { validar, cargas } = await escenario();
  const desconocida = await crearClave('k-nueva');
  await validar(peticion(await firmar(desconocida, payload()))); // carga inicial (no conocía ninguna)
  assert.equal(cargas(), 1);
  assert.equal(await validar(peticion(await firmar(desconocida, payload())), env, AHORA + 1_000), null);
  assert.equal(cargas(), 1, 'dentro de la ventana de espera no recarga');
  assert.equal(await validar(peticion(await firmar(desconocida, payload())), env, AHORA + 60_000), null);
  assert.equal(cargas(), 2, 'pasada la ventana recarga una vez');
});

test('peticiones simultáneas con la caché fría esperan la misma descarga de claves (miniaturas del panel)', async () => {
  const clave = await crearClave('k1');
  let cargas = 0;
  const validador = crearValidador({
    cargarClaves: async () => { cargas++; await new Promise(r => setTimeout(r, 20)); return [clave.publica]; }
  });
  const jwt = await firmar(clave, payload());
  const resultados = await Promise.all(Array.from({ length: 20 }, () => validador(peticion(jwt), env, AHORA)));
  assert.deepEqual(resultados, Array(20).fill('ana@correo.com'), 'ninguna petición legítima se rechaza');
  assert.equal(cargas, 1, 'una sola descarga compartida');
});

test('rechaza un JWT sin correo', async () => {
  const { clave, validar } = await escenario();
  assert.equal(await validar(peticion(await firmar(clave, payload({ email: undefined })))), null);
  assert.equal(await validar(peticion(await firmar(clave, payload({ email: 'sin-arroba' })))), null);
});

test('rechaza un JWT válido si el Host no es HOST_PERMITIDO (p. ej. workers.dev)', async () => {
  const { clave, validar } = await escenario();
  const jwt = await firmar(clave, payload());
  assert.equal(await validar(peticion(jwt, 'slac.cuenta.workers.dev')), null);
  assert.equal(await validar(peticion(jwt), { ...env, HOST_PERMITIDO: undefined }), null);
});

test('falta de secretos: cierra en seguro', async () => {
  const { clave, validar } = await escenario();
  const jwt = await firmar(clave, payload());
  assert.equal(await validar(peticion(jwt), { HOST_PERMITIDO: HOST }), null);
  assert.equal(await validar(peticion(jwt), { ...env, ACCESS_AUD: undefined }), null);
});

test('ACCESS_DEV_EMAIL solo sirve en localhost', async () => {
  const { validar } = await escenario();
  const dev = { ACCESS_DEV_EMAIL: 'Prueba@Local' };
  assert.equal(await validar(peticion(null, 'localhost:8787'), dev), 'prueba@local');
  assert.equal(await validar(peticion(null, HOST), { ...env, ...dev }), null);
  assert.equal(await validar(peticion(null, 'slac.cuenta.workers.dev'), dev), null);
});
