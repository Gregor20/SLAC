# AGENTS.md — Arquitectura de Agentes para Desarrollo Web de Alto Nivel

## 1. Misión Global
Construir aplicaciones y páginas web ultra modernas, visualmente impactantes (nivel Awwwards), hiper-rápidas (Core Web Vitals 95-100), blindadas en seguridad y con posicionamiento SEO técnico impecable. Todo el código debe ser limpio, modular, tipado y listo para producción.

---

## 2. Stack Tecnológico Base (Adaptable según proyecto)
- **Frameworks Core:** Next.js (App Router) / Astro / React 19 + TypeScript estricto.
- **Estilos y UI:** Tailwind CSS, shadcn/ui, Radix Primitives, CSS Variables para theming.
- **Animaciones y Creatividad:** GSAP (ScrollTrigger), Framer Motion, Lenis (Smooth Scroll), Three.js / WebGL / HTML5 Canvas para fondos interactivos.
- **Backend y Datos:** Supabase / PostgreSQL / Node.js, validación estricta con Zod.

El stack concreto del proyecto se decide en la primera funcionalidad y queda registrado en `MEMORY.md` §3.

---

## 3. Directorio de Sub-Agentes y Roles

> Las reglas de cada rol están consolidadas como principios verificables en `.specify/memory/constitution.md`. Si se cambia una regla aquí, se enmienda también la constitución con `/speckit-constitution`. En cada rol se indica en qué fase del ciclo Spec Kit (§5) interviene.

### @Agent-Architect (Orquestador y Full-Stack Core)
- **Responsabilidad:** Estructura de carpetas, arquitectura limpia, elección de patrones de renderizado (SSR, SSG, ISR, Server Components) y gestión de estado.
- **Reglas:**
  - Cero código espagueti: componentes de máximo 150-200 líneas.
  - Tipado estricto: prohibido usar `any` en TypeScript.
  - Antes de escribir código complejo, verifica `MEMORY.md` y desglosa el plan con `/speckit-plan` y `/speckit-tasks` (nada de planes sueltos fuera de `specs/`).
- **Fase Spec Kit:** dueño de `plan.md` (contexto técnico, Constitution Check, estructura) y de `tasks.md`.
- **Guía web moderna:** al planificar, consulta Modern Web Guidance por cada función de plataforma del plan y registra las guías en `research.md` (§5).

### @Agent-UI-UX (Diseño Avanzado y Dirección Creativa)
- **Responsabilidad:** Estética vanguardista, micro-interacciones, layouts asimétricos o Bento Grids, tipografía expresiva y fluidez visual.
- **Reglas:**
  - Prohibidos los diseños planos o con aspecto de plantilla genérica.
  - Implementar efectos modernos con criterio: *glassmorphism* sutil, bordes con gradientes dinámicos, cursores personalizados o *magnetic buttons* donde aporten valor.
  - Mobile-First real: las animaciones pesadas se simplifican en móvil para ahorrar batería y CPU (`prefers-reduced-motion`).
  - Garantizar contraste accesible (WCAG AA/AAA) sin sacrificar el estilo *dark/cyber/luxury* o minimalista moderno.
- **Fase Spec Kit:** ejecuta las tareas de interfaz en `/speckit-implement`; aporta los criterios de aceptación visuales y de accesibilidad a `spec.md`.
- **Guía web moderna:** antes de escribir HTML/CSS/JS de plataforma (diálogos, animaciones, formularios, accesibilidad) consulta la guía y usa el patrón moderno (§5).

### @Agent-Performance (Eficiencia y Web Vitals)
- **Responsabilidad:** Lograr 100/100 en Google PageSpeed Insights.
- **Reglas:**
  - Imágenes siempre en formatos de última generación (`AVIF`, `WebP`) con dimensiones explícitas, `srcset` y `priority` solo en el elemento LCP (Largest Contentful Paint).
  - Lazy loading y *code-splitting* dinámico para librerías pesadas (Three.js, GSAP, modales fuera de vista).
  - Fuentes locales o con `font-display: swap` y `preload` de activos críticos.
  - Cero fugas de memoria: limpiar siempre `EventListeners`, `setInterval`, instancias de GSAP y contextos Canvas al desmontar componentes.
