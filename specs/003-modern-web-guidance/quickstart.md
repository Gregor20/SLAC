# Quickstart: validar Modern Web Guidance en el flujo

Desde la raíz del repositorio (rama `003-modern-web-guidance`).

## 1. Configuración compartida

```powershell
Get-Content .claude/settings.json | ConvertFrom-Json   # debe parsear sin error
```

Esperado: `env.DISABLE_TELEMETRY = "1"`, marketplace `googlechrome` y plugin
`modern-web-guidance@googlechrome` habilitado. No existe `.mwgrc`.

## 2. Consulta de ejemplo (SC-002)

```powershell
$env:DISABLE_TELEMETRY = '1'
npx --yes modern-web-guidance@latest search "animate a dialog modal backdrop"
npx --yes modern-web-guidance@latest retrieve animate-to-from-top-layer
```

Esperado: lista JSON de guías y, con `retrieve`, el contenido de la guía, en menos de 30 s.

## 3. Auditoría de patrones obsoletos

```powershell
npx --yes modern-web-guidance@latest legacy-scan . --json
```

Esperado: hallazgos como los de `research.md` §D7 (ignorando `_backup-original/` y `specs/`).

## 4. Documentación

- `AGENTS.md` indica consulta en plan, implementación y checklist (SC-001).
- La constitución está en 1.1.0 y dice que sus principios prevalecen sobre la guía.
- `MEMORY.md` tiene el ADR, el mapa y cómo actualizar.

## 5. Sin interferir y sin tocar la web (SC-003, SC-006)

```powershell
git diff --name-only main...HEAD
```

Esperado: solo `AGENTS.md`, `MEMORY.md`, `.specify/memory/constitution.md`,
`.claude/settings.json` y `specs/003-modern-web-guidance/**`. Ningún archivo de la web
(`index.html`, `styles.css`, `app.js`, `data/`, `public/`). Y `git -C ../slac branch --show-current`
sigue mostrando `002-optimizacion-fotos` con su árbol de trabajo intacto.

## 6. Puertas del proyecto

`npm run verificar` (necesita `npm install` en el worktree) sin errores; no cambia nada de la web.
