// Estado de visibilidad en D1 con caché en el aislado (research D3). Cierra en seguro: ante un fallo
// de lectura se sirve el último estado correcto si tiene menos de 60 s; si no, todo oculto.

const CACHE_MS = 10_000;     // sin consultar D1
const VALIDEZ_MS = 60_000;   // último estado correcto aprovechable si D1 falla

const OCULTO = () => ({ version: -1, prendas: {}, fotos: {}, degradado: true });

function construirEstado(version, filasPrendas, filasFotos) {
  const prendas = {};
  const fotos = {};
  for (const f of filasPrendas) prendas[f.id] = { visible: f.visible === 1, por: f.por, en: f.en };
  for (const f of filasFotos) fotos[`${f.prenda}:${f.n}`] = { visible: f.visible === 1, por: f.por, en: f.en };
  return { version, prendas, fotos, degradado: false };
}

const SQL = {
  version: 'SELECT version FROM meta WHERE id = 1',
  prendas: 'SELECT id, visible, por, en FROM prenda_estado',
  fotos: 'SELECT prenda, n, visible, por, en FROM foto_estado',
  prendaActual: 'SELECT visible, por, en FROM prenda_estado WHERE id = ?',
  fotoActual: 'SELECT visible, por, en FROM foto_estado WHERE prenda = ? AND n = ?',
  upsertPrenda: `INSERT INTO prenda_estado (id, visible, por, en) VALUES (?, ?, ?, ?)
                 ON CONFLICT(id) DO UPDATE SET visible = excluded.visible, por = excluded.por, en = excluded.en`,
  upsertFoto: `INSERT INTO foto_estado (prenda, n, visible, por, en) VALUES (?, ?, ?, ?, ?)
               ON CONFLICT(prenda, n) DO UPDATE SET visible = excluded.visible, por = excluded.por, en = excluded.en`,
  registro: 'INSERT INTO registro (en, por, objeto, prenda, foto, visible) VALUES (?, ?, ?, ?, ?, ?)',
  subirVersion: 'UPDATE meta SET version = version + 1 WHERE id = 1',
  contar: 'SELECT COUNT(*) AS total FROM registro WHERE por = ? AND en >= ?'
};

/** Un almacén por aislado del Worker (guarda la caché). `ahora` se puede sustituir en las pruebas. */
export function crearAlmacen({ ahora = Date.now } = {}) {
  let cache = null;       // { estado, verificadoEn }
  let cargando = null;    // promesa en curso: evita varias lecturas a la vez

  async function recargar(db, instante) {
    const { version } = (await db.prepare(SQL.version).first()) ?? {};
    if (typeof version !== 'number') throw new Error('estado sin versión');
    if (cache && cache.estado.version === version) {
      cache.verificadoEn = instante;                 // sin cambios: solo se leyó 1 fila
      return cache.estado;
    }
    const [prendas, fotos] = await db.batch([db.prepare(SQL.prendas), db.prepare(SQL.fotos)]);
    const estado = construirEstado(version, prendas.results, fotos.results);
    cache = { estado, verificadoEn: instante };
    return estado;
  }

  /** Estado vigente: { version, prendas, fotos, degradado }. Nunca lanza: ante un fallo cierra en seguro. */
  async function leer(db) {
    const instante = ahora();
    if (cache && instante - cache.verificadoEn < CACHE_MS) return cache.estado;
    try {
      cargando ??= recargar(db, instante).finally(() => { cargando = null; });
      return await cargando;
    } catch {
      return cache && instante - cache.verificadoEn < VALIDEZ_MS ? cache.estado : OCULTO();
    }
  }

  /** Escribe estado + registro + versión en una sola transacción (D1 `batch`). */
  async function escribir(db, upsert, objeto, prenda, foto, visible, persona, instante) {
    const valor = visible ? 1 : 0;
    const resultados = await db.batch([
      upsert,
      db.prepare(SQL.registro).bind(instante, persona, objeto, prenda, foto, valor),
      db.prepare(SQL.subirVersion),
      db.prepare(SQL.version)
    ]);
    cache = null;   // el cambio propio se ve de inmediato
    return { cambiado: true, cambio: { por: persona, en: instante }, version: resultados[3].results[0].version };
  }

  async function sinCambio(db, fila) {
    const { version } = await db.prepare(SQL.version).first();
    return { cambiado: false, cambio: fila ? { por: fila.por, en: fila.en } : null, version };
  }

  /** Activa o desactiva una prenda. `visible` ya validado como booleano; `persona` en minúsculas. */
  async function cambiarPrenda(db, id, visible, persona) {
    const fila = await db.prepare(SQL.prendaActual).bind(id).first();
    if ((fila ? fila.visible === 1 : false) === visible) return sinCambio(db, fila);   // sin fila = oculta
    const instante = ahora();
    return escribir(db, db.prepare(SQL.upsertPrenda).bind(id, visible ? 1 : 0, persona, instante),
      'prenda', id, null, visible, persona, instante);
  }

  /** Activa o desactiva una foto (`n` = número original, ya validado contra la galería). */
  async function cambiarFoto(db, id, n, visible, persona) {
    const fila = await db.prepare(SQL.fotoActual).bind(id, n).first();
    if ((fila ? fila.visible === 1 : true) === visible) return sinCambio(db, fila);    // sin fila = activa
    const instante = ahora();
    return escribir(db, db.prepare(SQL.upsertFoto).bind(id, n, visible ? 1 : 0, persona, instante),
      'foto', id, n, visible, persona, instante);
  }

  /** Cambios de la persona desde `desdeMs` (respaldo del límite de frecuencia). */
  async function contarCambios(db, persona, desdeMs) {
    return (await db.prepare(SQL.contar).bind(persona, desdeMs).first()).total;
  }

  return { leer, cambiarPrenda, cambiarFoto, contarCambios };
}
