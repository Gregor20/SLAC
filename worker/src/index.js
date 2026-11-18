// Punto de entrada del Worker de SLAC (015). La lógica está en enrutador.js y los módulos que enruta.
// `galeria.generated.js` lo crea `npm run publicar` desde data/galeria.js (no se edita a mano).

import { GALERIA } from './galeria.generated.js';
import { crearEnrutador } from './enrutador.js';
import { manejarAdmin } from './api-admin.js';
import { manejarPanel } from './panel-estatico.js';
import { manejarApiPublica } from './api-publica.js';
import { manejarImagen } from './imagenes.js';

const atender = crearEnrutador({
  galeria: GALERIA,
  manejadores: { admin: manejarAdmin, panel: manejarPanel, publica: manejarApiPublica, imagen: manejarImagen }
});

export default {
  fetch: (peticion, env) => atender(peticion, env)
};
