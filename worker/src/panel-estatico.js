// GET /panel, /panel/ y los css/js de `panel/` que enumera ARCHIVOS (viven en dist/panel/),
// servidos por env.ASSETS SOLO después de que el enrutador haya validado la identificación.
// Cualquier otra ruta bajo /panel responde 404 (contracts/api-admin.md).

const ARCHIVOS = new Set(['/panel/panel.css', '/panel/panel.js', '/panel/panel-api.js', '/panel/panel-lista.js', '/panel/panel-registro.js']);

export async function manejarPanel({ peticion, env, ruta }) {
  const pagina = ruta === '/panel' || ruta === '/panel/';
  if (!pagina && !ARCHIVOS.has(ruta)) return new Response(null, { status: 404 });
  const destino = new URL(pagina ? '/panel/' : ruta, peticion.url);
  return env.ASSETS.fetch(new Request(destino, { method: peticion.method, headers: peticion.headers }));
}
