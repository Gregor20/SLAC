# Especificación: Privacidad del repositorio

**Rama**: `007-privacidad-repositorio` · **Estado**: implementada

## Qué y por qué
El repositorio se va a publicar en GitHub. Los datos de contacto reales (teléfono e Instagram del titular) no deben
verse en el repositorio remoto ni en su historial, pero la web sigue funcionando en local con los datos reales.

## Requisitos
- **FR-001**: Ningún archivo ni commit del repositorio contiene el teléfono real ni el Instagram real; llevan los
  marcadores `+34 000 000 000` y `[INSTAGRAM]`.
- **FR-002**: En la copia local de trabajo, `data/galeria.js` y `aviso-legal.html` conservan los datos reales y la web,
  `npm run verificar` y el panel de administración funcionan igual que antes.
- **FR-003**: Al hacer commit, esos dos archivos se guardan siempre con marcadores (filtro git `privado`, declarado en
  `.gitattributes` y definido solo en la configuración local de git).
- **FR-004**: Las rutas personales de la máquina de desarrollo desaparecen de los documentos.
- **FR-005**: Un clon nuevo, sin el filtro, es válido: lleva los marcadores y se rellenan a mano.

## Criterios de éxito
- **SC-001**: `git grep` de los datos reales sobre todos los commits da 0 resultados.
- **SC-002**: `git status` no muestra como modificados `data/galeria.js` ni `aviso-legal.html` con los datos reales locales.
- **SC-003**: `npm run verificar` pasa en local.

## Fuera de alcance
Las fotos originales de `public/fotos/` siguen en el repositorio (decisión del usuario).
