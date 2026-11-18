// Ayuda de prueba: Worker de administración montado con D1 simulado, R2 y estáticos de mentira.
import { crearD1 } from './d1.js';
import { crearEnrutador } from '../src/enrutador.js';
import { crearAlmacen } from '../src/estado.js';
import { manejarAdmin } from '../src/api-admin.js';
import { manejarPanel } from '../src/panel-estatico.js';

export const HOST = 'https://slac-official.com';
export const PERSONA = 'ana@correo.com';
export const galeria = {
  prendas: [
    { id: '001', descripcion: 'Mono rojo', fotos: [[1, 1], [1, 1], [1, 1]] },
    { id: '012', descripcion: 'Conjunto negro', fotos: [[1, 1]] }
  ],
  portada: ['012']
};

export function montar() {
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
