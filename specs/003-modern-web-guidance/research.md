# Research: Modern Web Guidance en el flujo de desarrollo

Fuente: README original de `GoogleChrome/modern-web-guidance` (leído el 2026-11-16) y pruebas
del CLI 1.0.1 en esta máquina.

## D1. Cómo se usa la herramienta

- **Decisión:** los agentes llaman al CLI con `npx modern-web-guidance@latest <comando>`:
  `search "<consulta en inglés>"` → `retrieve <id>[,<id>]` → `legacy-scan [ruta] --json`.
- **Verificado:** `search "animate a dialog modal backdrop"` devuelve 10 guías con `id` y
  descripción (p. ej. `animate-to-from-top-layer`, `dialog`, `light-dismiss-a-dialog`).
  `legacy-scan` analiza 38 guías con reglas deterministas (~20 % del corpus) y devuelve
  hallazgos con archivo y línea. La búsqueda es local y sin red; `npx` solo descarga el paquete.
- **Alternativas:** instalar el CLI como devDependency (rechazada: añade una dependencia y se
  queda obsoleta; `npx @latest` evita que el contenido caduque, según el README); instalar con el
  asistente `install` (rechazada: interactivo y a nivel de usuario).

## D2. Disponibilidad para colaboradores sin tocar otras sesiones

- **Decisión:** `.claude/settings.json` versionado con `extraKnownMarketplaces` (`googlechrome` →
  repo `GoogleChrome/modern-web-guidance`) y `enabledPlugins` (`modern-web-guidance@googlechrome`).
  No se ejecuta `/plugin` ni `/reload-plugins` en esta sesión.
- **Motivo:** una instalación a nivel de usuario y la recarga de plugins afectan a todas las
  sesiones abiertas. La configuración del proyecto solo se aplica al abrir o reiniciar una sesión
  en esa carpeta; la sesión de la rama 002 no cambia hasta que ella decida reiniciarse.
- **Detalle del README:** el plugin publicado en `claude-plugins-official` quedó parado en
  v0.0.194; hay que usar el marketplace `googlechrome` y activar la actualización automática.
- **Alternativas:** `npx modern-web-guidance@latest install` (interactivo, a nivel de usuario);
  `npx skills add ...` (copia archivos al proyecto sin actualización).
- **Riesgo asumido:** el formato exacto de `extraKnownMarketplaces`/`enabledPlugins` no se puede
  comprobar sin abrir una sesión nueva; si no se aplica, el CLI por `npx` sigue funcionando y la
  regla de `AGENTS.md` no depende del plugin.

## D3. Telemetría y privacidad

- **Hecho (README):** Google recoge nº de instalaciones, nombre del agente, ids de guías
  consultadas y **consultas de búsqueda** generadas por el agente; no los prompts del usuario.
- **Decisión:** `"env": { "DISABLE_TELEMETRY": "1" }` en `.claude/settings.json` (lo recomendado
  por el README) y regla de consultas genéricas en inglés: solo la función de plataforma
  ("animate a dialog modal backdrop"), nunca nombres del proyecto, teléfonos, rutas ni datos.
- **Nota:** `DISABLE_TELEMETRY` también lo reconoce Claude Code (desactiva su telemetría): efecto
  colateral aceptable y alineado con el principio IV.
- **Alternativa:** exportarla en el perfil del shell (rechazada: no se comparte con el equipo).

## D4. Funciones experimentales

- **Decisión:** no crear `.mwgrc`. Por defecto las guías de Origin Trials y de funciones volátiles
  (un solo motor, < 3 meses) se descubren con `search` pero `retrieve` las bloquea.
- **Motivo:** la constitución fija como navegadores objetivo Chrome, Edge, Firefox y Safari.

## D5. Dónde entra en el ciclo

| Fase | Quién | Qué |
|---|---|---|
| `/speckit-plan` | `@Agent-Architect`, `@Agent-UI-UX` | Por cada función de plataforma del plan: `search` + `retrieve`; guías aplicadas (id) en `research.md`; si no hay guía, se anota. |
| `/speckit-implement` | `@Agent-UI-UX`, `@Agent-Architect` | Antes de escribir HTML/CSS/JS de plataforma, consultar; seguir el patrón dentro de la constitución. |
| `/speckit-checklist rendimiento` | `@Agent-Performance` | `legacy-scan . --json`; resultado resumido en `checklists/` (se ignoran `_backup-original/` y `specs/`); cada hallazgo se corrige o se justifica. |
| `/speckit-converge` | `@Agent-Architect` | Los hallazgos sin resolver se añaden como tareas. |

Conflictos con la constitución (terceros, build, experimentales): prevalece la constitución.
La falta de guía o de red nunca bloquea una tarea.

## D6. Constitución

- **Decisión:** enmienda MINOR 1.0.0 → 1.1.0 con `/speckit-constitution`: nueva regla en "Flujo de
  trabajo y puertas de calidad" (consulta de la guía; orientativa; los principios prevalecen).
  No se añade como puerta de fusión bloqueante: el escaneo es provisional (el propio CLI lo avisa).

## D7. Línea base de `legacy-scan` (solo registro; NO se corrige en esta funcionalidad, FR-011)

Ejecutado sobre el árbol de `main` el 2026-11-16: 8 hallazgos en 4 guías.

| Guía | Hallazgo | Ubicación | Valoración |
|---|---|---|---|
| `dialog` | cierre al pulsar fuera con listener manual → `<dialog closedby="any">` | `visor.js:99` | Candidato real; comprobar soporte en Safari antes. |
| `js/replace-children-innerhtml` | `innerHTML = ''` → `replaceChildren()` | `visor.js:75`, `_backup-original/app.js:280` | Candidato real. |
| `js/structured-clone` | `JSON.parse(JSON.stringify(x))` → `structuredClone` | `admin.js:9-10`, `_backup-original/app.js:9` | Candidato (panel local). |
| `animate-to-intrinsic-sizes` | `max-height` animado | `_backup-original/styles.css:391` | Ruido: copia de seguridad. |
| `secure-external-subresources` | script de CDN sin SRI | `_backup-original/index.html:19` | Ruido: copia de seguridad. |

Los hallazgos de `_backup-original/` son ruido (código antiguo sin publicar). Los reales
(`visor.js`, `admin.js`) pasarán por su propio ciclo en una funcionalidad futura.
