#!/usr/bin/env node
/* ============================================================
   optimizar-fotos-slac.js — SLAC
   Lee fotos-slac/portada.jpeg (original, no se toca) y genera (las demás fotos van por preparar:slac + optimizar) en public/img/slac/:
     · fondo-escritorio-<ancho>.avif|webp  (portada.jpeg, apaisada)
     · fondo-movil-<ancho>.avif|webp       (recorte vertical centrado en la modelo)
   Uso: npm run optimizar:slac
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ORIGEN = path.join(__dirname, '..', 'fotos-slac');
const SALIDA = path.join(__dirname, '..', 'public', 'img', 'slac');
const WEBP = { quality: 76, effort: 6, smartSubsample: true };
const AVIF = { quality: 50, effort: 4 };

async function guardar(img, base, ancho) {
  const r = img.clone().resize({ width: ancho, withoutEnlargement: true });
  await r.clone().webp(WEBP).toFile(`${base}-${ancho}.webp`);
  await r.clone().avif(AVIF).toFile(`${base}-${ancho}.avif`);
}

(async () => {
  fs.mkdirSync(SALIDA, { recursive: true });
  const portada = path.join(ORIGEN, 'portada.jpeg');
  const { width: W, height: H } = await sharp(portada).metadata();

  for (const w of [1200, W]) await guardar(sharp(portada), path.join(SALIDA, 'fondo-escritorio'), w);

  // Móvil 9:16 centrado en la modelo (≈ 41 % del ancho)
  const ancho = Math.round(H * 9 / 16);
  const left = Math.min(W - ancho, Math.max(0, Math.round(W * 0.41 - ancho / 2)));
  const movil = await sharp(portada).extract({ left, top: 0, width: ancho, height: H }).toBuffer();
  for (const w of [360, 529]) await guardar(sharp(movil), path.join(SALIDA, 'fondo-movil'), w);

  const total = fs.readdirSync(SALIDA).reduce((s, f) => s + fs.statSync(path.join(SALIDA, f)).size, 0);
  console.log(`✓ ${fs.readdirSync(SALIDA).length} archivos en public/img/slac (${(total / 1024).toFixed(0)} KB)`);
})();
