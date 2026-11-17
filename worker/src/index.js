// Punto de entrada del Worker de SLAC (015). La lógica está en enrutador.js y los módulos que enruta.
// `galeria.generated.js` lo crea `npm run publicar` desde data/galeria.js (no se edita a mano).

import { GALERIA } from './galeria.generated.js';
import { crearEnrutador } from './enrutador.js';

const atender = crearEnrutador({ galeria: GALERIA });

export default {
  fetch: (peticion, env) => atender(peticion, env)
};
