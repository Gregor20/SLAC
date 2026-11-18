// Ayuda de prueba: base D1 simulada con SQLite real (node:sqlite) y la migración verdadera.
// Implementa solo lo que usa el Worker: prepare().bind().first()/all()/run() y batch() transaccional.
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';

const MIGRACION = new URL('../migraciones/0001_estado.sql', import.meta.url);

export function crearD1() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(MIGRACION, 'utf8'));
  const contadores = { consultas: 0, lecturasMeta: 0 };
  let caido = false;

  const preparar = sql => {
    let valores = [];
    const enlace = {
      bind(...v) { valores = v; return enlace; },
      sql,
      ejecutar() {
        if (caido) throw new Error('D1 no responde');
        contadores.consultas++;
        if (/FROM meta/i.test(sql) && /^\s*SELECT/i.test(sql)) contadores.lecturasMeta++;
        const sentencia = sqlite.prepare(sql);
        return /^\s*(SELECT|WITH)/i.test(sql)
          ? { results: sentencia.all(...valores).map(f => ({ ...f })), success: true }
          : (sentencia.run(...valores), { results: [], success: true });
      },
      async first() { return this.ejecutar().results[0] ?? null; },
      async all() { return this.ejecutar(); },
      async run() { return this.ejecutar(); }
    };
    return enlace;
  };

  return {
    prepare: preparar,
    async batch(sentencias) {
      if (caido) throw new Error('D1 no responde');
      sqlite.exec('BEGIN');
      try {
        const resultados = sentencias.map(s => s.ejecutar());
        sqlite.exec('COMMIT');
        return resultados;
      } catch (error) {
        sqlite.exec('ROLLBACK');
        throw error;
      }
    },
    // Controles de las pruebas
    sqlite, contadores,
    caer(valor = true) { caido = valor; },
    consultar: (sql, ...v) => sqlite.prepare(sql).all(...v).map(f => ({ ...f }))
  };
}
