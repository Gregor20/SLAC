# Especificación: Correo del titular y dominio

**Rama**: `007-privacidad-repositorio` (cambio pequeño, sobre la misma rama) · **Estado**: implementada

## Qué y por qué
El titular ha facilitado el correo para el aviso legal y ya tiene dominio (`https://slac-official.com`).

## Requisitos
- **FR-001**: El aviso legal muestra el correo del titular como texto (sin enlace `mailto:`, constitución IV).
- **FR-002**: El correo real no aparece en el repositorio ni en su historial; el repo lleva `[CORREO]` (filtro `privado`, ver 007).
- **FR-003**: El dominio se aplica con `npm run dominio -- https://slac-official.com` (canonical, og, sitemap, robots y JSON-LD coherentes).
- **FR-004**: El aviso de «ANTES DE PUBLICAR» deja de pedir el correo; solo queda el domicilio.

## Criterios de éxito
- `npm run verificar` pasa; `git grep` del correo real sobre todos los commits da 0 resultados.