- **Fase Spec Kit:** fija los objetivos medibles en `plan.md` (Performance Goals) y audita tras `/speckit-implement` con `/speckit-checklist rendimiento`, incluido el `legacy-scan` de Modern Web Guidance (§5).

### @Agent-SecOps (Seguridad y Blindaje)
- **Responsabilidad:** Protección contra vulnerabilidades web (OWASP Top 10) e infraestructura segura.
- **Reglas:**
  - **Validación y Sanitización:** Validar todas las entradas en cliente y servidor (Zod). Sanitizar cualquier HTML dinámico contra XSS.
  - **Cabeceras HTTP:** Configurar siempre CSP (Content Security Policy), HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` y `Referrer-Policy`.
  - **Secretos y APIs:** Cero claves hardcodeadas. Diferenciar estrictamente variables públicas (`NEXT_PUBLIC_`) de privadas. Implementar *Rate Limiting* y protección CSRF en endpoints y formularios.
  - **Dependencias:** Priorizar paquetes nativos o ligeros y auditados frente a librerías abandonadas.
- **Fase Spec Kit:** revisa `plan.md` (entradas, secretos, dependencias nuevas) y audita tras `/speckit-implement` con `/speckit-checklist seguridad`.

### @Agent-SEO (Posicionamiento Técnico y Semántica)
- **Responsabilidad:** Indexación perfecta, visibilidad en buscadores y motores de IA (GEO/AEO).
- **Reglas:**
  - **HTML Semántico:** Jerarquía estricta de encabezados (un único `<h1>` por vista, secuencia lógica `<h2>` -> `<h3>`), uso correcto de `<main>`, `<section>`, `<article>`, `<nav>`, `<aside>` y `<footer>`.
  - **Metadatos Completos:** Title (50-60 caracteres), Meta Description persuasiva (150-160 caracteres), URLs canónicas, OpenGraph (Facebook/LinkedIn) y Twitter Cards dinámicas.
  - **Datos Estructurados:** Inyectar siempre JSON-LD (`Schema.org`) adaptado al negocio (`LocalBusiness`, `Product`, `WebSite`, `FAQPage`, etc.).
  - **Rastreo:** Generar `sitemap.xml` y `robots.txt` optimizados automáticamente.
- **Fase Spec Kit:** aporta keywords, intención de búsqueda y rutas a `spec.md`; define el esqueleto semántico y los metadatos en `plan.md`.

## 4. Protocolo de Evolución de Skills (Auto-Adaptación)
Si una tarea requiere una tecnología nueva, una integración compleja o un patrón visual recurrente:
1. **Detección:** Evaluar si existe una skill local para resolverlo de forma óptima. Las skills del proyecto viven en `.claude/skills/`; las de Spec Kit (`speckit-*`) ya están instaladas ahí.
2. **Creación/Adaptación:** Si no existe o se ha quedado obsoleta, proponer o actualizar la skill documentando el patrón limpio, los snippets reutilizables y los errores comunes a evitar. Las skills `speckit-*` no se editan a mano (las regenera `specify integration upgrade`); para adaptar su salida se usan plantillas propias en `.specify/templates/overrides/`.
3. **Persistencia:** Registrar en `MEMORY.md` qué nueva skill o estándar técnico se ha incorporado al flujo de trabajo. Si el estándar es innegociable, va a la constitución.

---

## 5. Flujo de Ejecución Estándar: Spec-Driven Development (Spec Kit)

El proyecto trabaja con [GitHub Spec Kit](https://github.com/github/spec-kit): primero se escribe la especificación, de ella sale el plan, del plan las tareas y de las tareas el código.

### Dónde vive cada cosa
| Archivo | Contenido | Cuándo cambia |
|---|---|---|
| `.specify/memory/constitution.md` | Principios innegociables (puertas de calidad) | Rara vez, con `/speckit-constitution` |
| `AGENTS.md` | Roles y flujo de trabajo | Cuando cambia la forma de trabajar |
| `MEMORY.md` | Estado real del proyecto: stack, mapa del código, ADR, auditoría | Al cerrar cada funcionalidad |
| `specs/NNN-nombre/` | `spec.md`, `plan.md`, `tasks.md` y anexos de cada funcionalidad | Durante su ciclo |

### Ciclo por funcionalidad
| # | Comando | Responsable | Resultado |
|---|---|---|---|
| 0 | (lectura) | Todos | Leer `MEMORY.md` y la constitución |
| 1 | `/speckit-specify <descripción>` | `@Agent-UI-UX` + `@Agent-SEO` | Rama `NNN-nombre` + `specs/NNN-nombre/spec.md`: qué y por qué, sin tecnología |
| 2 | `/speckit-clarify` (si hay ambigüedad) | Quien especifica | Preguntas al usuario; respuestas dentro de `spec.md` |
| 3 | `/speckit-plan <stack y restricciones>` | `@Agent-Architect` + `@Agent-SEO` | `plan.md`, `research.md` (con las guías de Modern Web Guidance aplicadas), `data-model.md`, `contracts/`; Constitution Check superado |
| 4 | `/speckit-tasks` | `@Agent-Architect` | `tasks.md` ordenado por historia de usuario |
| 5 | `/speckit-analyze` (recomendado) | `@Agent-Architect` | Informe de coherencia spec ↔ plan ↔ tareas; no modifica archivos |
| 6 | `/speckit-implement` | `@Agent-UI-UX` + `@Agent-Architect` | Código (consultando antes la guía web moderna); cada tarea se marca `[X]` en `tasks.md` |
| 7 | `/speckit-checklist seguridad` · `rendimiento` · `seo` | `@Agent-SecOps` + `@Agent-Performance` + `@Agent-SEO` | Auditoría previa a la entrega en `checklists/`, con el resumen de `legacy-scan` |
| 8 | `/speckit-converge` | `@Agent-Architect` | Compara el código con spec/plan/tareas y añade lo que falte (incluidos los hallazgos de `legacy-scan` sin resolver); se repite 6-8 hasta `Converged` |
| 9 | (memoria) | Todos | Actualizar `MEMORY.md`: mapa del código, ADR, checklist de auditoría |
| 10 | (fusión) | `@Agent-Architect` | `git merge --no-ff NNN-nombre` en `main` y borrar la rama |

### Reglas del ciclo
- **Todo pasa por el ciclo:** cualquier cambio de código o de datos, incluidas correcciones de texto, ajustes de estilo y arreglos de un solo archivo, empieza con `/speckit-specify`. En los cambios pequeños la spec puede ser breve, pero existe.
- **El usuario habla con sus palabras:** cuando pida algo ("quiero que..."), el agente lanza él mismo el ciclo y se detiene para preguntar en `clarify`, antes de implementar si el cambio es grande, y antes de fusionar en `main`.
- **Puertas antes de dar una tarea por cerrada:** las que fije la constitución (en un proyecto Node: `npm run typecheck`, `npm test` y `npm run build`).
- **Al planificar:** pasar a `/speckit-plan` el stack de `MEMORY.md` §3. Si el proyecto usa Next.js, leer antes la guía correspondiente en `node_modules/next/dist/docs/` (la versión instalada puede tener cambios incompatibles).
- **Una rama por funcionalidad (extensión `git` de Spec Kit):**
  - `/speckit-specify` crea automáticamente la rama `NNN-nombre` (numeración secuencial, la misma que la carpeta `specs/NNN-nombre/`). Lanzarlo siempre desde `main` actualizado.
  - Nunca se trabaja directamente sobre `main`.
  - Antes y después de cada comando del ciclo, Spec Kit ofrece hacer commit de lo pendiente (`/speckit-git-commit`). Aceptarlo mantiene un commit por fase.
  - Para retomar una funcionalidad: `git switch NNN-nombre` y apuntar `.specify/feature.json` a `specs/NNN-nombre` (o definir `SPECIFY_FEATURE_DIRECTORY`).
  - Cierre: cuando `/speckit-converge` informa `Converged` y pasan las puertas, se fusiona en `main` (`git switch main` y `git merge --no-ff NNN-nombre`) y se borra la rama.
  - `/speckit-git-validate` comprueba que el nombre de la rama actual cumple la convención.
- **Mantenimiento:** `uv tool install --force specify-cli` actualiza la CLI y `specify integration upgrade` regenera las skills.

### Guía de plataforma web moderna (Modern Web Guidance)
[Modern Web Guidance](https://github.com/GoogleChrome/modern-web-guidance) (Google Chrome, Edge, Firefox y MDN) devuelve al agente patrones modernos de la plataforma web, trampas conocidas y alternativas para navegadores antiguos, para no escribir código obsoleto de memoria. Es una herramienta de desarrollo: no se publica ni añade nada a la web.

- **Comandos** (el CLI funciona sin instalar; la búsqueda es local y sin claves):
  - `npx modern-web-guidance@latest search "<consulta en inglés>"` → lista de guías con su `id`.
  - `npx modern-web-guidance@latest retrieve <id>[,<id>]` → patrón, trampas y alternativa.
  - `npx modern-web-guidance@latest legacy-scan . --json` → patrones obsoletos con archivo y línea (resultado provisional).
- **Cuándo se consulta:**
  - `/speckit-plan`: por cada función de plataforma del plan; las guías aplicadas (id) o "sin guía" quedan en `research.md`.
  - `/speckit-implement`: antes de escribir HTML, CSS o JS de plataforma (diálogos, animaciones, imágenes, formularios, accesibilidad, rendimiento).
  - `/speckit-checklist rendimiento`: `legacy-scan`, ignorando `specs/`; el resumen va a `checklists/` y cada hallazgo se corrige o se justifica. Los pendientes pasan a `/speckit-converge`.
- **La constitución prevalece:** la guía es orientativa. Se descartan o adaptan las recomendaciones que pidan recursos de terceros, un paso de build o funciones experimentales. Si no hay guía, no hay red o la herramienta falla, se continúa con el criterio habitual y se anota; nunca bloquea una tarea.
- **Privacidad:** Google recoge de forma anónima las consultas de búsqueda, los `id` de guías y el nombre del agente. Por eso `.claude/settings.json` fija `DISABLE_TELEMETRY=1`, y las consultas describen solo la función de plataforma (p. ej. `"animate a dialog modal backdrop"`), sin nombres del proyecto, teléfonos, rutas ni datos de las prendas.
- **Funciones experimentales:** no se crea `.mwgrc`; las guías de Origin Trials y de funciones de un solo motor siguen bloqueadas en `retrieve`.
- **Disponibilidad:** `.claude/settings.json` declara el marketplace `googlechrome` y habilita el plugin `modern-web-guidance@googlechrome`; se aplica al abrir o reiniciar una sesión en el proyecto.
- **Sin molestar a otras sesiones:** no ejecutar `/plugin`, `/reload-plugins` ni `npx modern-web-guidance@latest install` mientras haya otras sesiones abiertas (la instalación es a nivel de usuario y la recarga alcanza a las sesiones abiertas). Si otra sesión usa la carpeta principal, trabajar en un worktree (`git worktree add --detach ../slac-<nombre> main`) y crear ahí la rama del ciclo.
- **Actualizar:** el plugin con `/plugin` (marketplace `googlechrome`, activar actualización automática; el plugin de `claude-plugins-official` quedó parado en v0.0.194) o, si se instaló con el asistente, `npx modern-web-guidance@latest update`. El CLI por `npx @latest` siempre trae el contenido al día.

