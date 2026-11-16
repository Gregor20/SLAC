# MEMORY.md — Memoria Persistente y Contexto del Proyecto

> **Instrucción para el Agente:** Lee este archivo al inicio de cada sesión y actualízalo automáticamente al finalizar cualquier tarea importante (nuevas rutas, cambios en el sistema de diseño, integraciones o auditorías).
>
> **Reparto con Spec Kit:** aquí va el *estado* del proyecto (qué hay y por qué). Los principios innegociables están en `.specify/memory/constitution.md`, el flujo de trabajo en `AGENTS.md` §5 y el detalle de cada funcionalidad en `specs/NNN-nombre/`. No duplicar aquí specs ni planes: enlazarlos.

---

## 1. Identidad del Proyecto
- **Nombre del Proyecto:** _(pendiente)_
- **Objetivo de Negocio:** _(pendiente)_
- **Público Objetivo:** _(pendiente)_
- **Keywords Principales (SEO):** _(pendiente)_
- **Pendiente de definir por el usuario:** _(marca, dominio, datos legales, integraciones…)_

---

## 2. Sistema de Diseño (Design Tokens Activos)
- **Dirección Estética:** _(pendiente)_
- **Paleta de Colores:** _(fondo, superficies, acento, texto, éxito/aviso)_
- **Tipografías:** _(pendiente)_
- **Reglas de Animación:** _(easing, duraciones, `prefers-reduced-motion`)_

---

## 3. Arquitectura y Stack Actual
- **Entorno / Framework:** _(pendiente: se decide en la primera funcionalidad)_
- **Hosting y Despliegue:** _(pendiente)_
- **Librerías Instaladas Clave:** _(pendiente)_
- **Mapa del código:** _(carpetas principales y qué contiene cada una)_
- **Variables de entorno:** _(ver `.env.example`)_
- **Metodología:** Spec-Driven Development con GitHub Spec Kit. Integración Claude Code con scripts PowerShell y extensión `git` (rama `NNN-nombre` por funcionalidad).
  - `.specify/memory/constitution.md` — constitución del proyecto.
  - `.claude/skills/speckit-*` — comandos del ciclo.
  - `specs/` — una carpeta `NNN-nombre` por funcionalidad.

---

## 4. Registro de Decisiones Arquitectónicas (ADR)
- **2026-11-16 — Inicialización:** proyecto creado desde `plantilla-agentes` con Spec Kit y git.

---

## 5. Estado de Auditoría Continua (Checklist de Control)
### Rendimiento (Core Web Vitals)
- [ ] Imágenes AVIF/WebP con dimensiones explícitas.
- [ ] Fuentes autoalojadas con `display: swap`.
- [ ] Medir con PageSpeed/Lighthouse una vez desplegado.

### Seguridad (SecOps)
- [ ] Inputs validados con Zod en cliente y servidor.
- [ ] `.env` fuera del repositorio.
- [ ] Cabeceras CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy.
- [ ] Rate limiting y protección anti-bots/CSRF en formularios.

### SEO Técnico
- [ ] Un único `<h1>` por vista y jerarquía H2 → H3.
- [ ] Title, description, canonical, OpenGraph y Twitter Card.
- [ ] JSON-LD adecuado al negocio.
- [ ] `sitemap.xml` y `robots.txt` generados.

---

## 6. Lecciones Aprendidas y Reglas del Usuario (Anti-Patrones)
- **Preferencia de código:** Directo al grano, sin abstracciones innecesarias ni dependencias pesadas si se resuelve con APIs nativas.
- **Flujo:** el usuario pide los cambios con sus palabras; el agente los pasa por el ciclo Spec Kit completo.
