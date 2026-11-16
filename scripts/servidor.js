#!/usr/bin/env node
/* ============================================================
   servidor.js — Servidor local de desarrollo para SLAC
   ------------------------------------------------------------
   · Sin dependencias (solo Node.js).
   · Recarga el navegador automáticamente al guardar cualquier archivo.
   · Uso:
       npm run dev                       → http://localhost:3000
       node scripts/servidor.js --red    → también accesible desde el móvil
                                           (misma wifi) — se muestra la URL
       PORT=4000 node scripts/servidor.js
   ============================================================ */

'use strict';

const http = require('http');
const fs   = require('fs');
const path = require('path');
const os   = require('os');
const { exec } = require('child_process');

const RAIZ          = path.resolve(__dirname, '..');
const PUERTO_BASE   = Number(process.env.PORT) || 3000;
const EN_RED        = process.argv.includes('--red');
const SIN_NAVEGADOR = process.argv.includes('--sin-navegador');

const MIME = {
  '.html': 'text/html; charset=utf-8',  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',  '.xml': 'application/xml; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',   '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.avif': 'image/avif', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff'
};

// Carpetas/archivos de desarrollo que nunca se sirven (como en producción)
const BLOQUEADAS = new Set(['node_modules', '.git', '.specify', '.claude', 'specs', 'scripts', '_backup-original', 'package.json', 'package-lock.json']);

// Recarga en vivo: script externo (la CSP de las páginas prohíbe los <script> en línea)
const LIVE = '<script src="/__recargar.js" defer></script>';
const LIVE_JS = "(function(){try{var e=new EventSource('/__recargar');e.onmessage=function(){location.reload()};}catch(_){}})();\n";
const clientes = new Set();

function responder(res, codigo, texto) {
  res.writeHead(codigo, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(texto);
}

const servidor = http.createServer((req, res) => {
  let url;
  try { url = decodeURIComponent(req.url.split('?')[0]); }
  catch { return responder(res, 400, 'Petición no válida'); }

  // Canal de recarga automática (Server-Sent Events)
  if (url === '/__recargar') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    res.write('retry: 1000\n\n');
    clientes.add(res);
    req.on('close', () => clientes.delete(res));
    return;
  }

  if (url === '/__recargar.js') {
    res.writeHead(200, { 'Content-Type': MIME['.js'], 'Cache-Control': 'no-store' });
    return res.end(LIVE_JS);
  }

  const partes = url.split('/').filter(Boolean);
  if (partes.some(p => p === '..' || p.includes('\0'))) return responder(res, 403, 'Prohibido');
  if (partes[0] && BLOQUEADAS.has(partes[0])) return responder(res, 404, 'No encontrado');

  let ruta = path.join(RAIZ, ...partes);
  if (ruta !== RAIZ && !ruta.startsWith(RAIZ + path.sep)) return responder(res, 403, 'Prohibido');

  fs.stat(ruta, (err, st) => {
    if (!err && st.isDirectory()) ruta = path.join(ruta, 'index.html');
    fs.readFile(ruta, (err2, datos) => {
      if (err2) return responder(res, 404, `404 — No encontrado: ${url}`);
      const ext = path.extname(ruta).toLowerCase();
      if (ext === '.html') {
        const html = datos.toString('utf8');
        datos = Buffer.from(html.includes('</body>') ? html.replace('</body>', () => LIVE + '</body>') : html + LIVE);
      }
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(datos);
    });
  });
});

/* Recarga al guardar cambios (ignora lo que genera el optimizador en public/img) */
let temporizador;
try {
  fs.watch(RAIZ, { recursive: true }, (_evento, nombre) => {
    if (!nombre) return;
    const n = String(nombre).replace(/\\/g, '/');
    if (/^(node_modules|\.git|\.specify|\.claude|specs|_backup-original|public\/img)(\/|$)/.test(n)) return;
    clearTimeout(temporizador);
    temporizador = setTimeout(() => clientes.forEach(c => c.write('data: recargar\n\n')), 150);
  });
} catch {
  console.log('  (Aviso: recarga automática no disponible en este sistema; recarga con F5)');
}

function urlsRed(puerto) {
  return Object.values(os.networkInterfaces()).flat()
    .filter(i => i && i.family === 'IPv4' && !i.internal)
    .map(i => `http://${i.address}:${puerto}`);
}

function abrirNavegador(url) {
  const cmd = process.platform === 'win32' ? `start "" "${url}"`
            : process.platform === 'darwin' ? `open "${url}"` : `xdg-open "${url}"`;
  exec(cmd, () => {});
}

function escuchar(puerto, intentosRestantes) {
  servidor.once('error', err => {
    if (err.code === 'EADDRINUSE' && intentosRestantes > 0) {
      console.log(`  El puerto ${puerto} está ocupado, probando ${puerto + 1}...`);
      escuchar(puerto + 1, intentosRestantes - 1);
    } else {
      console.error('\n✗ No se pudo iniciar el servidor:', err.message);
      process.exit(1);
    }
  });
  servidor.listen(puerto, EN_RED ? '0.0.0.0' : '127.0.0.1', () => {
    const url = `http://localhost:${puerto}`;
    console.log('\n  SLAC — servidor local en marcha');
    console.log('  ────────────────────────────────────────');
    console.log(`  Web         ${url}`);
    console.log(`  Panel admin ${url}/admin.html`);
    console.log(`  Revisión    ${url}/revision-por-modelo.html`);
    if (EN_RED) urlsRed(puerto).forEach(u => console.log(`  En el móvil ${u}   (misma wifi)`));
    console.log('\n  La página se recarga sola al guardar cambios.');
    console.log('  Para parar el servidor: Ctrl + C\n');
    if (!SIN_NAVEGADOR) abrirNavegador(url);
  });
}

escuchar(PUERTO_BASE, 10);
