# Especificación: Despliegue en Cloudflare Workers (recursos estáticos)

**Rama**: `010-despliegue-workers` · **Estado**: implementada

- **FR-001**: Solo se publica `dist/` (generado por `npm run publicar`) con `npx wrangler deploy --assets dist --name slac`.
- **FR-002**: No se usa `wrangler pages ...` ni `wrangler deploy` sin `--assets`: delegan en Workers y su autoconfiguración sube la carpeta entera.
- **Incidente**: la primera ejecución publicó 755 archivos de la raíz (admin, originales, documentos); el Worker se eliminó y se revirtió la configuración local.
- **SC-001**: `admin.html`, `MEMORY.md`, `scripts/` y `public/fotos/` → 404; cabeceras de `_headers` presentes; datos reales visibles solo donde corresponde.
