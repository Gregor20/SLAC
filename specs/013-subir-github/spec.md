# Especificación: Publicar el repositorio en GitHub

**Rama**: `013-subir-github` · **Estado**: implementada

- **FR-001**: El repositorio remoto es `https://github.com/Gregor20/SLAC.git` (rama `main`).
- **FR-002**: Ni los archivos ni el historial contienen datos personales: teléfono, correo, domicilio, Instagram, ni el correo del autor ni el nombre de la cuenta de Cloudflare.
- **FR-003**: Todos los commits usan el correo `noreply` de GitHub como autor y committer (también la configuración local de git del proyecto).
- **FR-004**: Las URLs `workers.dev` se documentan con `<cuenta>` en lugar del nombre real.
- **SC-001**: `git grep` de esos datos sobre todos los commits da 0 resultados antes de cada `git push`.
