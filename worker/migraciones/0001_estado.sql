-- Estado de visibilidad de las prendas y fotos (015). Ver specs/015-panel-admin-online/data-model.md.
-- Sin fila en prenda_estado → la prenda está oculta (FR-009). Sin fila en foto_estado → la foto está activa.
-- GLOB '*[^0-9A-Za-z_-]*' equivale a «contiene algún carácter fuera de ^[0-9A-Za-z_-]+$».

CREATE TABLE prenda_estado (
  id      TEXT    NOT NULL PRIMARY KEY CHECK (length(id) BETWEEN 1 AND 16 AND id NOT GLOB '*[^0-9A-Za-z_-]*'),
  visible INTEGER NOT NULL CHECK (visible IN (0, 1)),
  por     TEXT    NOT NULL CHECK (length(por) BETWEEN 1 AND 254 AND por = lower(por)),
  en      INTEGER NOT NULL
);

CREATE TABLE foto_estado (
  prenda  TEXT    NOT NULL CHECK (length(prenda) BETWEEN 1 AND 16 AND prenda NOT GLOB '*[^0-9A-Za-z_-]*'),
  n       INTEGER NOT NULL CHECK (n BETWEEN 1 AND 99),
  visible INTEGER NOT NULL CHECK (visible IN (0, 1)),
  por     TEXT    NOT NULL CHECK (length(por) BETWEEN 1 AND 254 AND por = lower(por)),
  en      INTEGER NOT NULL,
  PRIMARY KEY (prenda, n)
);

-- Solo se añade: el panel no edita ni borra filas.
CREATE TABLE registro (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  en      INTEGER NOT NULL,
  por     TEXT    NOT NULL CHECK (length(por) BETWEEN 1 AND 254 AND por = lower(por)),
  objeto  TEXT    NOT NULL CHECK (objeto IN ('prenda', 'foto')),
  prenda  TEXT    NOT NULL CHECK (length(prenda) BETWEEN 1 AND 16 AND prenda NOT GLOB '*[^0-9A-Za-z_-]*'),
  foto    INTEGER CHECK (foto BETWEEN 1 AND 99),
  visible INTEGER NOT NULL CHECK (visible IN (0, 1)),
  CHECK ((objeto = 'foto') = (foto IS NOT NULL))   -- `foto` solo si objeto = 'foto'
);
CREATE INDEX registro_por_en ON registro (por, en);

-- Una única fila; cada cambio de estado incrementa `version` en la misma transacción.
CREATE TABLE meta (
  id      INTEGER NOT NULL PRIMARY KEY CHECK (id = 1),
  version INTEGER NOT NULL
);
INSERT INTO meta (id, version) VALUES (1, 0);
