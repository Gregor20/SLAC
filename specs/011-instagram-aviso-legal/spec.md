# Especificación: Enlace al Instagram en el aviso legal

**Rama**: `011-instagram-aviso-legal` · **Estado**: implementada

## Qué y por qué
El titular quiere que el Instagram del aviso legal sea un enlace directo a su perfil (antes era solo texto, ADR 005).

## Requisitos
- **FR-001**: En `aviso-legal.html` el Instagram es un enlace a `https://www.instagram.com/<perfil>/` con `target="_blank"` y `rel="noopener noreferrer"`.
- **FR-002**: Es el único enlace a Instagram y solo existe en el aviso legal; la página principal sigue sin él (principio I).
- **FR-003**: Constitución 1.3.0 (MINOR): el principio IV admite ese enlace además de `tel:` y `wa.me`. `verificar` lo permite solo en `aviso-legal.html`.
- **FR-004**: El perfil real no está en el repositorio (marcador `[INSTAGRAM]`, filtro `privado`).

## Criterios de éxito
- `npm run verificar` correcto; un enlace a Instagram en otra página sigue dando error.
