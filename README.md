# SLAC — Web informativa

Web informativa, estática y de una sola página: una galería de fotos pensada para verse cómodamente desde el móvil, con diseño oscuro y editorial en el que mandan las imágenes.

Este repositorio es, además, un **ejemplo práctico de desarrollo web con IA y agentes**: el proyecto lo he desarrollado yo de principio a fin trabajando con [Claude Code](https://claude.com/claude-code), organizando el trabajo en varios agentes especializados y con una metodología que permite retomarlo en cualquier sesión sin perder el contexto.

---

## Qué es

- Web **meramente informativa**: galería de fotos, visor a pantalla completa y contacto.
- Aviso legal en página aparte.
- **Sin framework ni paso de compilación**: HTML, CSS y JavaScript nativos. La web publicada no tiene dependencias.
- Pensada para **rendimiento, accesibilidad, seguridad y SEO técnico** desde el primer día (Lighthouse móvil: 98-99 / 100 / 100 / 100).

## Tecnologías

### La web
| Área | Tecnología |
|---|---|
| Marcado, estilos y lógica | HTML5 semántico, CSS moderno (variables CSS, `<dialog>`, `prefers-reduced-motion`) y JavaScript sin dependencias |
| Imágenes | AVIF con WebP de respaldo mediante `<picture>` y `srcset`, dimensiones explícitas y carga diferida |
| Tipografías | Autoalojadas (`woff2`, `font-display: swap`), sin recursos de terceros |
| Seguridad | Content Security Policy, saneado de contenido dinámico, sin recursos externos |
| SEO | HTML semántico, metadatos, OpenGraph, JSON-LD (Schema.org), `sitemap.xml` y `robots.txt` |
| Accesibilidad | Contraste WCAG AA, navegación por teclado, visor con `<dialog>` nativo |

### Herramientas de desarrollo (Node.js ≥ 18.17)
- **[sharp](https://sharp.pixelplumbing.com/)**: optimización y generación de imágenes (AVIF/WebP en varios tamaños).
- **Scripts propios** en `scripts/`:
  - `optimizar`: genera las imágenes optimizadas.
  - `verificar`: puerta de calidad (datos, imágenes, SEO y coherencia).
  - `dev`: servidor local con recarga automática.
  - `dominio`: configura canonical, sitemap y JSON-LD cuando hay dominio.

```bash
npm install
npm run dev         # servidor local
npm run optimizar   # optimiza las imágenes
npm run verificar   # comprueba que todo está correcto
```

## Cómo está desarrollada: IA + agentes

Todo el código y la documentación se han producido trabajando con **Claude Code** como colaborador, siguiendo un flujo definido y repetible en lugar de pedir cosas sueltas.

### Varios agentes con roles definidos (`AGENTS.md`)
El trabajo se reparte entre sub-agentes especializados, cada uno con sus reglas:

| Agente | Responsabilidad |
|---|---|
| **Architect** | Estructura, arquitectura limpia, plan y tareas |
| **UI-UX** | Diseño, micro-interacciones, accesibilidad y mobile-first |
| **Performance** | Core Web Vitals, imágenes, fuentes y carga |
| **SecOps** | Cabeceras, validación, secretos y dependencias |
| **SEO** | Semántica, metadatos, datos estructurados y rastreo |

### Memoria persistente entre sesiones (`MEMORY.md`)
Una IA no recuerda la conversación anterior, así que el proyecto guarda su **estado real** en `MEMORY.md`: identidad del proyecto, sistema de diseño, stack, mapa del código, decisiones de arquitectura (ADR), estado de las auditorías y lecciones aprendidas. Cada sesión empieza leyéndolo y termina actualizándolo, de modo que el trabajo continúa sin perder contexto entre sesiones.

### Desarrollo guiado por especificaciones ([GitHub Spec Kit](https://github.com/github/spec-kit))
Cada cambio sigue el mismo ciclo, con su propia rama y su carpeta en `specs/`:

```
specify → clarify → plan → tasks → analyze → implement → checklist → converge → merge
```

- **Constitución** (`.specify/memory/constitution.md`): principios innegociables que actúan como puertas de calidad.
- **`specs/NNN-nombre/`**: especificación, plan, tareas y auditorías de cada funcionalidad (hay seis hasta ahora).
- **Una rama por funcionalidad**, con commits por fase y fusión a `main` solo cuando todo converge.

### Modern Web Guidance (Google Chrome)
Se usa [Modern Web Guidance](https://github.com/GoogleChrome/modern-web-guidance), la herramienta de Google Chrome, Edge, Firefox y MDN que da a los agentes patrones modernos de la plataforma web, sus trampas conocidas y alternativas. Evita que la IA escriba código obsoleto de memoria. Se consulta al planificar, al implementar y al auditar (con `legacy-scan` para detectar patrones antiguos).

### Otras piezas del flujo
- **Skills de Claude Code** (`.claude/skills/`): comandos reutilizables del ciclo de especificación.
- **Configuración compartida** (`.claude/settings.json`): marketplace y plugin habilitados para que cualquiera que abra el proyecto tenga el mismo entorno.
- **Auditorías automatizadas**: scripts propios y Lighthouse como comprobación previa a cada entrega.

## Estructura del proyecto

```
├── index.html, aviso-legal.html   Páginas
├── styles.css, legal.css, visor.css   Estilos
├── app.js, lib.js, visor.js       Lógica de la web
├── data/                          Datos de la galería
├── public/                        Fuentes e imágenes
├── scripts/                       Herramientas de desarrollo y verificación
├── specs/                         Especificaciones, planes y tareas por funcionalidad
├── .specify/                      Constitución y plantillas de Spec Kit
├── .claude/                       Skills y configuración de Claude Code
├── AGENTS.md                      Roles de los agentes y flujo de trabajo
└── MEMORY.md                      Memoria persistente del proyecto
```

## Qué demuestra este proyecto

- Cómo desarrollar webs de forma **eficiente y ordenada** apoyándose en IA, sin perder el control de la calidad.
- Uso de **agentes especializados**, **memoria persistente** y **desarrollo guiado por especificaciones**.
- Una web real con foco en **rendimiento, seguridad, accesibilidad y SEO** medidos y verificados, no solo declarados.

---

Desarrollado por **Grigoriy** con Claude Code.
