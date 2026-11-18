#!/usr/bin/env node
/* ============================================================
   preparar-fotos-slac.js — SLAC
   Separa las fotos de fotos-slac/ (collages y parejas) en fotos
   individuales dentro de public/fotos/slac-<grupo>-<n>.jpeg, que son
   los "originales" que luego lee `npm run optimizar`.
     · borra la palabra BOUTIQUE y el adorno de body-11..14 (queda "SLAC")
   Los archivos de fotos-slac/ no se modifican.
   Uso: npm run preparar:slac
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ORIGEN = path.join(__dirname, '..', 'fotos-slac');
const SALIDA = path.join(__dirname, '..', 'public', 'fotos');
const MARGEN = 2;   // píxeles que se recortan junto a cada costura

/** Cortes de cada foto: [izq, arriba, ancho, alto]. Las costuras se midieron en los originales. */
const LISTA = [
  { grupo: '027', fuente: 'body-1', cortes: [[0, 0, 442, 752], [443, 0, 457, 752], [0, 753, 442, 847], [443, 753, 457, 847]] },
  { grupo: '028', fuente: 'body-2' },
  { grupo: '029', fuente: 'body-3' },
  { grupo: '030', fuente: 'body-4' },
  { grupo: '031', fuente: 'body-5', mitades: 450 },
  { grupo: '032', fuente: 'body-6', mitades: 450 },
  { grupo: '033', fuente: 'body-7', mitades: [456, 458] },
  { grupo: '034', fuente: 'body-8', mitades: 450 },
  { grupo: '035', fuente: 'body-9', mitades: 563 },
  { grupo: '036', fuente: 'body-10' },
  ...[11, 12, 13, 14].map((n, i) => ({ grupo: '037', fuente: `body-${n}`, orden: i + 1, borrar: true }))
];

/** Filas (y) donde hay letras doradas en la franja del rótulo: devuelve [inicioBoutique, finAdorno]. */
async function filasDelRotulo(buffer, x0, ancho) {
  const { data, info } = await sharp(buffer).extract({ left: x0, top: 0, width: ancho, height: 400 }).raw().toBuffer({ resolveWithObject: true });
  const dorado = y => {
    let n = 0;
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * info.channels;
      if (data[i] > 110 && data[i] > data[i + 2] * 1.6) n++;
    }
    return n > 2;
  };
  let y = 40;
  while (y < 400 && !dorado(y)) y++;            // empieza "SLAC"
  while (y < 400 && dorado(y)) y++;             // termina "SLAC"
  const inicio = y;
  while (y < 400 && !dorado(y)) y++;            // hueco hasta BOUTIQUE
  let fin = y;
  for (let k = y; k < 400; k++) if (dorado(k)) fin = k;
  return [inicio, fin];
}

/** Cubre "BOUTIQUE" y el corazón con un trozo de pared lisa tomado justo debajo, con borde difuminado. */
async function quitarBoutique(buffer, ancho) {
  const left = 660, w = 300;
  if (left + w > ancho) throw new Error('la foto es más estrecha de lo esperado');
  const [ini, fin] = await filasDelRotulo(buffer, left, w);
  const top = ini + 2, h = fin - ini + 18;
  const parche = await sharp(buffer).extract({ left: left + 25, top: top + h + 6, width: w, height: h }).toBuffer();
  const mascara = await sharp(Buffer.from(
    `<svg width="${w}" height="${h}"><rect x="12" y="0" width="${w - 24}" height="${h - 12}" fill="#fff"/></svg>`))
    .blur(5).png().toBuffer();
  const conAlfa = await sharp(parche).ensureAlpha().composite([{ input: mascara, blend: 'dest-in' }]).png().toBuffer();
  return sharp(buffer).composite([{ input: conAlfa, left, top }]).toBuffer();
}

(async () => {
  const contador = {};
  const guardar = async (buf, grupo) => {
    contador[grupo] = (contador[grupo] || 0) + 1;
    const destino = path.join(SALIDA, `slac-${grupo}-${contador[grupo]}.jpeg`);
    await sharp(buf).jpeg({ quality: 92, mozjpeg: true }).toFile(destino);
  };

  for (const e of LISTA) {
    const origen = path.join(ORIGEN, `${e.fuente}.jpeg`);
    const { width: W, height: H } = await sharp(origen).metadata();
    let base = await sharp(origen).toBuffer();
    if (e.borrar) base = await quitarBoutique(base, W);
    const recortar = (l, t, w, h) => sharp(base).extract({ left: l, top: t, width: w, height: h }).toBuffer();

    if (e.cortes) {
      for (const [l, t, w, h] of e.cortes) await guardar(await recortar(l, t, w, h), e.grupo);
    } else if (e.mitades) {
      const [fin, ini] = Array.isArray(e.mitades) ? e.mitades : [e.mitades - MARGEN, e.mitades + MARGEN];
      await guardar(await recortar(0, 0, fin, H), e.grupo);
      await guardar(await recortar(ini, 0, W - ini, H), e.grupo);
    } else {
      await guardar(base, e.grupo);
    }
  }
  console.log('✓ Fotos individuales en public/fotos (slac-027 a slac-037):', Object.entries(contador).map(([g, n]) => `${g}:${n}`).join(' '));
})();
