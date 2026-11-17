# Implementation Plan: Panel de administración online

**Branch**: `015-panel-admin-online` | **Date**: 2026-11-17 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/015-panel-admin-online/spec.md`

**Responsables**: `@Agent-Architect` (estructura, contratos), `@Agent-SecOps` (identidad, entradas, secretos), `@Agent-Performance` (cuota y LCP), `@Agent-UI-UX` (panel), `@Agent-SEO` (noindex).

## Summary

La titular gestiona qué prendas y fotos se ven desde un panel móvil protegido por **Cloudflare Access**. Un **Worker** (JS plano, sin dependencias) comprueba la identidad en cada operación, guarda el estado en **D1** (con registro de quién y cuándo) y actúa de puerta de las imágenes, que viven en un bucket **R2 privado**. La web pública sigue siendo HTML/CSS/JS estático: solo cambia que la lista de prendas visibles llega de `/api/prendas.js` (dinámico) y las fotos de `/f/…`, comprobadas contra el estado. Ocultar es *fail closed*. Detalle y alternativas descartadas en [research.md](research.md).

## Technical Context

**Language/Version**: JavaScript ES2020+ (módulos ES en el Worker, scripts clásicos en la web y el panel); Node ≥ 18.17 solo para herramientas.

**Primary Dependencies**: `wrangler` (nueva `devDependency`, ≥ 4.36, solo herramienta de despliegue y pruebas locales); `sharp` (ya existe). Cero dependencias de ejecución: el JWT se valida con Web Crypto.

**Storage**: Cloudflare D1 (estado y registro), Cloudflare R2 privado (imágenes optimizadas), galería de prendas empaquetada en el Worker (`worker/src/galeria.generated.js`, generada por `publicar`).

**Testing**: `node --test` (nuevo `npm test`) sobre funciones puras del Worker; `npm run verificar` ampliado; integración manual con `wrangler dev` (D1/R2 locales) según [quickstart.md](quickstart.md).

**Target Platform**: Cloudflare Workers (plan gratuito) con recursos estáticos; navegadores actuales (Chrome, Edge, Firefox, Safari/iOS).

**Project Type**: web estática + Worker + panel interno.

**Performance Goals**: Lighthouse móvil ≥ 95 en la web pública (LCP = portada estática, sin cambios); < 1 MB en la primera pantalla; `/api/prendas.js` < 10 KB y < 100 ms en el borde; propagación de un cambio ≤ ~40 s (10 s caché del estado + 30 s caché de imágenes); panel utilizable de 360 a 1920 px.

**Constraints**: plan gratuito de Workers (100.000 peticiones/día, 10 ms de CPU) → solo `/api/*`, `/f/*` y `/panel*` pasan por el Worker; D1 gratis 5 M filas leídas/día; fail-closed; la web pública sin terceros ni cookies; panel noindex; sin datos reales ni identificadores de cuenta en el repositorio.

**Scale/Scope**: ~26 prendas, ~75 fotos (~540 archivos, ~16 MB); < 10 personas con acceso; tráfico público bajo (< ~4.000 visitas/día dentro de la cuota gratuita).

## Constitution Check

*GATE: antes de la investigación y revisado tras el diseño.* Constitución v1.3.0.

| Principio | Estado | Nota |
|---|---|---|
| I. Solo fotos y teléfono | ✅ | La web pública no cambia de contenido. Los archivos del panel que se publican respetan la lista de palabras prohibidas (se verifican con `verificar`): el texto del panel usa «prenda», «foto», «visible», «oculta». |
| II. Las fotos protagonistas | ✅ | El panel reutiliza los tokens de `styles.css` (oscuro y dorado), WCAG AA, 44 px táctiles, `prefers-reduced-motion`. |
| III. Rendimiento | ✅ con vigilancia | Solo `defer` de un script dinámico; la LCP no cambia. Se quita `immutable` de las fotos de prendas (ver research D4). Medir Lighthouse antes de cerrar. |
| IV. Seguridad y privacidad | ⚠️ **requiere enmienda** | Hoy dice que `admin.*` y las herramientas nunca se publican y que las fotos no son accesibles salvo vía `dist/`. Se enmienda (ver [contracts/enmienda-constitucion.md](contracts/enmienda-constitucion.md)): el panel online se sirve solo tras Access + JWT validado en servidor; las fotos de prendas solo salen del Worker. El resto (CSP, cabeceras, sin terceros para visitantes) se mantiene. |
| V. SEO neutro | ✅ | JSON-LD, sitemap y metadatos no cambian. Panel con `noindex`, sin enlaces ni entrada en el sitemap. |
| VI. Simplicidad | ⚠️ **requiere enmienda** | Se añade una parte con servidor (el Worker). La web y el panel siguen sin framework ni build; el Worker es JS plano que Wrangler empaqueta. Archivos ≤ 200 líneas, funciones de una responsabilidad. |

**Puertas de calidad previstas**: `npm run verificar` (ampliado), `npm test` (nueva), `npm run publicar`.

**Resultado**: pasa **condicionado** a aprobar la enmienda (primera tarea de `/speckit-tasks`, vía `/speckit-constitution`). Sin enmienda no se implementa. Los dos avisos están justificados en *Complexity Tracking*.

**Re-evaluación tras el diseño**: sin nuevas violaciones; el diseño reduce el alcance de la enmienda al mínimo (un Worker, sin framework, sin librerías de ejecución, secretos fuera del repo).

## Project Structure

### Documentation (this feature)

```text
specs/015-panel-admin-online/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── api-publica.md
│   ├── api-admin.md
│   ├── panel-ui.md
│   ├── despliegue.md
│   └── enmienda-constitucion.md
├── checklists/requirements.md
└── tasks.md              # lo genera /speckit-tasks
```

### Source Code (repository root)

```text
worker/
├── src/
│   ├── index.js              # enrutado y orden de comprobaciones (≤ 120 líneas)
│   ├── acceso.js             # validación del JWT de Access (Web Crypto)
│   ├── estado.js             # lectura/escritura en D1 + caché de 10 s + versión
│   ├── visibilidad.js        # función pura: prenda × foto → visible (sin E/S)
│   ├── api-publica.js        # GET /api/prendas.js
│   ├── imagenes.js           # GET /f/<id>/<n>-<ancho>.<ext> y miniaturas del panel
│   ├── api-admin.js          # /api/admin/*
│   ├── seguridad.js          # cabeceras, CSRF (Origin), validación de entradas, límite de frecuencia
│   └── galeria.generated.js  # GENERADO por `npm run publicar` (prendas y fotos subidas)
├── migraciones/0001_estado.sql
└── test/                     # node --test (acceso, visibilidad, seguridad, api-publica, rutas)

panel/                         # estáticos del panel online (se copian a dist/panel/)
├── index.html
├── panel.css
└── panel.js                   # ≤ 200 líneas (si crece: panel-lista.js, panel-api.js)

scripts/
├── publicar.js                # MODIFICADO: dist sin imágenes de prendas ni PRENDAS; genera galeria.generated.js; copia panel/; comprueba wrangler.jsonc
├── subir-imagenes.js          # NUEVO: sube a R2 lo que cambió (manifiesto de huellas)
├── verificar.js               # MODIFICADO: admite api/prendas.js virtual; comprueba panel/ y que dist no filtra prendas
└── servidor.js                # MODIFICADO: sirve /api/prendas.js local (= data/fotos-optimizadas.js)

wrangler.ejemplo.jsonc         # NUEVO (con marcadores); wrangler.jsonc real va a .gitignore
index.html                     # MODIFICADO: una etiqueta <script> (api/prendas.js en lugar de data/fotos-optimizadas.js)
lib.js                         # MODIFICADO: getFotos usa FOTOS_OPT.base y el nº original de foto
PUBLICAR.bat · COMO-ACTUALIZAR-FOTOS.md · package.json · .gitignore   # MODIFICADOS
```

**Structure Decision**: carpeta `worker/` separada de la web para que lo que sirve el Worker no se confunda con lo estático; `panel/` junto a la web porque es HTML/CSS/JS clásico y se publica como recurso estático detrás del Worker. El panel local (`admin.*`) no se toca.

### Orden de comprobaciones en el Worker (para cada petición que llega)

1. Ruta no gestionada → `env.ASSETS.fetch` (no debería ocurrir con `run_worker_first` acotado).
2. `/panel*` y `/api/admin/*` → **primero** JWT válido (403 si no) → después CSRF y límite de frecuencia en operaciones que cambian estado → lógica.
3. `/f/*` → validar la forma de la ruta → `visibilidad` → R2; cualquier fallo → 404 uniforme.
4. `/api/prendas.js` → estado (fail-closed) → script.
5. Toda respuesta del Worker lleva las cabeceras de seguridad del proyecto.

### Dependencia con la otra sesión (portada nueva)

Otra sesión trabaja en la carpeta principal, en la rama `016-galeria-agrupada-logo`: portada nueva y fotos optimizadas (`public/img/slac/`, `scripts/optimizar-fotos-slac.js`) y cambios sin commitear en `app.js`, `index.html`, `styles.css`, `scripts/publicar.js` y `package.json`. Mis cambios tocan `index.html`, `lib.js`, `scripts/publicar.js` y `package.json`, y la «galería agrupada» puede cambiar cómo se pintan las prendas (`PRENDAS`, `getFotos`, la estructura de la galería) y la forma de los datos de la galería.

**No se empieza a implementar hasta que la 016 fusione en `main`.** Entonces: traer `main` a `015-panel-admin-online`, releer `data/galeria.js`, `lib.js`, `app.js` y `publicar.js`, y **revisar este plan** (sobre todo D5 y `data-model.md`, que dependen de la forma de `PRENDAS`/`FOTOS_OPT`) antes de generar `tasks.md`. Si la 016 introduce grupos de prendas, el estado online seguirá siendo por prenda y por foto y el grupo será solo presentación.

### Reversibilidad

Nada de lo público depende de la funcionalidad hasta el despliegue. Para volver al sistema local: no fusionar la rama; o, ya fusionada, `git revert` de la fusión y `wrangler deploy --assets dist` (la configuración antigua) y borrar `D1`/`R2` desde Cloudflare. Procedimiento completo en [contracts/despliegue.md](contracts/despliegue.md).

## Complexity Tracking

| Violación | Por qué es necesaria | Alternativa más simple descartada |
|---|---|---|
| Un Worker con servidor (principio VI) | El estado cambia sin volver a publicar y las fotos ocultas no se pueden entregar | Panel local + `PUBLICAR.bat` (se conserva como respaldo, pero no sirve desde el móvil) |
| El panel se publica (principio IV) | La titular lo quiere usar desde el móvil | Panel solo local — es justo lo que se pidió superar |
| Tres recursos de Cloudflare (Worker, D1, R2) y `wrangler` como `devDependency` | Consistencia del estado (D1), fotos privadas (R2), despliegue reproducible | KV (no cumple < 1 min), bucket público (la foto sería accesible por enlace) |
| Excepción explícita de la portada (copia estática) | La LCP exige portada estática | Servir la portada por el Worker (cuenta cuota y empeora LCP) |
