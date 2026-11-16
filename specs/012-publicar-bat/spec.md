# Especificación: PUBLICAR.bat y guía de actualización

**Rama**: `012-publicar-bat` · **Estado**: implementada

## Qué y por qué
Que otra persona pueda mostrar u ocultar prendas y publicar sin conocimientos técnicos: panel local + un doble clic.

## Requisitos
- **FR-001**: `PUBLICAR.bat` optimiza, ejecuta `npm run publicar`, pide confirmar con SI y despliega `dist/` con `wrangler deploy --assets dist` (inicia sesión en Cloudflare si hace falta). Si un paso falla, no publica.
- **FR-002**: `npm run publicar` se niega a generar `dist/` si `data/galeria.js` o `aviso-legal.html` llevan marcadores (`000 000 000`, `[INSTAGRAM]`, `[CORREO]`, `[DOMICILIO]`): evita publicar datos de ejemplo desde un clon.
- **FR-003**: `COMO-ACTUALIZAR-FOTOS.md` explica mostrar/ocultar y publicar, sin datos personales.

## Criterios de éxito
- Con marcadores, `publicar` termina con código 1 y mensaje claro; con datos reales, genera `dist/`.
