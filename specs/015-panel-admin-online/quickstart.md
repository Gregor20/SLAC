# Quickstart: validar el panel online (015)

Guía de validación de extremo a extremo; no contiene código de la implementación. Contratos: [api-publica](contracts/api-publica.md), [api-admin](contracts/api-admin.md), [panel-ui](contracts/panel-ui.md), [despliegue](contracts/despliegue.md). Modelo: [data-model.md](data-model.md).

## 0. Requisitos
- Node ≥ 18.17, `npm install` hecho (incluye `wrangler`).
- Rama `015-panel-admin-online` con `main` al día (tras fusionar la 016).
- Para la parte en producción: cuenta de Cloudflare, dominio en la cuenta y configuración única de [despliegue](contracts/despliegue.md).

## 1. Pruebas automáticas
`npm test` → todo en verde (JWT, visibilidad, entradas, `/api/prendas.js`, rutas).
`npm run verificar` → todo correcto (incluye: `panel/` sin palabras prohibidas ni código en línea; `dist/` sin `public/img/<id>/` ni `PRENDAS` con datos).

## 2. En local con `wrangler dev` (D1 y R2 locales, sin Access)
Preparación (una vez por máquina): crear `.dev.vars` con `ACCESS_DEV_EMAIL=prueba@local` (el archivo está en `.gitignore`), `npm run publicar`, aplicar la migración con `--local` y subir imágenes con `--local`.

| # | Acción | Resultado esperado |
|---|---|---|
| 1 | Abrir `/` | Galería vacía (todas las prendas nuevas están ocultas); portada y teléfono visibles |
| 2 | Abrir `/panel/` | Lista de prendas, todas «Oculta» |
| 3 | Activar la prenda 001 | «Guardado»; `/api/prendas.js` la incluye; tras ≤ 40 s aparece en `/` |
| 4 | Desactivar solo la foto 2 de la 001 | La foto desaparece del visor y de la galería; `/f/001/2-800.webp` → 404; `/f/001/1-800.webp` → 200 |
| 5 | Desactivar la 001 y reactivarla | La foto 2 sigue oculta; las demás reaparecen |
| 6 | Abrir a mano `/f/001/1-800.webp` con la 001 oculta | 404 sin cuerpo (igual que `/f/999/1-800.webp`) |
| 7 | Detener D1 (simular error) | La web no muestra nada oculto; `/api/prendas.js` responde 200 con lista vacía tras 60 s |
| 8 | `PUT` sin `Origin` o con otro `Origin` (curl) | 403, sin cambios |
| 9 | Quitar `ACCESS_DEV_EMAIL` y abrir `/panel/` | 403 |

## 3. En producción (una vez desplegado)
| # | Acción | Resultado esperado |
|---|---|---|
| 1 | Móvil, ventana privada, `https://slac-official.com/panel/` | Pantalla de acceso de Cloudflare; con correo no autorizado: denegado |
| 2 | Entrar con correo autorizado | Panel con las prendas; el registro muestra el correo |
| 3 | Activar una prenda; en otro dispositivo, recargar `/` | Aparece en menos de 1 minuto (**SC-002**) |
| 4 | Guardar la URL directa de una imagen; ocultar la prenda; esperar 40 s y abrirla | 404 (**SC-003**) |
| 5 | `curl -I https://slac-official.com/api/admin/estado` sin sesión | Redirige a Access o 403; nunca datos |
| 6 | `curl` a `https://slac.<cuenta>.workers.dev/api/admin/estado` | No responde (con `workers_dev: false`); si respondiera, 403 por `Host` distinto de `HOST_PERMITIDO` |
| 7 | Añadir un segundo correo a la política y entrar con él; luego quitarlo y «Revocar tokens» | Deja de poder entrar en < 5 min (**SC-005**) |
| 8 | Recorrer la web pública con DevTools | 0 peticiones a terceros, 0 cookies, sin enlaces ni texto del panel; `robots`/`sitemap` sin `/panel` |
| 9 | Lighthouse móvil en `/` | Rendimiento ≥ 95, LCP = portada, < 1 MB en la primera pantalla (**SC-006**) |
| 10 | Panel en 360, 768 y 1920 px; teclado y lector | Sin desplazamiento horizontal; todo operable; contraste AA (**SC-007**, **FR-014**) |
| 11 | Ocultar una prenda que sale en la portada | Pide confirmación; la portada sigue igual; las fotos salen de la galería |

## 4. Respaldo
Comprobar que `INICIAR.bat`, `OPTIMIZAR-IMAGENES.bat` y el panel local (`admin.html`) siguen funcionando igual y que `COMO-ACTUALIZAR-FOTOS.md` explica el nuevo flujo (prendas nuevas ocultas hasta activarlas).

## 5. Cierre
`/speckit-checklist seguridad`, `rendimiento` y `seo`; `legacy-scan`; `/speckit-converge` hasta `Converged`; actualizar `MEMORY.md` (ADR 015, mapa del código, auditoría) y la constitución (v1.5.1).
