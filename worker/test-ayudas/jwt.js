// Ayudas de prueba: genera claves RSA y firma JWT como lo hace Cloudflare Access.
import { webcrypto } from 'node:crypto';

globalThis.crypto ??= webcrypto;

const b64url = bytes => Buffer.from(bytes).toString('base64url');
const json = objeto => b64url(new TextEncoder().encode(JSON.stringify(objeto)));

export async function crearClave(kid) {
  const par = await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true, ['sign', 'verify']);
  const jwk = await crypto.subtle.exportKey('jwk', par.publicKey);
  return { kid, privada: par.privateKey, publica: { ...jwk, kid, alg: 'RS256', use: 'sig' } };
}

export async function firmar(clave, payload, cabecera = {}) {
  const datos = `${json({ alg: 'RS256', kid: clave.kid, typ: 'JWT', ...cabecera })}.${json(payload)}`;
  const firma = await crypto.subtle.sign({ name: 'RSASSA-PKCS1-v1_5' }, clave.privada, new TextEncoder().encode(datos));
  return `${datos}.${b64url(new Uint8Array(firma))}`;
}
